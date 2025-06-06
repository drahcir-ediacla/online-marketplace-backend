const { DataTypes } = require('sequelize');

const defineUserModel = (sequelize) => {
  const userModel = sequelize.define('User', { // Use 'User' as the model name
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    account_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
      trim: true,
      validate: {
        isEmail: true,
      },
    },
    new_email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
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
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    phone: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: true,
    },
    new_phone: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: true,
    },
    phone_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
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
    otp: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    otp_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('online', 'offline'),
      allowNull: false,
      defaultValue: 'offline' // Set default status to offline
    },
    profile_pic: {
      type: DataTypes.STRING,
      unique: false,
      allowNull: true,
    },
    cover_photo: {
      type: DataTypes.STRING,
      unique: false,
      allowNull: true,
    },
  }, {
    tableName: 'users', // Specify the actual table name in your database
  });
  return userModel;
};

module.exports = defineUserModel;
