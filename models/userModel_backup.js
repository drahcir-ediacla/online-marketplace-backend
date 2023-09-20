const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
    host: process.env.DB_HOST || "localhost", // Hostname or IP address of the MySQL server
    username: process.env.DB_USER || "root",  // MySQL username
    password: process.env.DB_PASSWORD || '',    // MySQL password
    database: process.env.DB_NAME || 'test',   // Name of the MySQL database
    dialect: 'mysql',                          // Database dialect (MySQL)
  });

// Define your User model
const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  timestamps: true,
});

// Synchronize the model with the database (create the "users" table)
sequelize.sync();

module.exports = User;
