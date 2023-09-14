const db = require('../config/dbConfig');
const bcrypt = require('bcrypt');

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

module.exports = { registerUser };
