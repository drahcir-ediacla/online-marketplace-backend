const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

// Define the '/users' route
router.post('/api/email-register', AuthController.registerUserByEmail);
router.put('/api/phone-register', AuthController.registerUserByPhone);
router.post('/api/login', AuthController.loginUser);
router.get('/api/logout', AuthController.logoutUser);
router.post('/api/send-email-registration-otp', AuthController.sendEmailRegistrationOTP);
router.post('/api/send-phone-registration-otp', AuthController.sendPhoneRegistrationOTP);
router.put('/api/reset-password', AuthController.resetPassword);
router.put('/api/reset-password-otp', AuthController.resetPasswordOTP)

module.exports = router;
