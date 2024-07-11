const { DataTypes } = require('sequelize')


const defineWishListModel = (sequelize) => {
    const wishListModel = sequelize.define('Wishlist', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        product_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        }
    }, {
        tableName: 'wishlist',
        timestamps: false,
    })

    return wishListModel;
}

module.exports = defineWishListModel;