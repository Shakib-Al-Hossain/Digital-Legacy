const User = require('../model/User');
const Contact = require('../model/Contact');

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
        user.deadManTrigger.lastActive = Date.now();
        await user.save();
        res.json(user.deadManTrigger);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
};
