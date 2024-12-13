const { DataTypes } = require('sequelize');

const defineProductModel = (sequelize) => {
    const productModel = sequelize.define('Product', {// Use 'Product' as the model name
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        product_name: {
            type: DataTypes.STRING,
            unique: false,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            unique: false,
            allowNull: true,
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            unique: false,
            allowNull: false,
        },
        category_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        seller_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        product_condition: {
            type: DataTypes.STRING,
            unique: false,
            allowNull: false,
        },
        mailing_delivery: {
            type: DataTypes.STRING,
            unique: false,
            allowNull: true,
        },
        youtube_link: {
            type: DataTypes.STRING,
            unique: false,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('Available', 'Sold'), 
            defaultValue: 'Available',
            allowNull: false,
        },
        createdAt: {
            type: DataTypes.DATE, // Use DATE data type for createdAt
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    }, {
        tableName: 'products', // Specify the actual table name in your database
        // timestamps: false, // Add this line to disable timestamps
    })

    return productModel;
}

module.exports = defineProductModel;