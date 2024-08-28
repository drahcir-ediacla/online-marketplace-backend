const { DataTypes } = require('sequelize');

const defineForumDiscussionModel = (sequelize) => {
    const forumDiscussionModel = sequelize.define('ForumDiscussion', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        forum_category_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            onUpdate: DataTypes.NOW,
        },
    }, {
        tableName: 'discussions',
        timestamps: false, // Disabling automatic timestamps as we handle them manually
    });

    return forumDiscussionModel;
};

module.exports = defineForumDiscussionModel;
