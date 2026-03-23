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

        await Memory.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Memory deleted' });

    } catch (err) {
        res.status(500).json({ msg: 'Delete failed' });
    }

};
module.exports = {
  createVault: exports.createVault,
  uploadMemory: exports.uploadMemory,
  getMemories: exports.getMemories,
  updateMemory: exports.updateMemory,
  deleteMemory: exports.deleteMemory
};