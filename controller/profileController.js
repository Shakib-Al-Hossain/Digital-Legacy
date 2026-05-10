const User = require('../model/User');
const Contact = require('../model/Contact');
const nodemailer = require('nodemailer');
const { backupUserContent } = require('../utils/googleDriveService');

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name } = req.body;
        let user = await User.findById(req.user.id);
        if (name) user.name = name;
        if (!user.deadManTrigger) user.deadManTrigger = {};
        user.deadManTrigger.lastActive = Date.now();
        user.deadManTrigger.emailSent = false;
        await user.save();
        res.json(user);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.deactivateAccount = async (req, res) => {
    try {
        let user = await User.findById(req.user.id);
        user.isActive = false;
        await user.save();

        backupUserContent(user);

        res.json({ msg: 'Account deactivated successfully. You can export your data.' });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.addContact = async (req, res) => {
    try {
        const { contactEmail, contactName, relationship, accessLevel } = req.body;
        const newContact = new Contact({
            user: req.user.id,
            contactEmail,
            contactName,
            relationship,
            accessLevel
        });
        await newContact.save();
        res.json(newContact);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.getContacts = async (req, res) => {
    try {
        const contacts = await Contact.find({ user: req.user.id });
        res.json(contacts);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.updateDeadManTrigger = async (req, res) => {
    try {
        const { enabled, triggerDurationDays } = req.body;
        let user = await User.findById(req.user.id);
        user.deadManTrigger.enabled = enabled;
        user.deadManTrigger.triggerDurationDays = triggerDurationDays;
        await user.save();
        res.json(user.deadManTrigger);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.checkDeadManTrigger = async () => {
    try {

        const users = await User.find({
            'deadManTrigger.enabled': true
        });

        const now = new Date();

        for (const user of users) {

            const lastActive =
                new Date(user.deadManTrigger.lastActive);

            const diffDays =
                (now - lastActive) / (1000 * 60 * 60 * 24);

            if (
                diffDays >
                user.deadManTrigger.triggerDurationDays &&
                !user.deadManTrigger.emailSent
            ) {

                const contacts = await Contact.find({
                    user: user._id,
                    isTrusted: true
                });

                console.log(`Found ${contacts.length} trusted contacts for user ${user.email}`);

                for (const contact of contacts) {

                    const emailHtml = `
                        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
                            <h2 style="color: #d9534f; text-align: center;">Urgent: Dead Man Trigger Activated</h2>
                            <p>Hello <strong>${contact.contactName}</strong>,</p>
                            <p>You have been designated as a trusted contact by <strong>${user.name}</strong> on the Digital Legacy platform.</p>
                            <p>We are reaching out to inform you that ${user.name} has been inactive on the platform for more than <strong>${user.deadManTrigger.triggerDurationDays} days</strong>. As a result, their Dead Man Trigger has been activated.</p>
                            <p>As per their instructions, their secure digital vault or specific memories may now be accessible to you depending on your access level.</p>
                            <p style="text-align: center; margin-top: 30px;">
                                <a href="http://localhost:5173/login" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Log in to Digital Legacy</a>
                            </p>
                            <br>
                            <p style="font-size: 12px; color: #777; text-align: center;">Best regards,<br>The Digital Legacy Team</p>
                        </div>
                    `;

                    await transporter.sendMail({
                        from: process.env.EMAIL_USER,
                        to: contact.contactEmail,
                        subject: `Urgent: Dead Man Trigger Activated for ${user.name}`,
                        html: emailHtml
                    });
                    console.log(`Email successfully sent to ${contact.contactEmail}`);
                }

                user.deadManTrigger.emailSent = true;
                await user.save();
            }
        }

    } catch (err) {
        console.error(err);
    }
};