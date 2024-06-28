const passport = require('passport');
const { userModel, refreshTokenModel } = require('../config/sequelizeConfig')
const bcrypt = require('bcrypt');
const { generateAccessToken, generateRefreshToken } = require('../utils/tokenUtils'); // You need to implement token utility functions

// Function to register a new user
const registerUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the email already exists using Sequelize
    const existingUser = await userModel.findOne({ where: { email } });

    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // If the email is unique, hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user using Sequelize
    await userModel.create({
      email,
      password: hashedPassword,
    });

    // Send success response
    res.status(201).json({ message: 'User created successfully' });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
};



// Function to authenticate and login a user
const loginUser = async (req, res) => {
  passport.authenticate('local', async (authErr, user, info) => {
    if (authErr) {
      console.error('Error during authentication:', authErr);
      return res.status(500).json({ message: 'Internal server error Passport' });
    }

    if (!user) {
      // Authentication failed
      return res.status(401).json({ message: 'Authentication failed. ' + info.message });
    }

    req.logIn(user, async (loginErr) => {
      if (loginErr) {
        console.error('Error during login:', loginErr);
        return res.status(500).json({ message: 'Internal server error Local' });
      }

      // If the login is successful, create and return an access token and a refresh token
      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);
      const expirationDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000); // 1 day from now

      try {
        // Store the refresh token using Sequelize
        await refreshTokenModel.create({
          user_id: user.id,
          token: refreshToken,
          expiration_date: expirationDate
        });

        // Set cookie with access token
        res.cookie('refreshJWT', refreshToken, { httpOnly: true, sameSite: 'none', secure: false, maxAge: 24 * 60 * 60 * 1000, path: '/' });
        res.cookie('jwt', accessToken, { httpOnly: true, sameSite: 'none', secure: false, maxAge: 24 * 60 * 60 * 1000, path: '/' });

        // Update user status to 'online'
        await userModel.upsert({ id: user.id, status: 'online' });

        // Emit user online event
        const io = req.io;
        io.emit('updateUserStatus', { id: user.id, status: 'online' });

        // Send success response
        res.status(200).json({
          success: true,
          message: 'Successfully authenticated',
          user,
          accessToken,
          refreshToken,
        });

      } catch (storeErr) {
        console.error('Error storing refresh token:', storeErr);
        return res.status(500).json({ message: 'Error storing refresh token' });
      }
    });

  })(req, res); // Authenticate using the local strategy
};




const logoutUser = async (req, res) => {
  if (req.isAuthenticated()) {
    const userId = req.user.id;

    // Clear Passport session
    req.logout(); // Since it's asynchronous, you can await this if needed.

    try {
      // Delete refresh token using Sequelize
      const deleteResult = await refreshTokenModel.destroy({
        where: {
          user_id: userId
        }
      });

      if (deleteResult === 0) {
        console.log('Token not found or already deleted.');
      } else {
        console.log('Refresh token deleted successfully.');
      }

      // Update user status to 'offline'
      await userModel.upsert({ id: userId, status: 'offline' });

      // Emit user offline event
      const io = req.io;
      io.emit('updateUserStatus', { id: userId, status: 'offline' });

    } catch (error) {
      console.error('Error deleting refresh token:', error);
      return res.sendStatus(500); // Internal server error
    }
  }

  res.redirect(process.env.CLIENT_URL);
};




module.exports = { registerUser, loginUser, logoutUser };
