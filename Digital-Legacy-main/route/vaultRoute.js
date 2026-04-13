const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const vaultController = require('../controller/vaultController');

// ✅ CREATE VAULT
router.post('/create', auth, vaultController.createVault);

// ✅ GET USER VAULTS
router.get('/', auth, vaultController.getVaults);

// ✅ UPLOAD MEMORY
router.post(
  '/upload',
  auth,
  upload.single('file'),
  vaultController.uploadMemory
);

// ✅ GET MEMORIES BY VAULT ID
router.get('/:vaultId/memories', auth, vaultController.getMemories);

// ✅ UPDATE MEMORY
router.put('/memory/:id', auth, vaultController.updateMemory);

// ✅ DELETE MEMORY
router.delete('/memory/:id', auth, vaultController.deleteMemory);

// ✅ DELETE VAULT
router.delete('/:id', auth, vaultController.deleteVault);

module.exports = router;