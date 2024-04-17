const { DataTypes } = require('sequelize');

const defineNotificationModel = (sequelize) => {
    const notificationModel = sequelize.define('Notification', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        recipient_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        read: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        tableName: 'notifications',
    })

    return notificationModel;
};

module.exports = defineNotificationModel;
