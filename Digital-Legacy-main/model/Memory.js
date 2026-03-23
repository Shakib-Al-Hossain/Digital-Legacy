const mongoose = require('mongoose');

const MemorySchema = new mongoose.Schema({
    vault: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vault',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    category: {
        type: String
    },
    filePath: {
        type: String
    },
    version: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Memory', MemorySchema);