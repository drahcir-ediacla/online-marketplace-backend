const db = require('../config/dbConfig');

const registerUser = (req, res) => {
    const { email, password } = req.body;
    const sql = `INSERT INTO users (email, password) VALUES (?, ?)`;
    db.query(sql, [email, password], (err, result) => {
      if (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ message: 'Error creating user' });
      } else {
        res.status(201).json({ message: 'User created successfully' });
      }
    });
  };

  module.exports = {registerUser};