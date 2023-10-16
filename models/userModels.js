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
  fb_id: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    trim: true,
    validate: {
      isEmail: true,
    },
  },
  display_name: {
    type: DataTypes.STRING,
    unique: false,
    allowNull: true,
  },
  bio: {
    type: DataTypes.STRING,
    unique: false,
    allowNull: true,
  },
  first_name: {
    type: DataTypes.STRING,
    unique: false,
    allowNull: true,
  },
  last_name: {
    type: DataTypes.STRING,
    unique: false,
    allowNull: true,
  },
  country: {
    type: DataTypes.STRING,
    unique: false,
    allowNull: true,
    default: "Philippines"
  },
  region: {
    type: DataTypes.STRING,
    unique: false,
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING,
    unique: false,
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING,
    unique: false,
    allowNull: true,
  },
  gender: {
    type: DataTypes.STRING,
    unique: false,
    allowNull: true,
  },
  birthday: {
    type: DataTypes.STRING,
    unique: false,
    allowNull: true,
  },
  password: {
    type: DataTypes.STRING, 
    allowNull: true,
  },
  profile_pic: {
    type: DataTypes.STRING,
    unique: false,
    allowNull: true,
  },
  createdAt_MonthYear: {
    type: DataTypes.STRING,
    unique: false,
    allowNull: true,
  },
  // You can add more fields here as needed
}, {
  tableName: 'users', // Specify the actual table name in your database
});

module.exports = userModel;
