const { DataTypes } = require('sequelize');

const defineCategoryModel = (sequelize) => {
    const categoryModel = sequelize.define('Category', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        label: {
            type: DataTypes.STRING,
            unique: false,
            allowNull: false,
        },
        value: {
            type: DataTypes.STRING,
            unique: false,
            allowNull: false,
        },
        icon: {
            type: DataTypes.STRING,
            unique: false,
            allowNull: true,
        },
        thumbnail_image: {
            type: DataTypes.STRING,
            unique: false,
            allowNull: true,
        },
        parent_id: {
            type: DataTypes.INTEGER,
            unique: false,
            allowNull: true,
        },
    }, {
        tableName: 'product_categories',
        timestamps: false,
    });
    
    
    return categoryModel;
}

module.exports = defineCategoryModel;
