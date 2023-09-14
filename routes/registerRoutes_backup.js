const express = require('express');
const router = express.Router();
const RegisterController = require('../controllers/registerController');

// Define the '/users' route
router.post('/api/register', RegisterController.registerUser);

module.exports = router;
