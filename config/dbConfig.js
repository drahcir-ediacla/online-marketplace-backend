// My Existing Database config
const mysql = require('mysql');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 50,
    queueLimit: 0,
    waitForConnection: true,
    port: 3306,
});

// Check the database connection
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        process.exit(1); // Exit the application on a database connection error
    }
    console.log('Connected to the database');
});

// Perform a test query
db.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
    if (error) {
        console.error('Error performing the test query:', error);
    } else {
        console.log('The solution is: ', results[0].solution);
    }
});

module.exports = db;
