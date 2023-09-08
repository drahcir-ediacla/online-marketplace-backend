const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Use environment variables for database configuration
const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'test'
});

// Check the database connection
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        process.exit(1); // Exit the application on a database connection error
    }
    console.log('Connected to the database');
});

app.get('/', (req, res) => {
    return res.json("From Backend Side");
});

app.post('/register', (req, res) => {
  const { email, password } = req.body;
  
  // Add validation and hashing here in a real application

  const sql = 'INSERT INTO users (email, password) VALUES (?, ?)';
  db.query(sql, [email, password], (err, result) => {
    if (err) {
      console.error('MySQL query error:', err);
      res.status(500).json({ message: 'Registration failed' });
    } else {
      res.status(200).json({ message: 'Registration successful' });
    }
  });
});

app.listen(8081, () => {
    console.log("Listening on port 8081");
});