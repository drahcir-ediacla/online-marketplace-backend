const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');

// Define the '/users' route
router.get('/api/users', UserController.getUsers);

module.exports = router;
