const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ipAddress: { type: String },
    device: { type: String },
    loginTime: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'ended'], default: 'active' }
});

module.exports = mongoose.model('Session', SessionSchema);
