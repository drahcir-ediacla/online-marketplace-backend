const express = require('express');
const router = express.Router();
const RefreshTokenController = require('../controllers/refreshTokenController');

// Define the '/refresh token' route
router.get('/api/refresh', RefreshTokenController.handleRefreshToken);

module.exports = router;
