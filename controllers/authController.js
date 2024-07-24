const passport = require('passport');
const { userModel, refreshTokenModel } = require('../config/sequelizeConfig')
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const transPorter = require('../config/emailConfig')
const vonage = require('../config/vonageConfig')
const { generateAccessToken, generateRefreshToken } = require('../utils/tokenUtils'); // You need to implement token utility functions

// Function to register a new user
const registerUserByEmail = async (req, res) => {
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


const sendEmailRegistrationOTP = async (req, res) => {
  const { email } = req.body;
  try {
    // Check if the email already exists and email_verified is false
    const user = await userModel.findOne({ where: { email } });

    if (user && user.email_verified) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_expires = new Date(Date.now() + 2 * 60 * 1000); // OTP expires in 2 minutes

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: `${otp} is your OTP Code`,
      text: `Your Yogeek registration verification code is ${otp}. Valid for 2 minutes.`
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

    res.status(201).json({ message: 'OTP sent successfully. Please check your inbox for the verification code sent to your email address.' });
  } catch (error) {
    console.error('Error sending otp:', error);
    res.status(500).json({ message: 'Error sending otp' });
  }
};


const registerUserByPhone = async (req, res) => {
  const { phone, password, otp } = req.body;

  try {

    const user = await userModel.findOne({ where: { phone } });

    if (!user) {
      return res.status(404).json({ message: 'Phone number not found' });
    }

    if (user.phone_verified === true) {
      return res.status(409).json({ message: 'Phone number already exists' })
    }

    if (user.otp !== otp || Date.now() > new Date(user.otp_expires).getTime()) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }

    // If the phone is unique, hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Clear OTP fields and set phone_verified to true after successful verification
    user.otp = null;
    user.otp_expires = null;
    user.phone_verified = true;
    user.password = hashedPassword;
    await user.save();

    // Send success response
    res.status(201).json({ message: 'User created successfully.' });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
};


const sendPhoneRegistrationOTP = async (req, res) => {
  const { phone } = req.body
  try {
    const user = await userModel.findOne({ where: { phone } })

    if (user && user.phone_verified) {
      return res.status(409).json({ message: 'Phone number already exists' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_expires = new Date(Date.now() + 2 * 60 * 1000); // OTP expires in 2 minutes

    const sendSmsOptions = {
      from: "Yogeek",
      to: `63${phone}`,
      text: `[Yogeek] ${otp} is your verification code. Valid for 2 minutes. To keep your account safe, never share this code`,
    };

    await vonage.sms.send(sendSmsOptions);

    if (user && !user.phone_verified) {
      // Update the existing user's OTP and otp_expires
      user.otp = otp;
      user.otp_expires = otp_expires;
      await user.save();
    } else {
      // Create a new user
      await userModel.create({
        phone,
        otp,
        otp_expires,
        phone_verified: false,
      });
    }

    res.status(201).json({ message: 'OTP sent successfully to the phone number.' });
  } catch (error) {
    console.error('Error sending otp:', error);
    res.status(500).json({ message: 'Error sending otp' });
  }
}


const sendLoginOtp = async (req, res) => {
  const { phone } = req.body
  try {
    const user = await userModel.findOne({ where: { phone } })

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_expires = new Date(Date.now() + 2 * 60 * 1000); // OTP expires in 2 minutes

    const sendSmsOptions = {
      from: "Yogeek",
      to: `63${phone}`,
      text: `[Yogeek] ${otp} is your verification code. Valid for 2 minutes. To keep your account safe, never share this code`,
    };

    await vonage.sms.send(sendSmsOptions);

    if (user) {
      // Update the existing user's OTP and otp_expires
      user.otp = otp;
      user.otp_expires = otp_expires;
      await user.save();
    } else {
      // Create a new user
      await userModel.create({
        phone,
        otp,
        otp_expires,
        phone_verified: false,
      });
    }

    res.status(201).json({ message: 'OTP sent successfully to the phone number.' });
  } catch (error) {
    console.error('Error sending otp:', error);
    res.status(500).json({ message: 'Error sending otp' });
  }
}


// Function to verify OTP and log in the user
const verifyOtpAndLogin = async (req, res) => {
  const { phone, otp } = req.body;

  try {
    const user = await userModel.findOne({ where: { phone } });

    if (!user) {
      return res.status(404).json({ message: 'Invalid Verification Code' });
    }

    // Check if OTP matches and is not expired
    if (user.otp !== otp || Date.now() > new Date(user.otp_expires).getTime()) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }

    // Clear OTP fields and set phone_verified to true after successful verification
    user.otp = null;
    user.otp_expires = null;
    user.phone_verified = true;
    await user.save();

    // OTP is valid, log the user in
    req.logIn(user, async (loginErr) => {
      if (loginErr) {
        console.error('Error during login:', loginErr);
        return res.status(500).json({ message: 'Internal server error' });
      }

      // Generate tokens
      const accessToken = generateAccessToken(user.id);
      const refreshToken = generateRefreshToken(user.id);
      const expirationDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000); // 1 day from now

      try {
        // Store the refresh token
        await refreshTokenModel.create({
          user_id: user.id,
          token: refreshToken,
          expiration_date: expirationDate,
        });

        // Set cookies with tokens
        res.cookie('refreshJWT', refreshToken, {
          httpOnly: true,
          sameSite: 'none',
          secure: true,
          maxAge: 24 * 60 * 60 * 1000,
          path: '/',
        });
        res.cookie('jwt', accessToken, {
          httpOnly: true,
          sameSite: 'none',
          secure: false,
          maxAge: 24 * 60 * 60 * 1000,
          path: '/',
        });

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
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Function to authenticate and login a user by email
const loginUserByEmail = async (req, res) => {
  passport.authenticate('local-email', async (authErr, user, info) => {
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


// Function to authenticate and login a user by email
const loginUserByPhone = async (req, res) => {
  passport.authenticate('local-phone', async (authErr, user, info) => {
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


const resetPasswordByEmail = async (req, res) => {
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

const resetPasswordOtpByEmail = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await userModel.findOne({ where: { email, email_verified: true } })

    if (!user) {
      return res.status(404).json({ message: 'Email not found.' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_expires = new Date(Date.now() + 2 * 60 * 1000); // OTP expires in 2 minutes

    const mailOptions = {
      from: 'Yogeek',
      to: email,
      subject: `${otp} is your OTP Code`,
      text: `Your Yogeek password recovery code is ${otp}. It will expire in 2 minutes.`,
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


const resetPasswordByPhone = async (req, res) => {
  const { phone, password, otp } = req.body
  try {
    const user = await userModel.findOne({ where: { phone, phone_verified: true } });
    if (!user) {
      return res.status(404).json({ message: 'Phone number not found' });
    }
    if (user.otp !== otp || Date.now() > new Date(user.otp_expires).getTime()) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }

    // If the phone is unique, hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Clear OTP fields and set phone_verified to true after successful verification
    user.otp = null;
    user.otp_expires = null;
    user.phone_verified = true;
    user.password = hashedPassword;
    await user.save();

    // Send success response
    res.status(201).json({ message: 'Password successfully updated.' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'Error updating password.' });
  }
}


const resetPasswordOtpByPhone = async (req, res) => {
  const { phone } = req.body;
  try {
    const user = await userModel.findOne({ where: { phone, phone_verified: true } })

    if (!user) {
      return res.status(404).json({ message: 'Phone not found.' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_expires = new Date(Date.now() + 2 * 60 * 1000); // OTP expires in 2 minutes

    const sendSmsOptions = {
      from: 'Yogeek',
      to: `63${phone}`,
      text: `[Yogeek] ${otp} is your password recovery code. Valid for 2 minutes. To keep your account safe, never share this code.`,
    };

    await vonage.sms.send(sendSmsOptions);

    if (user) {
      // Update the existing user's OTP and otp_expires
      user.otp = otp;
      user.otp_expires = otp_expires;
      await user.save();
    }

    res.status(201).json({ message: 'OTP sent successfully to the phone number.' });
  } catch (error) {
    console.error('Error sending otp:', error);
    res.status(500).json({ message: 'Error sending otp' });
  }
}


const sendEmailUpdateOTP = async (req, res) => {

  if (req.isAuthenticated()) {
    const { newEmail } = req.body;
    const userId = req.user.id

    try {
      // Check if the new email already exists
      const existingUser = await userModel.findOne({ where: { email: newEmail } });

      if (existingUser) {
        return res.status(409).json({ message: 'Email already exists' });
      }

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otp_expires = new Date(Date.now() + 2 * 60 * 1000); // OTP expires in 2 minutes

      const mailOptions = {
        from: process.env.EMAIL,
        to: newEmail,
        subject: `${otp} is your OTP Code`,
        text: `Your Yogeek update email verification code is ${otp}. Valid for 2 minutes.`
      };

      await transPorter.sendMail(mailOptions);

      // Save OTP and otp_expires to the user's record
      const user = await userModel.findByPk(userId);
      user.new_email = newEmail;
      user.otp = otp;
      user.otp_expires = otp_expires;
      await user.save();

      res.status(201).json({ message: 'OTP sent successfully to the new email.' });
    } catch (error) {
      console.error('Error sending otp:', error);
      res.status(500).json({ message: 'Error sending otp' });
    }
  } else {
    // If not authenticated, send an error response
    console.log('User not authenticated');
    res.status(401).json({ success: false, message: 'User not authenticated' });
  }

};

// Function to verify OTP and update the email
const verifyEmailUpdateOTP = async (req, res) => {

  if (req.isAuthenticated()) {
    const { otp } = req.body;
    const userId = req.user.id
    try {
      const user = await userModel.findByPk(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.otp !== otp || Date.now() > new Date(user.otp_expires).getTime()) {
        return res.status(401).json({ message: 'Invalid or expired OTP' });
      }

      // Update email and clear OTP fields
      user.email = user.new_email;
      user.new_email = null;
      user.otp = null;
      user.otp_expires = null;
      user.account_verified = true;
      await user.save();

      res.status(200).json({ message: 'Email updated successfully.' });
    } catch (error) {
      console.error('Error updating email:', error);
      res.status(500).json({ message: 'Error updating email' });
    }
  } else {
    // If not authenticated, send an error response
    console.log('User not authenticated');
    res.status(401).json({ success: false, message: 'User not authenticated' });
  }
};


const sendPhoneUpdateOTP = async (req, res) => {

  if (req.isAuthenticated()) {
    const { newPhone } = req.body;
    const userId = req.user.id

    try {
      // Check if the new email already exists
      const existingUser = await userModel.findOne({ where: { phone: newPhone } });

      if (existingUser) {
        return res.status(409).json({ message: 'Phone already exists' });
      }

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otp_expires = new Date(Date.now() + 2 * 60 * 1000); // OTP expires in 2 minutes

      const sendSmsOptions = {
        from: "Yogeek",
        to: `63${newPhone}`,
        text: `[Yogeek] ${otp} is your verification code. Valid for 2 minutes. To keep your account safe, never share this code`,
      };
  
      await vonage.sms.send(sendSmsOptions);

      // Save OTP and otp_expires to the user's record
      const user = await userModel.findByPk(userId);
      user.new_phone = newPhone;
      user.otp = otp;
      user.otp_expires = otp_expires;
      await user.save();

      res.status(201).json({ message: 'OTP sent successfully to the new phone number.' });
    } catch (error) {
      console.error('Error sending otp:', error);
      res.status(500).json({ message: 'Error sending otp' });
    }
  } else {
    // If not authenticated, send an error response
    console.log('User not authenticated');
    res.status(401).json({ success: false, message: 'User not authenticated' });
  }

};

// Function to verify OTP and update the email
const verifyPhoneUpdateOTP = async (req, res) => {

  if (req.isAuthenticated()) {
    const { otp } = req.body;
    const userId = req.user.id
    try {
      const user = await userModel.findByPk(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.otp !== otp || Date.now() > new Date(user.otp_expires).getTime()) {
        return res.status(401).json({ message: 'Invalid or expired OTP' });
      }

      // Update email and clear OTP fields
      user.phone = user.new_phone;
      user.new_phone = null;
      user.otp = null;
      user.otp_expires = null;
      user.account_verified = true;
      await user.save();

      res.status(200).json({ message: 'Phone updated successfully.' });
    } catch (error) {
      console.error('Error updating phone:', error);
      res.status(500).json({ message: 'Error updating phone' });
    }
  } else {
    // If not authenticated, send an error response
    console.log('User not authenticated');
    res.status(401).json({ success: false, message: 'User not authenticated' });
  }
};


module.exports = {
  registerUserByEmail,
  registerUserByPhone,
  loginUserByEmail,
  loginUserByPhone,
  logoutUser,
  sendEmailRegistrationOTP,
  sendPhoneRegistrationOTP,
  sendLoginOtp,
  verifyOtpAndLogin,
  resetPasswordByEmail,
  resetPasswordOtpByEmail,
  resetPasswordByPhone,
  resetPasswordOtpByPhone,
  sendEmailUpdateOTP,
  verifyEmailUpdateOTP,
  sendPhoneUpdateOTP,
  verifyPhoneUpdateOTP
};
