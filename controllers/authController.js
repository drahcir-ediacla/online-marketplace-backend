const passport = require('passport');
const { userModel, refreshTokenModel } = require('../config/sequelizeConfig')
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const transPorter = require('../config/emailConfig')
const { generateAccessToken, generateRefreshToken } = require('../utils/tokenUtils'); // You need to implement token utility functions

// Function to register a new user
const registerUser = async (req, res) => {
  const { email, password, otp } = req.body;

  try {

    const user = await userModel.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'Email not exists' });
    }

    if (user.email_verified === true) {
      return res.status(409).json({ message: 'Email already exists' })
    }

    if (user.otp !== otp || Date.now() > new Date(user.otp_expires).getTime()) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }

    // If the email is unique, hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Clear OTP fields and set emailVerified to true after successful verification
    user.otp = null;
    user.otp_expires = null;
    user.email_verified = true;
    user.password = hashedPassword;
    await user.save();

    // Send success response
    res.status(201).json({ message: 'User created successfully.' });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
};


const sendRegistrationOTP = async (req, res) => {
  const { email } = req.body;
  try {
    // Check if the email already exists and email_verified is false
    const user = await userModel.findOne({ where: { email } });

    if (user && user.email_verified) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // Generate OTP
    const otp = crypto.randomBytes(3).toString('hex');
    const otp_expires = new Date(Date.now() + 2 * 60 * 1000); // OTP expires in 2 minutes

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: `${otp} is your OTP Code`,
      text: `Your OTP code is ${otp}. It will expire in 2 minutes.`,
    };

    await transPorter.sendMail(mailOptions);

    if (user && !user.email_verified) {
      // Update the existing user's OTP and otp_expires
      user.otp = otp;
      user.otp_expires = otp_expires;
      await user.save();
    } else {
      // Create a new user
      await userModel.create({
        email,
        otp,
        otp_expires,
        email_verified: false,
      });
    }

    res.status(201).json({ message: 'OTP send successfully. Please check your inbox for the verification code sent to your email address.' });
  } catch (error) {
    console.error('Error sending otp:', error);
    res.status(500).json({ message: 'Error sending otp' });
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
        res.cookie('refreshJWT', refreshToken, { httpOnly: true, sameSite: 'none', secure: true, maxAge: 24 * 60 * 60 * 1000, path: '/' });
        res.cookie('jwt', accessToken, { httpOnly: true, sameSite: 'none', secure: true, maxAge: 24 * 60 * 60 * 1000, path: '/' });

        // // Update user status to 'online'
        // await userModel.upsert({ id: user.id, status: 'online' });

        // // Emit user online event
        // const io = req.io;
        // io.emit('updateUserStatus', { id: user.id, status: 'online' });

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


const resetPassword = async (req, res) => {
  const { email, password, otp } = req.body
  try {
    const user = await userModel.findOne({ where: { email, email_verified: true } });
    if (!user) {
      return res.status(404).json({ message: 'Email not found' });
    }
    if (user.otp !== otp || Date.now() > new Date(user.otp_expires).getTime()) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }

    // If the email is unique, hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Clear OTP fields and set emailVerified to true after successful verification
    user.otp = null;
    user.otp_expires = null;
    user.email_verified = true;
    user.password = hashedPassword;
    await user.save();

    // Send success response
    res.status(201).json({ message: 'Password successfully updated.' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Error updating password.' });
  }
}

const resetPasswordOTP = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await userModel.findOne({ where: { email, email_verified: true } })

    if (!user) {
      return res.status(404).json({ message: 'Email not found.' });
    }

    // Generate OTP
    const otp = crypto.randomBytes(3).toString('hex');
    const otp_expires = new Date(Date.now() + 2 * 60 * 1000); // OTP expires in 2 minutes

    const mailOptions = {
      from: 'Yogeek',
      to: email,
      subject: `${otp} is your OTP Code`,
      text: `Your OTP code is ${otp}. It will expire in 2 minutes.`,
    };

    await transPorter.sendMail(mailOptions);

    if (user) {
      // Update the existing user's OTP and otp_expires
      user.otp = otp;
      user.otp_expires = otp_expires;
      await user.save();
    }

    res.status(201).json({ message: 'OTP send successfully. Please check your inbox for the verification code sent to your email address.' });
  } catch (error) {
    console.error('Error sending otp:', error);
    res.status(500).json({ message: 'Error sending otp' });
  }
}



module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  sendRegistrationOTP,
  resetPassword,
  resetPasswordOTP
};
