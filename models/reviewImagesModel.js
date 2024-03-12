const { DataTypes } = require('sequelize');

const defineReviewImagesModel = (sequelize) => {
  const reviewImagesModel = sequelize.define('reviewImages', { 
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    review_id: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    image_url: {
      type: DataTypes.TEXT,
      unique: true,
      allowNull: true,
    },
  }, {
    tableName: 'review_images', // Specify the actual table name in your database
    timestamps: false, // Add this line to disable timestamps
  });
  
  
  return reviewImagesModel;
};

module.exports = defineReviewImagesModel;
