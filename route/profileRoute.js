const express = require('express');
const router = express.Router();
const profileController = require('../controller/profileController');
const authMiddleware = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

router.get('/', authMiddleware, profileController.getProfile);
router.put('/', authMiddleware, profileController.updateProfile);
router.put('/deactivate', authMiddleware, profileController.deactivateAccount);

router.post('/contact', authMiddleware, roleAuth('Memory Owner'), profileController.addContact);
router.get('/contact', authMiddleware, roleAuth('Memory Owner'), profileController.getContacts);
router.put('/deadman', authMiddleware, roleAuth('Memory Owner'), profileController.updateDeadManTrigger);

module.exports = router;