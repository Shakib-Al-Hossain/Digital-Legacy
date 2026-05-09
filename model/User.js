const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['Memory Owner', 'Legacy Contact', 'Administrator'], default: 'Memory Owner' },
    twoFactorSecret: { type: String },
    isTwoFactorEnabled: { type: Boolean, default: false },
    resetPasswordOtp: { type: String },
    resetPasswordExpires: { type: Date },
    isActive: { type: Boolean, default: true },
    deadManTrigger: {
        enabled: { type: Boolean, default: false },
        lastActive: { type: Date, default: Date.now },
        triggerDurationDays: { type: Number, default: 30 }
    }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
