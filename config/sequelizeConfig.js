const { Sequelize } = require('sequelize');
const defineUserModel = require('../models/userModel')
const defineProductModel = require('../models/productModel')
const defineCategoryModel = require('../models/categoryModel')
const defineProductImagesModel = require('../models/productImagesModel')
const defineProductVideosModel = require('../models/productVideosModel')
const defineWishListModel = require('../models/wishListModel')
const defineProductViewModel = require('../models/productViewModel')
const defineRefreshTokenModel = require('../models/refreshTokenModel')
const defineMessagesModel = require('../models/messagesModel')
const defineChatsModel = require('../models/chatsModel')
const defineParticipantModel = require('../models/participantModel')
const defineFollowersModel = require('../models/followersModel')
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
const productVideosModel = defineProductVideosModel(sequelize);
const wishListModel = defineWishListModel(sequelize);
const productViewModel = defineProductViewModel(sequelize);
const refreshTokenModel = defineRefreshTokenModel(sequelize);
const messagesModel = defineMessagesModel(sequelize);
const chatsModel = defineChatsModel(sequelize);
const participantModel = defineParticipantModel(sequelize);
const followersModel = defineFollowersModel(sequelize);

// Define association after defining all models
categoryModel.hasMany(productModel, { foreignKey: 'category_id', as: 'products' });
categoryModel.hasMany(productImagesModel, { foreignKey: 'product_id', as: 'images' });
categoryModel.hasMany(productVideosModel, { foreignKey: 'product_id', as: 'videos' });
categoryModel.hasMany(categoryModel, { foreignKey: 'parent_id', as: 'subcategories' });

productModel.belongsTo(categoryModel, { foreignKey: 'category_id', as: 'category' });
productModel.belongsTo(userModel, { foreignKey: 'seller_id', as: 'seller' });
productModel.hasMany(productImagesModel, { foreignKey: 'product_id', as: 'images', onDelete: 'CASCADE' });
productModel.hasMany(productVideosModel, { foreignKey: 'product_id', as: 'videos', onDelete: 'CASCADE' });
productModel.hasMany(wishListModel, { foreignKey: 'product_id', as: 'wishlist',  onDelete: 'CASCADE' });
productModel.hasMany(productViewModel, { foreignKey: 'product_id', as: 'views', onDelete: 'CASCADE' });

userModel.hasMany(productModel, { foreignKey: 'seller_id', as: 'products' });
userModel.hasMany(refreshTokenModel, { foreignKey: 'user_id', as: 'refreshToken' });
userModel.hasMany(followersModel, { foreignKey: 'following_id', as: 'followers' });
userModel.hasMany(followersModel, { foreignKey: 'follower_id', as: 'following' });

productModel.hasMany(wishListModel, { foreignKey: 'product_id', as: 'products',  onDelete: 'CASCADE' });
chatsModel.belongsTo(productModel, {foreignKey: 'product_id', as: 'product'})

chatsModel.hasMany(messagesModel, { foreignKey: 'chat_id', as: 'messages' });
messagesModel.belongsTo(chatsModel, { foreignKey: 'chat_id', as: 'chat' });

participantModel.belongsTo(userModel, { foreignKey: 'user_id', as: 'authenticatedParticipant' });
participantModel.belongsTo(userModel, { foreignKey: 'user_id', as: 'otherParticipant' });
participantModel.belongsTo(chatsModel, { foreignKey: 'chat_id', as: 'chat' });

followersModel.belongsTo(userModel, { foreignKey: 'follower_id', as: 'followerInfo' });
followersModel.belongsTo(userModel, { foreignKey: 'following_id', as: 'followingInfo' });



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
    productVideosModel,
    wishListModel,
    productViewModel,
    refreshTokenModel,
    messagesModel,
    chatsModel,
    participantModel,
    followersModel
  };
