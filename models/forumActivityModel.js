const { Sequelize, DataTypes } = require('sequelize');

const defineForumActivityModel = (sequelize) => {
    const forumActivityModel = sequelize.define('ForumNotification', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        target_user_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        subject_user_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: Sequelize.NOW,
        },
    }, {
        tableName: 'forum_activities',
        timestamps: false,
    })

    return forumActivityModel;
};

module.exports = defineForumActivityModel;
