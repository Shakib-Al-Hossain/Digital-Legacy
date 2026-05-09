const LegacyMessage = require('../model/LegacyMessage');
const Distribution = require('../model/Distribution');
const Contact = require('../model/Contact');
const Memory = require('../model/Memory');
const Vault = require('../model/Vault');
const User = require('../model/User');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// ============================================
// EMAIL TRANSPORTER (reusable)
// ============================================
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// ============================================
// FEATURE 1: Create Future Legacy Messages
// ============================================
exports.createLegacyMessage = async (req, res) => {
    try {
        const { title, message, messageType, scheduledDate, releaseCondition } = req.body;

        // Debug logging
        console.log('[Legacy Create] req.body:', JSON.stringify(req.body));
        console.log('[Legacy Create] req.file:', req.file);

        // Parse recipients and assetAssignments (sent as JSON strings via FormData)
        let recipients = req.body.recipients;
        let assetAssignments = req.body.assetAssignments;
        try {
            if (typeof recipients === 'string') recipients = JSON.parse(recipients);
        } catch (e) { recipients = []; }
        try {
            if (typeof assetAssignments === 'string') assetAssignments = JSON.parse(assetAssignments);
        } catch (e) { assetAssignments = []; }

        // Validate scheduled date is in the future (only required for non-manual release)
        const condition = releaseCondition || 'Scheduled Date';
        if (condition !== 'Manual Release') {
            if (!scheduledDate || new Date(scheduledDate) <= new Date()) {
                return res.status(400).json({ msg: 'Scheduled date must be in the future' });
            }
        }

        // Build recipients array from contact IDs
        let recipientList = [];
        if (recipients && recipients.length > 0) {
            const contacts = await Contact.find({
                _id: { $in: recipients },
                user: req.user.id
            });
            recipientList = contacts.map(c => ({
                contact: c._id,
                contactEmail: c.contactEmail,
                contactName: c.contactName
            }));
        }

        // Build asset assignments
        let assetAssignmentList = [];
        if (assetAssignments && assetAssignments.length > 0) {
            for (const assignment of assetAssignments) {
                const contact = await Contact.findOne({ _id: assignment.contactId, user: req.user.id });
                if (contact) {
                    assetAssignmentList.push({
                        contact: contact._id,
                        contactEmail: contact.contactEmail,
                        contactName: contact.contactName,
                        memories: assignment.memoryIds || [],
                        personalNote: assignment.personalNote || ''
                    });
                }
            }
        }

        const legacyMessage = new LegacyMessage({
            user: req.user.id,
            title,
            message,
            messageType: messageType || 'Text',
            scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
            releaseCondition: condition,
            status: condition === 'Manual Release' ? 'Draft' : 'Scheduled',
            recipients: recipientList,
            assetAssignments: assetAssignmentList,
            attachmentPath: req.file ? req.file.path : undefined
        });

        await legacyMessage.save();

        const populated = await LegacyMessage.findById(legacyMessage._id)
            .populate('recipients.contact', 'contactName contactEmail')
            .populate('assetAssignments.contact', 'contactName contactEmail')
            .populate('assetAssignments.memories', 'title description category');

        res.status(201).json(populated);
    } catch (err) {
        console.error('Create legacy message error:', err.message);
        res.status(500).json({ msg: 'Failed to create legacy message' });
    }
};

// ============================================
// Get all legacy messages for current user
// ============================================
exports.getLegacyMessages = async (req, res) => {
    try {
        const messages = await LegacyMessage.find({ user: req.user.id })
            .populate('recipients.contact', 'contactName contactEmail')
            .populate('assetAssignments.contact', 'contactName contactEmail')
            .populate('assetAssignments.memories', 'title description category filePath')
            .sort({ createdAt: -1 });

        res.json(messages);
    } catch (err) {
        console.error('Get legacy messages error:', err.message);
        res.status(500).json({ msg: 'Failed to retrieve legacy messages' });
    }
};

// ============================================
// Get a single legacy message
// ============================================
exports.getLegacyMessageById = async (req, res) => {
    try {
        const message = await LegacyMessage.findOne({ _id: req.params.id, user: req.user.id })
            .populate('recipients.contact', 'contactName contactEmail')
            .populate('assetAssignments.contact', 'contactName contactEmail')
            .populate('assetAssignments.memories', 'title description category filePath');

        if (!message) {
            return res.status(404).json({ msg: 'Legacy message not found' });
        }

        res.json(message);
    } catch (err) {
        console.error('Get legacy message error:', err.message);
        res.status(500).json({ msg: 'Failed to retrieve legacy message' });
    }
};

// ============================================
// Update a legacy message (only if not yet released)
// ============================================
exports.updateLegacyMessage = async (req, res) => {
    try {
        const message = await LegacyMessage.findOne({ _id: req.params.id, user: req.user.id });

        if (!message) {
            return res.status(404).json({ msg: 'Legacy message not found' });
        }

        if (message.status === 'Released' || message.status === 'Delivered') {
            return res.status(400).json({ msg: 'Cannot edit a message that has already been released' });
        }

        const { title, messageContent, messageType, scheduledDate, releaseCondition, recipients, assetAssignments } = req.body;

        if (title) message.title = title;
        if (messageContent) message.message = messageContent;
        if (messageType) message.messageType = messageType;
        if (releaseCondition) message.releaseCondition = releaseCondition;

        if (scheduledDate) {
            if (new Date(scheduledDate) <= new Date()) {
                return res.status(400).json({ msg: 'Scheduled date must be in the future' });
            }
            message.scheduledDate = new Date(scheduledDate);
        }

        // Update recipients
        if (recipients && recipients.length > 0) {
            const contacts = await Contact.find({
                _id: { $in: recipients },
                user: req.user.id
            });
            message.recipients = contacts.map(c => ({
                contact: c._id,
                contactEmail: c.contactEmail,
                contactName: c.contactName
            }));
        }

        // Update asset assignments
        if (assetAssignments && assetAssignments.length > 0) {
            let assetAssignmentList = [];
            for (const assignment of assetAssignments) {
                const contact = await Contact.findOne({ _id: assignment.contactId, user: req.user.id });
                if (contact) {
                    assetAssignmentList.push({
                        contact: contact._id,
                        contactEmail: contact.contactEmail,
                        contactName: contact.contactName,
                        memories: assignment.memoryIds || [],
                        personalNote: assignment.personalNote || ''
                    });
                }
            }
            message.assetAssignments = assetAssignmentList;
        }

        await message.save();

        const populated = await LegacyMessage.findById(message._id)
            .populate('recipients.contact', 'contactName contactEmail')
            .populate('assetAssignments.contact', 'contactName contactEmail')
            .populate('assetAssignments.memories', 'title description category');

        res.json(populated);
    } catch (err) {
        console.error('Update legacy message error:', err.message);
        res.status(500).json({ msg: 'Failed to update legacy message' });
    }
};

// ============================================
// Delete a legacy message
// ============================================
exports.deleteLegacyMessage = async (req, res) => {
    try {
        const message = await LegacyMessage.findOne({ _id: req.params.id, user: req.user.id });

        if (!message) {
            return res.status(404).json({ msg: 'Legacy message not found' });
        }

        // Also delete associated distributions
        await Distribution.deleteMany({ legacyMessage: message._id });
        await LegacyMessage.findByIdAndDelete(message._id);

        res.json({ msg: 'Legacy message deleted successfully' });
    } catch (err) {
        console.error('Delete legacy message error:', err.message);
        res.status(500).json({ msg: 'Failed to delete legacy message' });
    }
};

// ============================================
// FEATURE 2: Schedule release dates and times
// (Handled in create/update + this reschedule endpoint)
// ============================================
exports.rescheduleMessage = async (req, res) => {
    try {
        const { scheduledDate } = req.body;

        if (new Date(scheduledDate) <= new Date()) {
            return res.status(400).json({ msg: 'New scheduled date must be in the future' });
        }

        const message = await LegacyMessage.findOne({ _id: req.params.id, user: req.user.id });

        if (!message) {
            return res.status(404).json({ msg: 'Legacy message not found' });
        }

        if (message.status === 'Released' || message.status === 'Delivered') {
            return res.status(400).json({ msg: 'Cannot reschedule a released message' });
        }

        message.scheduledDate = new Date(scheduledDate);
        message.status = 'Scheduled';
        await message.save();

        res.json({ msg: 'Message rescheduled successfully', message });
    } catch (err) {
        console.error('Reschedule error:', err.message);
        res.status(500).json({ msg: 'Failed to reschedule message' });
    }
};

// ============================================
// Manual release of a message
// ============================================
exports.manualRelease = async (req, res) => {
    try {
        const message = await LegacyMessage.findOne({ _id: req.params.id, user: req.user.id })
            .populate('assetAssignments.memories', 'title description category filePath');

        if (!message) {
            return res.status(404).json({ msg: 'Legacy message not found' });
        }

        if (message.status !== 'Scheduled' && message.status !== 'Draft') {
            return res.status(400).json({ msg: 'Message has already been released' });
        }

        // Perform the distribution
        await distributeMessage(message);

        res.json({ msg: 'Message released and distributed successfully' });
    } catch (err) {
        console.error('Manual release error:', err.message);
        res.status(500).json({ msg: 'Failed to release message' });
    }
};

// ============================================
// FEATURE 3: Automated Distribution
// This function is called by the scheduler
// ============================================
async function distributeMessage(legacyMessage) {
    try {
        const transporter = createTransporter();
        const sender = await User.findById(legacyMessage.user);

        if (!sender) {
            console.error('Sender not found for message:', legacyMessage._id);
            return;
        }

        // Distribute to all recipients
        for (const recipient of legacyMessage.recipients) {
            try {
                // Check if this recipient also has asset assignments
                const assetAssignment = legacyMessage.assetAssignments.find(
                    a => a.contactEmail === recipient.contactEmail
                );

                let emailBody = `
Dear ${recipient.contactName},

${sender.name} has left you a legacy message through Digital Legacy:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${legacyMessage.title}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${legacyMessage.message}
`;

                let distributionType = 'Message';

                // If there are specific assets assigned to this contact
                let attachments = [];

                // Attach the legacy message's own file attachment if it exists
                if (legacyMessage.attachmentPath) {
                    const msgAttachPath = path.resolve(__dirname, '..', legacyMessage.attachmentPath);
                    if (fs.existsSync(msgAttachPath)) {
                        attachments.push({
                            filename: legacyMessage.title + path.extname(legacyMessage.attachmentPath),
                            path: msgAttachPath
                        });
                    } else {
                        console.warn(`[Legacy Distribution] Message attachment file not found: ${msgAttachPath}`);
                    }
                }

                if (assetAssignment && assetAssignment.memories && assetAssignment.memories.length > 0) {
                    distributionType = 'Both';
                    emailBody += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nAssigned Assets (attached below):\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

                    for (const memory of assetAssignment.memories) {
                        const memDoc = typeof memory === 'object' ? memory : await Memory.findById(memory);
                        if (memDoc) {
                            emailBody += `• ${memDoc.title} (${memDoc.category || 'General'})\n`;
                            if (memDoc.description) emailBody += `  ${memDoc.description}\n`;
                            // Attach the actual file
                            if (memDoc.filePath) {
                                const fullPath = path.resolve(__dirname, '..', memDoc.filePath);
                                if (fs.existsSync(fullPath)) {
                                    attachments.push({
                                        filename: memDoc.title + path.extname(memDoc.filePath),
                                        path: fullPath
                                    });
                                } else {
                                    console.warn(`[Legacy Distribution] Memory file not found: ${fullPath} (memory: ${memDoc.title})`);
                                }
                            } else {
                                console.warn(`[Legacy Distribution] Memory has no filePath: ${memDoc.title} (${memDoc._id})`);
                            }
                        }
                    }

                    if (assetAssignment.personalNote) {
                        emailBody += `\nPersonal Note: ${assetAssignment.personalNote}\n`;
                    }
                }

                emailBody += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nThis message was sent through Digital Legacy - Memory Preservation System.\nPlease log in as a Legacy Contact to view and access your released assets.\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

                // Send email with file attachments
                await transporter.sendMail({
                    from: `"Digital Legacy" <${process.env.EMAIL_USER}>`,
                    to: recipient.contactEmail,
                    subject: `Legacy Message from ${sender.name}: ${legacyMessage.title}`,
                    text: emailBody,
                    attachments: attachments
                });

                // Create distribution record
                const distribution = new Distribution({
                    legacyMessage: legacyMessage._id,
                    sender: legacyMessage.user,
                    recipientEmail: recipient.contactEmail,
                    recipientName: recipient.contactName,
                    status: 'Delivered',
                    sentAt: new Date(),
                    deliveredAt: new Date(),
                    distributionType,
                    assignedMemories: assetAssignment ? assetAssignment.memories.map(m => typeof m === 'object' ? m._id : m) : [],
                    personalNote: assetAssignment ? assetAssignment.personalNote : '',
                    notificationSent: true,
                    notificationSentAt: new Date()
                });

                await distribution.save();

                console.log(`[Legacy Distribution] Successfully delivered to ${recipient.contactEmail}`);

            } catch (emailErr) {
                console.error(`[Legacy Distribution] Failed to deliver to ${recipient.contactEmail}:`, emailErr.message);

                // Record the failure
                const distribution = new Distribution({
                    legacyMessage: legacyMessage._id,
                    sender: legacyMessage.user,
                    recipientEmail: recipient.contactEmail,
                    recipientName: recipient.contactName,
                    status: 'Failed',
                    sentAt: new Date(),
                    failureReason: emailErr.message,
                    distributionType: 'Message',
                    notificationSent: false
                });

                await distribution.save();
            }
        }

        // Handle asset-only assignments (contacts with assets but not in the recipients list)
        for (const assignment of legacyMessage.assetAssignments) {
            const alreadySent = legacyMessage.recipients.some(r => r.contactEmail === assignment.contactEmail);
            if (!alreadySent) {
                try {
                    let emailBody = `
Dear ${assignment.contactName},

${sender.name} has assigned you specific legacy assets through Digital Legacy:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Assigned Assets:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
                    let assetAttachments = [];

                    // Attach the legacy message's own file attachment if it exists
                    if (legacyMessage.attachmentPath) {
                        const msgAttachPath = path.resolve(__dirname, '..', legacyMessage.attachmentPath);
                        if (fs.existsSync(msgAttachPath)) {
                            assetAttachments.push({
                                filename: legacyMessage.title + path.extname(legacyMessage.attachmentPath),
                                path: msgAttachPath
                            });
                        } else {
                            console.warn(`[Legacy Distribution] Message attachment file not found: ${msgAttachPath}`);
                        }
                    }

                    for (const memory of assignment.memories) {
                        const memDoc = typeof memory === 'object' ? memory : await Memory.findById(memory);
                        if (memDoc) {
                            emailBody += `• ${memDoc.title} (${memDoc.category || 'General'})\n`;
                            if (memDoc.description) emailBody += `  ${memDoc.description}\n`;
                            // Attach the actual file
                            if (memDoc.filePath) {
                                const fullPath = path.resolve(__dirname, '..', memDoc.filePath);
                                if (fs.existsSync(fullPath)) {
                                    assetAttachments.push({
                                        filename: memDoc.title + path.extname(memDoc.filePath),
                                        path: fullPath
                                    });
                                } else {
                                    console.warn(`[Legacy Distribution] Memory file not found: ${fullPath} (memory: ${memDoc.title})`);
                                }
                            } else {
                                console.warn(`[Legacy Distribution] Memory has no filePath: ${memDoc.title} (${memDoc._id})`);
                            }
                        }
                    }

                    if (assignment.personalNote) {
                        emailBody += `\nPersonal Note: ${assignment.personalNote}\n`;
                    }

                    emailBody += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nPlease log in as a Legacy Contact to view and access your released assets.\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

                    await transporter.sendMail({
                        from: `"Digital Legacy" <${process.env.EMAIL_USER}>`,
                        to: assignment.contactEmail,
                        subject: `Legacy Assets Released by ${sender.name}`,
                        text: emailBody,
                        attachments: assetAttachments
                    });

                    const distribution = new Distribution({
                        legacyMessage: legacyMessage._id,
                        sender: legacyMessage.user,
                        recipientEmail: assignment.contactEmail,
                        recipientName: assignment.contactName,
                        status: 'Delivered',
                        sentAt: new Date(),
                        deliveredAt: new Date(),
                        distributionType: 'Asset',
                        assignedMemories: assignment.memories.map(m => typeof m === 'object' ? m._id : m),
                        personalNote: assignment.personalNote,
                        notificationSent: true,
                        notificationSentAt: new Date()
                    });

                    await distribution.save();

                } catch (emailErr) {
                    console.error(`[Legacy Distribution] Asset delivery failed to ${assignment.contactEmail}:`, emailErr.message);

                    const distribution = new Distribution({
                        legacyMessage: legacyMessage._id,
                        sender: legacyMessage.user,
                        recipientEmail: assignment.contactEmail,
                        recipientName: assignment.contactName,
                        status: 'Failed',
                        sentAt: new Date(),
                        failureReason: emailErr.message,
                        distributionType: 'Asset',
                        notificationSent: false
                    });

                    await distribution.save();
                }
            }
        }

        // Update message status
        legacyMessage.status = 'Released';
        legacyMessage.releasedAt = new Date();
        await legacyMessage.save();

        // Check if all distributions were successful
        const allDistributions = await Distribution.find({ legacyMessage: legacyMessage._id });
        const allDelivered = allDistributions.every(d => d.status === 'Delivered');

        if (allDelivered && allDistributions.length > 0) {
            legacyMessage.status = 'Delivered';
            await legacyMessage.save();
        }

    } catch (err) {
        console.error('[Legacy Distribution] Error during distribution:', err.message);
        legacyMessage.status = 'Failed';
        await legacyMessage.save();
    }
}

// ============================================
// AUTOMATED SCHEDULER - checks every 60 seconds
// ============================================
exports.startScheduler = () => {
    console.log('[Legacy Scheduler] Started - checking every 60 seconds');

    setInterval(async () => {
        try {
            const now = new Date();

            // Find all scheduled messages that are due
            const dueMessages = await LegacyMessage.find({
                status: 'Scheduled',
                scheduledDate: { $lte: now },
                releaseCondition: { $in: ['Scheduled Date', 'Dead-Man Trigger'] }
            }).populate('assetAssignments.memories', 'title description category filePath');

            if (dueMessages.length > 0) {
                console.log(`[Legacy Scheduler] Found ${dueMessages.length} message(s) due for distribution`);
            }

            for (const message of dueMessages) {
                console.log(`[Legacy Scheduler] Distributing: "${message.title}"`);
                await distributeMessage(message);
            }

            // Also check for Dead-Man Trigger releases
            const deadManUsers = await User.find({
                'deadManTrigger.enabled': true,
                isActive: true
            });

            for (const user of deadManUsers) {
                const lastActive = new Date(user.deadManTrigger.lastActive);
                const triggerDays = user.deadManTrigger.triggerDurationDays || 30;
                const triggerDate = new Date(lastActive.getTime() + triggerDays * 24 * 60 * 60 * 1000);

                if (now >= triggerDate) {
                    // Find unreleased messages with Dead-Man Trigger condition
                    const deadManMessages = await LegacyMessage.find({
                        user: user._id,
                        status: 'Scheduled',
                        releaseCondition: 'Dead-Man Trigger'
                    }).populate('assetAssignments.memories', 'title description category filePath');

                    for (const msg of deadManMessages) {
                        console.log(`[Legacy Scheduler] Dead-Man Trigger releasing: "${msg.title}" for user ${user.email}`);
                        await distributeMessage(msg);
                    }
                }
            }

        } catch (err) {
            console.error('[Legacy Scheduler] Error:', err.message);
        }
    }, 60000); // Every 60 seconds
};

// ============================================
// FEATURE 4: Track delivery and release status
// ============================================
exports.getDistributionLog = async (req, res) => {
    try {
        const distributions = await Distribution.find({ sender: req.user.id })
            .populate('legacyMessage', 'title status scheduledDate')
            .populate('assignedMemories', 'title category')
            .sort({ createdAt: -1 });

        res.json(distributions);
    } catch (err) {
        console.error('Get distribution log error:', err.message);
        res.status(500).json({ msg: 'Failed to retrieve distribution log' });
    }
};

// Get distribution stats
exports.getDistributionStats = async (req, res) => {
    try {
        const totalMessages = await LegacyMessage.countDocuments({ user: req.user.id });
        const scheduledMessages = await LegacyMessage.countDocuments({ user: req.user.id, status: 'Scheduled' });
        const releasedMessages = await LegacyMessage.countDocuments({ user: req.user.id, status: { $in: ['Released', 'Delivered'] } });
        const failedMessages = await LegacyMessage.countDocuments({ user: req.user.id, status: 'Failed' });

        const totalDistributions = await Distribution.countDocuments({ sender: req.user.id });
        const deliveredDistributions = await Distribution.countDocuments({ sender: req.user.id, status: 'Delivered' });
        const failedDistributions = await Distribution.countDocuments({ sender: req.user.id, status: 'Failed' });
        const pendingDistributions = await Distribution.countDocuments({ sender: req.user.id, status: 'Pending' });

        res.json({
            messages: {
                total: totalMessages,
                scheduled: scheduledMessages,
                released: releasedMessages,
                failed: failedMessages
            },
            distributions: {
                total: totalDistributions,
                delivered: deliveredDistributions,
                failed: failedDistributions,
                pending: pendingDistributions
            }
        });
    } catch (err) {
        console.error('Get distribution stats error:', err.message);
        res.status(500).json({ msg: 'Failed to retrieve stats' });
    }
};

// ============================================
// FEATURE 5: Asset Distribution - get user's memories for assignment
// ============================================
exports.getUserMemories = async (req, res) => {
    try {
        const vaults = await Vault.find({ user: req.user.id });
        const vaultIds = vaults.map(v => v._id);

        const memories = await Memory.find({ vault: { $in: vaultIds } })
            .sort({ createdAt: -1 });

        res.json(memories);
    } catch (err) {
        console.error('Get user memories error:', err.message);
        res.status(500).json({ msg: 'Failed to retrieve memories' });
    }
};

// ============================================
// FEATURE 6: Legacy contacts receive notifications
// (This endpoint lets Legacy Contacts view what was released to them)
// ============================================
exports.getReleasedAssetsForContact = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Find all distributions sent to this user's email
        const distributions = await Distribution.find({
            recipientEmail: user.email,
            status: { $in: ['Delivered', 'Sent'] }
        })
            .populate('legacyMessage', 'title message messageType releasedAt')
            .populate('sender', 'name email')
            .populate('assignedMemories', 'title description category filePath')
            .sort({ deliveredAt: -1 });

        res.json(distributions);
    } catch (err) {
        console.error('Get released assets error:', err.message);
        res.status(500).json({ msg: 'Failed to retrieve released assets' });
    }
};

// Retry a failed distribution
exports.retryDistribution = async (req, res) => {
    try {
        const distribution = await Distribution.findById(req.params.id)
            .populate('assignedMemories', 'title description category filePath');

        if (!distribution) {
            return res.status(404).json({ msg: 'Distribution record not found' });
        }

        if (distribution.sender.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        if (distribution.status !== 'Failed') {
            return res.status(400).json({ msg: 'Can only retry failed distributions' });
        }

        const legacyMessage = await LegacyMessage.findById(distribution.legacyMessage);
        const sender = await User.findById(distribution.sender);

        try {
            const transporter = createTransporter();

            let emailBody = `
Dear ${distribution.recipientName},

${sender.name} has left you a legacy message through Digital Legacy:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${legacyMessage.title}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${legacyMessage.message}
`;

            // Build attachments for the retry
            let attachments = [];

            // Attach the legacy message's own file if it exists
            if (legacyMessage.attachmentPath) {
                const msgAttachPath = path.resolve(__dirname, '..', legacyMessage.attachmentPath);
                if (fs.existsSync(msgAttachPath)) {
                    attachments.push({
                        filename: legacyMessage.title + path.extname(legacyMessage.attachmentPath),
                        path: msgAttachPath
                    });
                }
            }

            // Attach assigned memory files
            if (distribution.assignedMemories && distribution.assignedMemories.length > 0) {
                emailBody += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nAssigned Assets (attached below):\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

                for (const memDoc of distribution.assignedMemories) {
                    if (memDoc) {
                        emailBody += `• ${memDoc.title} (${memDoc.category || 'General'})\n`;
                        if (memDoc.description) emailBody += `  ${memDoc.description}\n`;
                        if (memDoc.filePath) {
                            const fullPath = path.resolve(__dirname, '..', memDoc.filePath);
                            if (fs.existsSync(fullPath)) {
                                attachments.push({
                                    filename: memDoc.title + path.extname(memDoc.filePath),
                                    path: fullPath
                                });
                            } else {
                                console.warn(`[Legacy Retry] Memory file not found: ${fullPath}`);
                            }
                        }
                    }
                }
            }

            if (distribution.personalNote) {
                emailBody += `\nPersonal Note: ${distribution.personalNote}\n`;
            }

            emailBody += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nThis message was sent through Digital Legacy - Memory Preservation System.\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

            await transporter.sendMail({
                from: `"Digital Legacy" <${process.env.EMAIL_USER}>`,
                to: distribution.recipientEmail,
                subject: `Legacy Message from ${sender.name}: ${legacyMessage.title}`,
                text: emailBody,
                attachments: attachments
            });

            distribution.status = 'Delivered';
            distribution.deliveredAt = new Date();
            distribution.failureReason = '';
            distribution.notificationSent = true;
            distribution.notificationSentAt = new Date();
            await distribution.save();

            res.json({ msg: 'Distribution retried successfully', distribution });
        } catch (emailErr) {
            distribution.failureReason = emailErr.message;
            await distribution.save();
            res.status(500).json({ msg: 'Retry failed: ' + emailErr.message });
        }
    } catch (err) {
        console.error('Retry distribution error:', err.message);
        res.status(500).json({ msg: 'Failed to retry distribution' });
    }
};
