
const db = require('../config/dbConfig');
const userModel = require('../models/userModels')
const redisClient = require('../config/redisClient')

// Fetch all users
const getUsers = (req, res) => {
  const sql = 'SELECT * FROM users';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      res.status(500).json({ message: 'Error fetching users' });
    } else {
      const key = req.originalUrl || req.url;
      redisClient.setex(key, 10 * 1, JSON.stringify(results)); // Cache for 10 minutes
      res.status(200).json(results);
    }
  });
};


const getUsersById = (req, res) => {
  const userID = req.params.id;

  const getUserQuery = 'SELECT * FROM users WHERE id=?';
  db.query(getUserQuery, [userID], (error, userResults) => {
    if (error) {
      console.error('Error fetching user data:', error);
      return res.status(500).json({ error: 'An error occurred while fetching user data.' });
    }

    if (userResults.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const userData = userResults[0];

    const getUserProductsQuery = 'SELECT * FROM products WHERE seller_id = ?';
    db.query(getUserProductsQuery, [userID], (productError, productResults) => {
      if (productError) {
        console.error('Error fetching products:', productError);
        return res.status(500).json({ error: 'An error occurred while fetching user products.' });
      }

      // Add the products array to the userData object
      userData.products = productResults;

      // Fetch images for each product
      const getProductImages = (productID) => {
        const getProductImagesQuery = 'SELECT * FROM product_images WHERE product_id = ?';
        return new Promise((resolve, reject) => {
          db.query(getProductImagesQuery, [productID], (imageError, imageResults) => {
            if (imageError) {
              console.error('Error fetching product images:', imageError);
              reject(imageError);
            } else {
              resolve(imageResults);
            }
          });
        });
      };

      // Fetch images for each product and add them to the productDetails object
      const fetchProductImages = async () => {
        for (const product of userData.products) {
          try {
            const productImages = await getProductImages(product.id);
            product.images = productImages;
          } catch (error) {
            console.error('Error fetching product images:', error);
          }
        }

        res.status(200).json(userData);
      };

      fetchProductImages();
    });
  });
};




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
