const { Sequelize, DataTypes } = require('sequelize');

const defineOffersModel = (sequelize) => {
    const offersModel = sequelize.define('Offers', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        chat_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        buyer_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        seller_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        offer_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        offer_status: {
            type: DataTypes.ENUM('None','Pending','Accepted','Declined'), 
            defaultValue: 'None',
            allowNull: false,
        },
    }, {
        tableName: 'offers',
        timestamps: false,
    });

    return offersModel;
}


module.exports = defineOffersModel;