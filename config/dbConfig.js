const mysql = require('mysql');
require('dotenv').config();

// Create a connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 10,
    port: 3306,
});

// Check the database connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        process.exit(1); // Exit the application on a database connection error
    }

    // Perform a test query
    connection.query('SELECT 1 + 1 AS solution', (error, results, fields) => {
        // Release the connection back to the pool
        connection.release();

        if (error) {
            console.error('Error performing the test query:', error);
        } else {
            console.log('The solution is: ', results[0].solution);
        }
    });
});

module.exports = pool;
