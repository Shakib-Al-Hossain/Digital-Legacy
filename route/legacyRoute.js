const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const upload = require('../middleware/upload');
const legacyController = require('../controller/legacyController');

// ============================================
// MEMORY OWNER ROUTES
// ============================================

// Create a new legacy message (with optional file attachment)
router.post(
    '/create',
    auth,
    roleAuth('Memory Owner'),
    upload.single('attachment'),
    legacyController.createLegacyMessage
);

// Get all legacy messages for the logged-in user
router.get(
    '/',
    auth,
    roleAuth('Memory Owner'),
    legacyController.getLegacyMessages
);

// Get a specific legacy message
router.get(
    '/message/:id',
    auth,
    roleAuth('Memory Owner'),
    legacyController.getLegacyMessageById
);

// Update a legacy message
router.put(
    '/message/:id',
    auth,
    roleAuth('Memory Owner'),
    legacyController.updateLegacyMessage
);

// Delete a legacy message
router.delete(
    '/message/:id',
    auth,
    roleAuth('Memory Owner'),
    legacyController.deleteLegacyMessage
);

// Reschedule a legacy message
router.put(
    '/reschedule/:id',
    auth,
    roleAuth('Memory Owner'),
    legacyController.rescheduleMessage
);

// Manually release a message
router.post(
    '/release/:id',
    auth,
    roleAuth('Memory Owner'),
    legacyController.manualRelease
);

// Get distribution log
router.get(
    '/distributions',
    auth,
    roleAuth('Memory Owner'),
    legacyController.getDistributionLog
);

// Get distribution statistics
router.get(
    '/stats',
    auth,
    roleAuth('Memory Owner'),
    legacyController.getDistributionStats
);

// Get all user memories (for asset assignment UI)
router.get(
    '/memories',
    auth,
    roleAuth('Memory Owner'),
    legacyController.getUserMemories
);

// Retry a failed distribution
router.post(
    '/retry/:id',
    auth,
    roleAuth('Memory Owner'),
    legacyController.retryDistribution
);

// ============================================
// LEGACY CONTACT ROUTES
// ============================================

// Get released assets for the logged-in legacy contact
router.get(
    '/released',
    auth,
    legacyController.getReleasedAssetsForContact
);

module.exports = router;
