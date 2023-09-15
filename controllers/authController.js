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
    const { email, password } = req.body;
  
    // Retrieve user with the provided email
    const getUserQuery = 'SELECT * FROM users WHERE email = ?';
    db.query(getUserQuery, [email], (getUserErr, user) => {
      if (getUserErr) {
        console.error('Error retrieving user:', getUserErr);
        res.status(500).json({ message: 'Error retrieving user' });
      } else if (user.length === 0) {
        res.status(401).json({ message: 'Authentication failed. User not found.' });
      } else {
        // Compare the provided password with the stored hashed password
        bcrypt.compare(password, user[0].password, (compareErr, isMatch) => {
          if (compareErr) {
            console.error('Error comparing passwords:', compareErr);
            res.status(500).json({ message: 'Error comparing passwords' });
          } else if (!isMatch) {
            res.status(401).json({ message: 'Authentication failed. Incorrect password.' });
          } else {
            // If the password is correct, create and return an access token and a refresh token
            const accessToken = generateAccessToken(user[0].id); // Implement this function
            const refreshToken = generateRefreshToken(user[0].id); // Implement this function
  
            // Store the refresh token in the database
            const storeRefreshTokenQuery = 'INSERT INTO refresh_tokens (user_id, token, expiration_date) VALUES (?, ?, ?)';
            const hashedRefreshToken = bcrypt.hashSync(refreshToken, 10); // Hash the refresh token
            const expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
            res.cookie('jwt', refreshToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 24 * 60 * 60 * 1000 });
            
            db.query(storeRefreshTokenQuery, [user[0].id, hashedRefreshToken, expirationDate], (storeErr) => {
            if (storeErr) {
                console.error('Error storing refresh token:', storeErr);
                res.status(500).json({ message: 'Error storing refresh token' });
            } else {
                // Return the access token and refresh token
                res.status(200).json({ accessToken, refreshToken });
            }
            });
          }
        });
      }
    });
  };
  
  module.exports = { registerUser, loginUser };