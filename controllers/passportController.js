const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const LocalStrategy = require('passport-local').Strategy;
const { generateAccessToken, generateRefreshToken } = require('../utils/tokenUtils')
const { userModel, refreshTokenModel, userRoleModel, rolesModel } = require('../config/sequelizeConfig')
const bcrypt = require('bcrypt');
require('dotenv').config();


// ------------------------- ADMIN USER LOGIN BY EMAIL -------------------------------------//
passport.use(
  'local-admin-email',
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        // Find the user with the provided email
        const user = await userModel.findOne({
          where: { email },
          include: [
            {
              model: userRoleModel,
              attributes: ['user_id', 'role_id'],
              include: [rolesModel],
            },
          ],
        });

        if (!user) {
          // User not found
          return done(null, false, { message: 'User not found' });
        }

        // Compare the provided password with the stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          // Incorrect password
          return done(null, false, { message: 'Incorrect password' });
        }

        // Check if the user has a role
        if (!user.UserRole || !user.UserRole.Role) {
          return done(null, false, { message: 'User does not have an assigned role' });
        }

        // Authentication successful, return the user
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);


// ------------------------- REGULAR USER LOGIN BY EMAIL -------------------------------------//
passport.use(
  'local-email',
  new LocalStrategy(
    {
      usernameField: 'email', // Field in the request body for the username (email)
      passwordField: 'password', // Field in the request body for the password
    },
    async (email, password, done) => {
      try {
        // Find the user with the provided email
        const user = await userModel.findOne({ where: { email } });

        if (!user) {
          // User not found
          return done(null, false, { message: 'User not found' });
        }

        // Compare the provided password with the stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          // Incorrect password
          return done(null, false, { message: 'Incorrect password' });
        }
        
        // Authentication successful, return the user
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);


// ------------------------- REGULAR USER LOGIN BY PHONE -------------------------------------//
passport.use(
  'local-phone',
  new LocalStrategy(
    {
      usernameField: 'phone', // Field in the request body for the username (email)
      passwordField: 'password', // Field in the request body for the password
    },
    async (phone, password, done) => {
      try {
        // Find the user with the provided email
        const user = await userModel.findOne({ where: { phone, phone_verified: true } });

        if (!user) {
          // User not found
          return done(null, false, { message: 'Phone number not found' });
        }

        // Compare the provided password with the stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          // Incorrect password
          return done(null, false, { message: 'Incorrect password' });
        }

        // Authentication successful, return the user
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);



// Your existing GoogleStrategy for authentication
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (req, accessToken, refreshToken, profile, done) => { // Added `req` before `profile`
      try {
        const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
        const displayName = profile.displayName;
        const photos = profile.photos[0].value;

        if (!email) {
          return done(new Error('Email not found in profile'), null);
        }

        let user = await userModel.findOne({ where: { email } });

        if (!user) {
          // Create a new user if not found
          user = await userModel.create({
            email,
            email_verified: true,
            display_name: displayName,
            profile_pic: photos,
          });
        }

        // Generate access and refresh tokens
        const accessTokenValue = generateAccessToken(user.id);
        const refreshTokenValue = generateRefreshToken(user.id);

        // Store the refresh token using Sequelize
        const expirationDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000); // 1 day from now

        // Check if a refresh token already exists for the user
        const existingToken = await refreshTokenModel.findOne({
          where: { user_id: user.id },
        });
        if (existingToken) {
          // Update the existing refresh token
          await existingToken.update({
            token: refreshTokenValue,
            expiration_date: expirationDate,
          });
        } else {
          // Create a new refresh token entry
          await refreshTokenModel.create({
            user_id: user.id,
            token: refreshTokenValue,
            expiration_date: expirationDate,
          });
        }

        // Return the user
        user.accessToken = accessTokenValue;
        user.refreshToken = refreshTokenValue;

        return done(null, user);

      } catch (error) {
        console.error('Error in GoogleStrategy:', error);
        return done(error, null);
      }
    }
  )
);





passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "/auth/facebook/callback",
      profileFields: ['displayName', 'emails', 'photos'], // Include 'emails' and 'photos' field
      scope: ['email'], // Request email permission
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Access user data from the Facebook profile
        // const facebookId = profile.id;
        const displayName = profile.displayName;
        const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
        const photos = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null;

        if (!email) {
          return done(new Error('Email not found in Facebook profile'), null);
        }

        // Check if the user already exists in the database based on their Facebook ID or email
        let user = await userModel.findOne({
          where: { email },
        });

        if (!user) {
          // If the user doesn't exist, create a new user and store their data
          user = await userModel.create({
            // fb_id: facebookId,
            email: email,
            email_verified: true,
            display_name: displayName,
            profile_pic: photos,
          });
        }

        // Generate access and refresh tokens
        const accessTokenValue = generateAccessToken(user.id);
        const refreshTokenValue = generateRefreshToken(user.id);

        // Store the refresh token using Sequelize
        const expirationDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000); // 1 day from now

        // Check if a refresh token already exists for the user
        const existingToken = await refreshTokenModel.findOne({
          where: { user_id: user.id },
        });
        if (existingToken) {
          // Update the existing refresh token
          await existingToken.update({
            token: refreshTokenValue,
            expiration_date: expirationDate,
          });
        } else {
          // Create a new refresh token entry
          await refreshTokenModel.create({
            user_id: user.id,
            token: refreshTokenValue,
            expiration_date: expirationDate,
          });
        }

        // Return the user
        user.accessToken = accessTokenValue;
        user.refreshToken = refreshTokenValue;

        return done(null, user);

      } catch (error) {
        console.error('Error in FacebookStrategy:', error);
        return done(error, null);
      }
    }
  )
);



// Serialize and deserialize user for sessions (if needed)
passport.serializeUser((user, done) => {
  done(null, user.id);
});


passport.deserializeUser(async (id, done) => {
  try {
    const user = await userModel.findByPk(id);

    if (!user) {
      done(new Error('User not found'), null);
    } else {
      done(null, user);
    }
  } catch (error) {
    done(error, null);
  }
});

