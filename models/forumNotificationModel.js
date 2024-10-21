const { Sequelize, DataTypes } = require('sequelize');

const defineForumNotificationModel = (sequelize) => {
    const forumNotificationModel = sequelize.define('ForumNotification', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        recipient_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        subject_user_id: {
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
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: Sequelize.NOW,
        },
    }, {
        tableName: 'forum_notifications',
        timestamps: false,
    })

    return forumNotificationModel;
};

module.exports = defineForumNotificationModel;
