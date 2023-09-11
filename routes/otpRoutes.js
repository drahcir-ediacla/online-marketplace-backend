const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otpController');

router.post('/api/send-otp', otpController.sendOTP);
router.post('/api/verify-otp', otpController.verifyOTP);

module.exports = router;
