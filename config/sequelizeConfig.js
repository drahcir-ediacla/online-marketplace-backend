const { Sequelize } = require('sequelize');
const defineUserModel = require('../models/userModel')
const defineProductModel = require('../models/productModel')
const defineCategoryModel = require('../models/categoryModel')
const defineProductImagesModel = require('../models/productImagesModel')
const definewishListModel = require('../models/wishListModel')
require('dotenv').config();

const sequelize = new Sequelize({
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  dialect: 'mysql',
  pool: {
    max: 10,            // Maximum number of connections in the pool
    min: 0,             // Minimum number of connections in the pool
    acquire: 30000,     // Maximum time, in milliseconds, that a connection can be acquired before an error occurs
    idle: 10000,        // Maximum time, in milliseconds, that a connection can be idle before being released
    evict: 60000,       // Time interval, in milliseconds, to run eviction check for idle connections (for Sequelize v7.0.0 and above)
  },
});

const userModel = defineUserModel(sequelize);
const productModel = defineProductModel(sequelize);
const categoryModel = defineCategoryModel(sequelize);
const productImagesModel = defineProductImagesModel(sequelize);
const wishListModel = definewishListModel(sequelize);

// Define association after defining all models
categoryModel.hasMany(productModel, { foreignKey: 'category_id', as: 'products' });
categoryModel.hasMany(productImagesModel, { foreignKey: 'product_id', as: 'images' });

productModel.belongsTo(categoryModel, { foreignKey: 'category_id', as: 'category' });
productModel.belongsTo(userModel, { foreignKey: 'seller_id', as: 'seller' });
productModel.hasMany(productImagesModel, { foreignKey: 'product_id', as: 'images' });
productModel.hasMany(wishListModel, { foreignKey: 'product_id', as: 'wishlist' });
userModel.hasMany(productModel, { foreignKey: 'seller_id', as: 'products' });



const initializeDatabase = async () => {
    try {
      // Connect to the database
      await sequelize.authenticate();
      console.log('Connection to the database has been established successfully.');
  
    
  
      // Synchronize the models with the database (creates tables if they do not exist)
      await sequelize.sync({ force: false }); // Set force to true to drop existing tables and recreate them
  
      console.log('Models synchronized with the database.');
    } catch (error) {
      console.error('Unable to connect to the database:', error);
      process.exit(1);
    }
  };
  
  // Call the async function to initialize the database
  initializeDatabase();
  
  // Export the Sequelize instance and models
  module.exports = {
    sequelize,
    userModel,
    productModel,
    categoryModel,
    productImagesModel,
    wishListModel
    // Add other models similarly, if any
    // otherModel,
  };
