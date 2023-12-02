const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const cacheMiddleware = require('../middleware/cacheMiddleware')


// Define the '/users' route
router.get('/api/users', cacheMiddleware, UserController.getUsers);
router.get('/api/user/:id', UserController.getUsersById);


// Define a route for updating user profile data
router.put('/api/updateuser', UserController.updateUser);



module.exports = router;
