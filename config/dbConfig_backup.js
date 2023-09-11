const mysql = require('mysql');

const db = mysql.createConnection({
    host: 'sql12.freesqldatabase.com',
    user: 'sql12645628',
    password: 'p6USL9pw8a',
    database: 'sql12645628',
    port: 3306
});

// Check the database connection
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        process.exit(1); // Exit the application on a database connection error
    }
    console.log('Connected to the database');
});

module.exports = db;
