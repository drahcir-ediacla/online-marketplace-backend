const { DataTypes } = require('sequelize');

const defineRefreshTokenModel = (sequelize) => {
    const refreshTokenModel = sequelize.define('RefreshToken', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.BIGINT,
            unique: true,
            allowNull: false,
        },
        token: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        },
        expiration_date: {
            type: DataTypes.DATE,
            allowNull: false,
            validate: {
                isAfter: new Date().toISOString(), // Ensures the expiration_date is always in the future
            },

        }
    }, {
        tableName: 'refresh_tokens',
        timestamps: false,
    });
    return refreshTokenModel;
}


module.exports = defineRefreshTokenModel;