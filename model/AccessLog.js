// model/AccessLog.js
const mongoose = require('mongoose');

const AccessLogSchema = new mongoose.Schema({

    // Who performed the action
    actor:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Who owns the resource being acted on (can be same as actor for self-actions)
    owner:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Contact document if the action is about a contact
    contact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },

    actionType: {
        type: String,
        enum: [
            'CONTACT_ADDED',
            'CONTACT_UPDATED',
            'CONTACT_DELETED',
            'PERMISSION_CHANGED',
            'EMERGENCY_REQUEST_SUBMITTED',
            'EMERGENCY_REQUEST_APPROVED',
            'EMERGENCY_REQUEST_DENIED',
            'CONTACT_ACCESS_EXPIRED',
        ],
        required: true
    },

    details: { type: String },   // human-readable description
    timestamp: { type: Date, default: Date.now },

});

module.exports = mongoose.model('AccessLog', AccessLogSchema);