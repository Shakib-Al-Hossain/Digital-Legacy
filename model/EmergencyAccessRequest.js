// model/EmergencyAccessRequest.js
const mongoose = require('mongoose');

const EmergencyAccessRequestSchema = new mongoose.Schema({

    // The legacy contact (trustee) who is requesting access
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // The memory owner whose vault is being requested
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    reason:  { type: String, required: true },
    status:  { type: String, enum: ['Pending', 'Approved', 'Denied'], default: 'Pending' },

    requestDate:  { type: Date, default: Date.now },
    resolvedDate: { type: Date, default: null },

}, { timestamps: true });

module.exports = mongoose.model('EmergencyAccessRequest', EmergencyAccessRequestSchema);