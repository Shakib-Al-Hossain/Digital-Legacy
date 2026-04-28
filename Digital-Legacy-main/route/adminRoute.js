const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const adminController = require('../controller/adminController');

router.get('/analytics', auth, roleAuth('Administrator'), adminController.getAnalytics);

module.exports = router;