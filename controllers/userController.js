
const db = require('../config/dbConfig');

// Fetch all users
const getUsers = (req, res) => {
    const sql = 'SELECT * FROM users';
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Error fetching users' });
      } else {
        res.status(200).json(results);
      }
    });
  };
  
  
  module.exports = {getUsers};