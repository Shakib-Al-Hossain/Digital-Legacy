const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const vaultController = require('../controller/vaultController');

// ✅ CREATE VAULT
router.post('/create', auth, vaultController.createVault);

// ✅ UPLOAD MEMORY (VERY IMPORTANT)
router.post(
  '/upload',
  auth,
  upload.single('file'),   // 👈 REQUIRED
  vaultController.uploadMemory
);

module.exports = router;