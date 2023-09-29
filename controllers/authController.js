const passport = require('passport');
const db = require('../config/dbConfig');
const bcrypt = require('bcrypt');
const { generateAccessToken, generateRefreshToken } = require('../utils/tokenUtils'); // You need to implement token utility functions

// Function to register a new user
const registerUser = (req, res) => {
  const { email, password } = req.body;

  // Check if the email already exists
  const checkEmailQuery = 'SELECT * FROM users WHERE email = ?';
  db.query(checkEmailQuery, [email], (emailErr, emailResult) => {
    if (emailErr) {
      console.error('Error checking email:', emailErr);
      res.status(500).json({ message: 'Error checking email' });
    } else if (emailResult.length > 0) {
      // If the email already exists, send an error response
      res.status(400).json({ message: 'Email already exists' });
    } else {
      // If the email is unique, hash the password and insert the new user
      bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
        if (hashErr) {
          console.error('Error hashing password:', hashErr);
          res.status(500).json({ message: 'Error hashing password' });
        } else {
          const insertUserQuery = 'INSERT INTO users (email, password) VALUES (?, ?)';
          db.query(insertUserQuery, [email, hashedPassword], (insertErr, insertResult) => {
            if (insertErr) {
              console.error('Error creating user:', insertErr);
              res.status(500).json({ message: 'Error creating user' });
            } else {
              res.status(201).json({ message: 'User created successfully' });
            }
          });
        }
      });
    }
  });
};

// Function to authenticate and login a user
const loginUser = (req, res) => {
  passport.authenticate('local', (authErr, user, info) => {
    if (authErr) {
      console.error('Error during authentication:', authErr);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (!user) {
      // Authentication failed
      return res.status(401).json({ message: 'Authentication failed. ' + info.message });
    }

    req.logIn(user, (loginErr) => {
      if (loginErr) {
        console.error('Error during login:', loginErr);
        return res.status(500).json({ message: 'Internal server error' });
      }

      // If the login is successful, create and return an access token and a refresh token
      const accessToken = generateAccessToken(user.id); // Implement this function
      const refreshToken = generateRefreshToken(user.id); // Implement this function

      // Store the refresh token in the database
      const storeRefreshTokenQuery = 'INSERT INTO refresh_tokens (user_id, token, expiration_date) VALUES (?, ?, ?)';
      const expirationDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000); // 1 day from now
      res.cookie('jwt', refreshToken, { httpOnly: true, sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000 });

      db.query(storeRefreshTokenQuery, [user.id, refreshToken, expirationDate], (storeErr) => {
        if (storeErr) {
          console.error('Error storing refresh token:', storeErr);
          return res.status(500).json({ message: 'Error storing refresh token' });
        }

        // Authentication succeeded, return success response
        res.status(200).json({
          success: true,
          message: 'Successfully authenticated',
          cookies: res.cookie,
          user,
          accessToken,
          refreshToken,
        });
      });
    });
  })(req, res); // Authenticate using the local strategy
};



const logoutUser = (req, res) => {
  // On the client, also delete the accessToken

  if (req.isAuthenticated()) {
    // Handle Passport session logout
    req.logout(); // Clear Passport session
  } else {
    // Handle local logout (JWT or cookies)

    const cookies = req.cookies;
    if (cookies && cookies.jwt) {
      const refreshToken = cookies.jwt;

      // Check if refreshToken exists in the database
      db.query('SELECT * FROM refresh_tokens WHERE token = ?', [refreshToken], (error, result) => {
        if (error) {
          console.error('Error handling logout:', error);
          return res.sendStatus(500); // Internal server error
        }

        // Ensure the result is an array
        if (!Array.isArray(result)) {
          return res.sendStatus(204); // No matching token found
        }

        if (result.length === 0) {
          return res.sendStatus(204);
        }

        const [row] = result;

        // Delete refreshToken from the database
        db.query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken], (deleteError) => {
          if (deleteError) {
            console.error('Error deleting refresh token:', deleteError);
            return res.sendStatus(500); // Internal server error
          }

          // Clear JWT cookie
          res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true, });
          // You can also clear other cookies if needed

          res.sendStatus(204);
        });
      });
    } else {
      // Handle other local logout methods if any
    }
  }

  // Redirect to the home page or any other desired page
  res.redirect(process.env.CLIENT_URL);
};






module.exports = { registerUser, loginUser, logoutUser };