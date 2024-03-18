const { DataTypes } = require('sequelize');

const defineReviewsModel = (sequelize) => {
    const reviewsModel = sequelize.define('Reviews', {
        review_id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        reviewer_id: {
            type: DataTypes.BIGINT,
            unique: false,
            allowNull: false,
        },
        target_id: {
            type: DataTypes.BIGINT,
            unique: false,
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM('Buyer', 'Seller'),
            allowNull: false,
        },
        product_id: {
            type: DataTypes.INTEGER,
            unique: false,
            allowNull: false,
        },
        rating: {
            type: DataTypes.TINYINT,
            unique: false,
            allowNull: false,
        },
        comment: {
            type: DataTypes.TEXT,
            unique: false,
            allowNull: true,
        },
    }, {
        tableName: 'reviews',
        // timestamps: false,
    });
    
    
    return reviewsModel;
}

module.exports = defineReviewsModel;
