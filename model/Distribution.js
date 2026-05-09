const mongoose = require('mongoose');

const DistributionSchema = new mongoose.Schema({
    legacyMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LegacyMessage',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipientEmail: {
        type: String,
        required: true
    },
    recipientName: {
        type: String,
        required: true
    },
    // Delivery tracking
    status: {
        type: String,
        enum: ['Pending', 'Sent', 'Delivered', 'Failed', 'Bounced'],
        default: 'Pending'
    },
    sentAt: {
        type: Date
    },
    deliveredAt: {
        type: Date
    },
    failureReason: {
        type: String
    },
    // What was distributed
    distributionType: {
        type: String,
        enum: ['Message', 'Asset', 'Both'],
        default: 'Message'
    },
    // Specific assets distributed to this contact
    assignedMemories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Memory'
    }],
    personalNote: {
        type: String
    },
    // Notification tracking
    notificationSent: {
        type: Boolean,
        default: false
    },
    notificationSentAt: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Distribution', DistributionSchema);
