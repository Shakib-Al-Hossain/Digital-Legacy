const express = require('express');
const router = express.Router();
const profileController = require('../controller/profileController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, profileController.getProfile);
router.put('/', authMiddleware, profileController.updateProfile);
router.put('/deactivate', authMiddleware, profileController.deactivateAccount);
router.post('/contact', authMiddleware, profileController.addContact);
router.get('/contact', authMiddleware, profileController.getContacts);
router.put('/deadman', authMiddleware, profileController.updateDeadManTrigger);

module.exports = router;
