const Vault = require('../model/Vault');
const Memory = require('../model/Memory');


// Create Vault
exports.createVault = async (req, res) => {
    try {

        console.log("BODY:", req.body);     
        console.log("USER:", req.user);     

        const vault = new Vault({
            user: req.user.id,
            vaultName: req.body.vaultName
        });

        await vault.save();

        res.json(vault);

    } catch (err) {
        console.error("ERROR:", err.message);   
        res.status(500).json({ msg: err.message });
    }
};

// Get User Vaults
exports.getVaults = async (req, res) => {
    try {
        const vaults = await Vault.find({ user: req.user.id });
        res.json(vaults);
    } catch (err) {
        console.error("ERROR:", err.message);
        res.status(500).json({ msg: 'Error retrieving vaults' });
    }
};

// Get Memory Owner Dashboard Statistics
exports.getOwnerDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const vaults = await Vault.find({ user: userId }).select('_id');
        const vaultIds = vaults.map(vault => vault._id);

        const totalVaults = vaults.length;
        const totalMemories = await Memory.countDocuments({
            vault: { $in: vaultIds }
        });

        const categoryStats = await Memory.aggregate([
            {
                $match: {
                    vault: { $in: vaultIds }
                }
            },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            }
        ]);

        const memoriesByCategory = {
            Emotional: 0,
            Legal: 0,
            Financial: 0,
            Personal: 0
        };

        categoryStats.forEach(item => {
            if (item._id) {
                memoriesByCategory[item._id] = item.count;
            }
        });

        res.json({
            totalVaults,
            totalMemories,
            memoriesByCategory
        });

    } catch (err) {
        console.error("Dashboard stats error:", err.message);
        res.status(500).json({ msg: 'Failed to load dashboard statistics' });
    }
};

// Upload Memory
exports.uploadMemory = async (req, res) => {
    try {

        const memory = new Memory({
            vault: req.body.vault,
            title: req.body.title,
            description: req.body.description,
            category: req.body.category,
            filePath: req.file.path
        });

        await memory.save();

        res.json(memory);

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: err.message });
    }
};



// Get all memories of a vault
exports.getMemories = async (req, res) => {

    try {

        const memories = await Memory.find({ vault: req.params.vaultId });

        res.json(memories);

    } catch (err) {
        res.status(500).json({ msg: 'Error retrieving memories' });
    }

};



// Update memory (version control)
exports.updateMemory = async (req, res) => {

    try {

        const memory = await Memory.findById(req.params.id);

        memory.title = req.body.title || memory.title;
        memory.description = req.body.description || memory.description;
        memory.category = req.body.category || memory.category;

        memory.version += 1;

        await memory.save();

        res.json(memory);

    } catch (err) {
        res.status(500).json({ msg: 'Update failed' });
    }

};



// Delete memory
exports.deleteMemory = async (req, res) => {

    try {

        const memory = await Memory.findById(req.params.id);
        if (!memory) return res.status(404).json({ msg: 'Memory not found' });

        if (memory.filePath) {
            const fs = require('fs');
            const path = require('path');
            const fullPath = path.join(__dirname, '..', memory.filePath);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        }

        await Memory.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Memory deleted' });

    } catch (err) {
        res.status(500).json({ msg: 'Delete failed' });
    }

};

// Delete vault
exports.deleteVault = async (req, res) => {
    try {
        const vault = await Vault.findById(req.params.id);
        if (!vault) return res.status(404).json({ msg: 'Vault not found' });

        if (vault.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const memories = await Memory.find({ vault: req.params.id });
        const fs = require('fs');
        const path = require('path');

        for (const memory of memories) {
            if (memory.filePath) {
                const fullPath = path.join(__dirname, '..', memory.filePath);
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            }
            await Memory.findByIdAndDelete(memory._id);
        }

        await Vault.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Vault deleted' });
    } catch (err) {
        console.error("ERROR:", err.message);
        res.status(500).json({ msg: 'Delete failed' });
    }
};
module.exports = {
  createVault: exports.createVault,
  getVaults: exports.getVaults,
  getOwnerDashboardStats: exports.getOwnerDashboardStats,
  uploadMemory: exports.uploadMemory,
  getMemories: exports.getMemories,
  updateMemory: exports.updateMemory,
  deleteMemory: exports.deleteMemory,
  deleteVault: exports.deleteVault
};