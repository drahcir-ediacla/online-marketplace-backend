const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize({
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  dialect: 'mysql',
});

// Define your User model
const userModel = sequelize.define('User', { // Use 'User' as the model name
  id: {
    type: DataTypes.BIGINT,
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
      isEmail: true,
    },
  },
  // You can add more fields here as needed
}, {
  tableName: 'users', // Specify the actual table name in your database
});

module.exports = userModel;
