const passport = require("passport");
const db = require('../config/dbConfig')
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const LocalStrategy = require('passport-local').Strategy;
const { generateAccessToken, generateRefreshToken } = require('../utils/tokenUtils')
const {userModel, refreshTokenModel} = require('../config/sequelizeConfig')
const bcrypt = require('bcrypt');
require('dotenv').config();


passport.use(
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
            display_name: displayName,
            profile_pic: photos,
          });
        }

        // Generate access and refresh tokens
        const accessTokenValue = generateAccessToken(user.id);
        const refreshTokenValue = generateRefreshToken(user.id);

        // Store the refresh token using Sequelize
        const expirationDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000); // 1 day from now

        await refreshTokenModel.create({
          user_id: user.id,
          token: refreshTokenValue,
          expiration_date: expirationDate
        });

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
      profileFields: ['id', 'displayName', 'emails'], // Include 'emails' field
      scope: ['email'], // Request email permission
    },
    async (accessToken, refreshToken, profile, done) => {
        console.log('accessToken:', accessToken);
      console.log('refreshToken:', refreshToken);
      console.log('profile:', profile);

      // Access user data from the Facebook profile
      const facebookId = profile.id;
      const displayName = profile.displayName;
      const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;

      try {
        if (email) {
          // Check if the user already exists in the database based on their Facebook ID or email
          let user = await userModel.findOne({
            $or: [{ facebookId: facebookId }, { email: email }],
          });

          if (user) {
            // If the user exists, log them in
            done(null, user);
          } else {
            // If the user doesn't exist, create a new user and store their data
            user = new userModel({
              fb_id: facebookId,
              email: email,
              display_name: displayName,
              // Additional user data can be populated here
            });

            // Save the new user to the database
            await user.save();

            // Log in the new user
            done(null, user);
          }
        } else {
          // Handle the case where the email is not available in the Facebook profile
          done(new Error('Email not found in Facebook profile'), null);
        }
      } catch (error) {
        done(error, null);
      }
    }
  )
);

// ...


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
  
