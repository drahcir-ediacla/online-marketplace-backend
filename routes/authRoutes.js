const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

// Define the '/users' route
router.post('/api/register', AuthController.registerUser);
router.post('/api/login', AuthController.loginUser);
router.get('/api/logout', AuthController.logoutUser);
router.post('/api/send-registration-otp', AuthController.sendRegistrationOTP);
router.put('/api/reset-password', AuthController.resetPassword);
router.put('/api/reset-password-otp', AuthController.resetPasswordOTP)

module.exports = router;
