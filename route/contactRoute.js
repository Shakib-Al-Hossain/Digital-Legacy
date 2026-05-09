// route/contactRoute.js
const express    = require('express');
const router     = express.Router();
const auth       = require('../middleware/auth');
const roleAuth   = require('../middleware/roleAuth');
const ctrl       = require('../controller/contactController');

// ── Contact management (Memory Owner) ────────────────────────────────────────
router.get   ('/',                    auth, roleAuth('Memory Owner'), ctrl.getContacts);
router.post  ('/',                    auth, roleAuth('Memory Owner'), ctrl.addContact);
router.put   ('/:id',                 auth, roleAuth('Memory Owner'), ctrl.updateContact);
router.delete('/:id',                 auth, roleAuth('Memory Owner'), ctrl.deleteContact);

// ── Permission control (Memory Owner) ────────────────────────────────────────
router.patch ('/:id/permission',      auth, roleAuth('Memory Owner'), ctrl.updatePermission);

// ── Emergency Access (Legacy Contact submits, Memory Owner resolves) ──────────
router.post  ('/emergency-request',       auth, roleAuth('Legacy Contact'),  ctrl.submitEmergencyRequest);
router.get   ('/emergency-requests',      auth, roleAuth('Memory Owner'),    ctrl.getEmergencyRequests);
router.get   ('/my-emergency-requests',   auth, roleAuth('Legacy Contact'),  ctrl.getMyEmergencyRequests);
router.patch ('/emergency-requests/:id',  auth, roleAuth('Memory Owner'),    ctrl.resolveEmergencyRequest);

// ── Access History Log ────────────────────────────────────────────────────────
router.get   ('/access-logs',         auth, ctrl.getAccessLogs);

module.exports = router;