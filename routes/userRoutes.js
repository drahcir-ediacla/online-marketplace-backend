const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');


// Define the '/users' route
router.get('/api/users', UserController.getUsers);


// Define a route for updating user profile data
router.put('/api/updateuser', UserController.updateUser);



module.exports = router;
