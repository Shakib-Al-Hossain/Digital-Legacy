const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    contactEmail: { type: String, required: true },
    contactName: { type: String, required: true },
    relationship: { type: String },
    accessLevel: { type: String, enum: ['Full', 'Partial', 'Emergency'], default: 'Emergency' },
    isTrusted: { type: Boolean, default: true }
});

module.exports = mongoose.model('Contact', ContactSchema);
