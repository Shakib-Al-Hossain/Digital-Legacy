const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const roleAuth = require('../middleware/roleAuth');
const vaultController = require('../controller/vaultController');

// ✅ CREATE VAULT
router.post('/create', auth, roleAuth('Memory Owner'), vaultController.createVault);

// ✅ GET USER VAULTS
router.get('/', auth, roleAuth('Memory Owner'), vaultController.getVaults);

// ✅ GET MEMORY OWNER DASHBOARD STATS
router.get('/dashboard/stats', auth, roleAuth('Memory Owner'), vaultController.getOwnerDashboardStats);

// ✅ UPLOAD MEMORY
router.post(
  '/upload',
  auth,
  roleAuth('Memory Owner'),
  upload.single('file'),
  vaultController.uploadMemory
);

// ✅ GET MEMORIES BY VAULT ID
router.get('/:vaultId/memories', auth, roleAuth('Memory Owner'), vaultController.getMemories);

// ✅ UPDATE MEMORY
router.put('/memory/:id', auth, roleAuth('Memory Owner'), vaultController.updateMemory);

// ✅ DELETE MEMORY
router.delete('/memory/:id', auth, roleAuth('Memory Owner'), vaultController.deleteMemory);

// ✅ DELETE VAULT
router.delete('/:id', auth, roleAuth('Memory Owner'), vaultController.deleteVault);

module.exports = router;