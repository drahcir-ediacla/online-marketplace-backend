const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const userModel = require('../models/userModels')


// Define the '/users' route
router.get('/api/users', UserController.getUsers);


// Define a route for updating user profile data
router.put('/update', async (req, res) => {
    if (req.isAuthenticated()) {
        // The user is authenticated, so you can access req.user to get the current user

        // Log user information for debugging
        console.log('Authenticated user:', req.user);
        console.log('User ID from session:', req.user.id);

        try {
            // You can access the updated user data from req.body
            const updatedUserData = req.body;

            // Find the user by their ID (assuming you have an 'id' field in your table)
            const user = await userModel.findByPk(req.user); // Use findById here

            if (!user) {
                // User not found
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            // Update the user's profile data
            await user.update({
                display_name: updatedUserData.display_name,
                email: updatedUserData.email,
                // Add more fields here as needed
            });

            // Send a success response with the updated user data
            res.status(200).json({ success: true, user: user.toJSON() });
        } catch (err) {
            // Handle any errors (e.g., validation errors)
            console.error(err);
            res.status(500).json({ success: false, message: 'Error updating profile' });
        }
    } else {
        // If not authenticated, send an error response
        console.log('User not authenticated');
        res.status(401).json({ success: false, message: 'User not authenticated' });
    }
});



module.exports = router;
