const { DataTypes } = require('sequelize');

const defineForumDiscussionModel = (sequelize) => {
    const forumDiscussionModel = sequelize.define('ForumDiscussion', {
        discussion_id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
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
        tableName: 'forum_discussions',
        timestamps: false, // Disabling automatic timestamps as we handle them manually
    });

    return forumDiscussionModel;
};

module.exports = defineForumDiscussionModel;
