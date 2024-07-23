const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

// Define the '/users' route
router.post('/api/email-register', AuthController.registerUserByEmail);
router.post('/api/phone-register', AuthController.registerUserByPhone);
router.post('/api/login-email', AuthController.loginUserByEmail);
router.post('/api/login-phone', AuthController.loginUserByPhone);
router.get('/api/logout', AuthController.logoutUser);
router.post('/api/send-email-registration-otp', AuthController.sendEmailRegistrationOTP);
router.post('/api/send-phone-registration-otp', AuthController.sendPhoneRegistrationOTP);
router.put('/api/reset-password-email', AuthController.resetPasswordByEmail);
router.put('/api/reset-password-otp-email', AuthController.resetPasswordOtpByEmail);
router.put('/api/reset-password-phone', AuthController.resetPasswordByPhone);
router.put('/api/reset-password-otp-phone', AuthController.resetPasswordOtpByPhone);
router.post('/api/login-verify-otp', AuthController.verifyOtpAndLogin);
router.post('/api/send-login-otp', AuthController.sendLoginOtp);
router.post('/api/send-email-update-otp', AuthController.sendEmailUpdateOTP);
router.put('/api/verify-email-update-otp', AuthController.verifyEmailUpdateOTP);

module.exports = router;
