const { userModel, refreshTokenModel, userRoleModel, rolesModel } = require('../../config/sequelizeConfig')
const bcrypt = require('bcrypt');
const passport = require('passport');
const transPorter = require('../../config/emailConfig')


const registerAdminUserByEmail = async (req, res) => {
    const { email, password, role_id, otp } = req.body;

    if (!email || !password || !role_id || !otp) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {

        const user = await userModel.findOne({ where: { email } });
        const roleId = await rolesModel.findOne({ where: { id: role_id } })

        if (!user) {
            return res.status(400).json({ message: 'Invalid request or OTP.' });
        }

        if (user.email_verified) {
            return res.status(409).json({ message: 'Email is already verified.' });
        }

        if (!roleId) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const isOtpExpired = Date.now() > new Date(user.otp_expires).getTime();
        if (user.otp !== otp || isOtpExpired) {
            return res.status(400).json({ message: 'Invalid request or OTP.' });
        }

        // If the email is unique, hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user information atomically
        await userModel.update({
            otp: null,
            otp_expires: null,
            email_verified: true,
            password: hashedPassword
        }, {
            where: { email }
        });

        await userRoleModel.create({
            user_id: user.id,
            role_id: role_id
        })

        // Send success response
        res.status(201).json({ message: 'Admin user created successfully.' });

    } catch (error) {
        console.error('Error during registration:', error.message);
        res.status(500).json({ message: 'An error occurred during registration.' });
    }
};


const sendEmailAdminRegistrationOTP = async (req, res) => {
    const { email } = req.body;

    // Validate the email field
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: 'Invalid email address.' });
    }

    try {
        // Check if the email already exists and email_verified is false
        const user = await userModel.findOne({ where: { email } });

        // Prevent OTP sending to verified users
        if (user && user.email_verified) {
            return res.status(400).json({ message: 'Invalid request.' });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otp_expires = new Date(Date.now() + 15 * 60 * 1000); // OTP expires in 15 minutes

        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: `${otp} is your OTP Code`,
            text: `Your Yogeek admin registration verification code is ${otp}. Valid for 15 minutes.`
        };

        await transPorter.sendMail(mailOptions);

        if (user && !user.email_verified) {
            // Update the existing user's OTP and expiry
            await userModel.update(
                { otp, otp_expires },
                { where: { email } }
            );
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
        res.status(500).json({ message: 'An error occurred while sending the OTP. Please try again later.' });
    }
};


const loginAdminUserByEmail = async (req, res) => {
    passport.authenticate('local-admin-email', async (authErr, user, info) => {
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
          // Check if a refresh token already exists for the user
          const existingToken = await refreshTokenModel.findOne({
            where: { user_id: user.id },
          });
          if (existingToken) {
            // Update the existing refresh token
            await existingToken.update({
              token: refreshToken,
              expiration_date: expirationDate,
            });
          } else {
            // Create a new refresh token entry
            await refreshTokenModel.create({
              user_id: user.id,
              token: refreshToken,
              expiration_date: expirationDate,
            });
          }
  
          // Set cookie with access token
          res.cookie('refreshJWT', refreshToken, { httpOnly: true, secure: false, maxAge: 24 * 60 * 60 * 1000, path: '/' });
          res.cookie('jwt', accessToken, { httpOnly: true, secure: false, maxAge: 15 * 60 * 1000, path: '/' });
  
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


module.exports = {
    registerAdminUserByEmail,
    sendEmailAdminRegistrationOTP,
    loginAdminUserByEmail
}