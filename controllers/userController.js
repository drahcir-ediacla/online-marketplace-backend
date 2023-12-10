
const db = require('../config/dbConfig');
const pool = require('../config/dbConfig');
const { userModel, productModel, productImagesModel } = require('../config/sequelizeConfig')
const redisClient = require('../config/redisClient')



// --------------- FETCH ALL USERS  --------------- //
const getUsers = async (req, res) => {
  try {
    // Use Sequelize to fetch all users
    const users = await userModel.findAll();

    // Cache the results using Redis
    const key = req.originalUrl || req.url;
    redisClient.setex(key, 10 * 60, JSON.stringify(users)); // Cache for 10 minutes

    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};



// --------------- GET USERS BY ID  --------------- //
const getUsersById = async (req, res) => {
  const userID = req.params.id;

  try {
    // Use Sequelize to fetch user data and associated products
    const userData = await userModel.findByPk(userID, {
      include: [
        {
          model: productModel,
          attributes: ['id', 'product_name', 'description', 'price', 'category_id', 'seller_id', 'product_condition', 'youtube_link', 'createdAt'],
          order: [['createdAt', 'DESC']],
          as: 'products',
          include: [
            {
              model: productImagesModel,
              attributes: ['id', 'image_url'],
              as: 'images',
            },
          ],
        },
      ],
    });

    if (!userData) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.status(200).json(userData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'An error occurred while fetching user data.' });
  }
};





// --------------- UPDATE USER  --------------- //
const updateUser = async (req, res) => {
  if (req.isAuthenticated()) {
    // The user is authenticated, so you can access req.user to get the current user

    // Log user information for debugging
    console.log('Authenticated user:', req.user);
    console.log('User ID from session:', req.user);

    try {
      // You can access the updated user data from req.body
      const updatedUserData = req.body;


      const user = await userModel.findByPk(req.user.id);
      if (!user) {
        console.log('User not found in the database');
        return res.status(404).json({ success: false, message: 'User not found in the database' });
      }


      if (!user) {
        // User not found
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Update the user's profile data
      await user.update({
        email: updatedUserData.email,
        display_name: updatedUserData.display_name,
        bio: updatedUserData.bio,
        first_name: updatedUserData.first_name,
        last_name: updatedUserData.last_name,
        country: updatedUserData.country,
        region: updatedUserData.region,
        city: updatedUserData.city,
        phone: updatedUserData.phone,
        gender: updatedUserData.gender,
        birthday: updatedUserData.birthday,
        password: updatedUserData.password,
        profile_pic: updatedUserData.profile_pic,
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
}



module.exports = { getUsers, getUsersById, updateUser };
