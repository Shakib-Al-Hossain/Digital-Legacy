const mongoose = require('mongoose');

const LegacyMessageSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    messageType: {
        type: String,
        enum: ['Text', 'Letter', 'Instructions', 'Will', 'Other'],
        default: 'Text'
    },
    // Scheduling
    scheduledDate: {
        type: Date
    },
    releaseCondition: {
        type: String,
        enum: ['Scheduled Date', 'Dead-Man Trigger', 'Manual Release'],
        default: 'Scheduled Date'
    },
    // Status tracking
    status: {
        type: String,
        enum: ['Draft', 'Scheduled', 'Released', 'Delivered', 'Failed'],
        default: 'Scheduled'
    },
    releasedAt: {
        type: Date
    },
    // Asset assignment - which specific assets/memories go to which contacts
    assetAssignments: [{
        contact: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Contact'
        },
        contactEmail: String,
        contactName: String,
        memories: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Memory'
        }],
        personalNote: String
    }],
    // Designated recipients
    recipients: [{
        contact: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Contact'
        },
        contactEmail: String,
        contactName: String
    }],
    // File attachment for the message itself
    attachmentPath: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('LegacyMessage', LegacyMessageSchema);
