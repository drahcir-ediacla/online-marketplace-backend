const { DataTypes } = require('sequelize');

const defineProductVideosModel = (sequelize) => {
  const productVideosModel = sequelize.define('Images', { // Use 'User' as the model name
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: false,
    },
    video_url: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
  }, {
    tableName: 'product_videos', // Specify the actual table name in your database
    timestamps: false, // Add this line to disable timestamps
  });
  
  
  return productVideosModel;
};

module.exports = defineProductVideosModel;
