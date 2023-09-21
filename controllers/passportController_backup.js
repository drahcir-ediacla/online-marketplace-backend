const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const passport = require("passport");
const userModel = require('../models/userModels')
require('dotenv').config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log('accessToken:', accessToken);
      console.log('refreshToken:', refreshToken);
      console.log('profile:', profile);

      // Access the user's email address if available in the profile
      const googleId = profile.id; // Extract display name
      const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
      const displayName = profile.displayName; // Extract display name

      try {
        if (email) {
          // Check if the user already exists in the database based on their email
          let user = await userModel.findOne({ where: { email } });

          if (user) {
            // If the user exists, log them in
            done(null, user);
          } else {
            // If the user doesn't exist, create a new user and store their data
            user = new userModel({
              id: googleId,
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
          // Handle the case where the email is not available in the profile
          done(new Error('Email not found in profile'), null);
        }
      } catch (error) {
        done(error, null);
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
              id: facebookId,
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
    done(null, user);
  });
  
  passport.deserializeUser((user, done) => {
    
    done(null, user);
  });
