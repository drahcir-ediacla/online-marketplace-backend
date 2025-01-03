const express = require('express');
const router = express.Router();
const adminRoleController = require('../../controllers/admin/adminRoleController');

// Define the '/users' route
router.get('/api/admin/get-role', adminRoleController.getUserRole);

module.exports = router;
