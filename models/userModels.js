const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
    host: process.env.DB_HOST, // Hostname or IP address of the MySQL server
    username: process.env.DB_USER,  // MySQL username
    password: process.env.DB_PASSWORD,    // MySQL password
    database: process.env.DB_NAME,   // Name of the MySQL database
    dialect: 'mysql',                          // Database dialect (MySQL)
  });

// Define your User model
const userModel = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    display_name: {
        type: DataTypes.STRING,
        unique: false,
        allowNull: false,
      },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true, // Ensure the email is in a valid format
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // You can add more fields here as needed
  });

// Sync the model with the database (create the table if it doesn't exist)
// This assumes you have already set up your database connection with Sequelize
userModel.sync();

module.exports = userModel;
