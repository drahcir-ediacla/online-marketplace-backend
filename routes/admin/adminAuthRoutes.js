const express = require('express');
const router = express.Router();
const AdminAuthController = require('../../controllers/admin/adminAuthController');

// Define the '/users' route
router.post('/api/admin/email-register', AdminAuthController.registerAdminUserByEmail);
router.post('/api/admin/send-email-registration-otp', AdminAuthController.sendEmailAdminRegistrationOTP);

module.exports = router;
