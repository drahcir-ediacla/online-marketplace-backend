const { DataTypes } = require('sequelize');

const defineProductImagesModel = (sequelize) => {
  const productImagesModel = sequelize.define('Images', { // Use 'User' as the model name
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: false,
    },
    image_url: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
  }, {
    tableName: 'product_images', // Specify the actual table name in your database
    timestamps: false, // Add this line to disable timestamps
  });
  
  
  return productImagesModel;
};

module.exports = defineProductImagesModel;
