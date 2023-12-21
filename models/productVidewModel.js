const { DataTypes } = require('sequelize');

const defineProductViewModel = (sequelize) => {
    const productViewModel = sequelize.define('Views', {// Use 'Product' as the model name
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        session_id: {
            type: DataTypes.STRING,
            unique: false,
            allowNull: false,
        },
        product_id: {
            type: DataTypes.INTEGER,
            unique: false,
            allowNull: false,
        },
    }, {
        tableName: 'product_views', // Specify the actual table name in your database
        timestamps: false,
    })
    
    return productViewModel;
}

module.exports = defineProductViewModel;