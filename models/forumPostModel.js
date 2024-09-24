const { DataTypes } = require('sequelize');

const defineForumPostModel = (sequelize) => {
    const forumPostModel = sequelize.define('ForumPost', {
        post_id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        user_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        discussion_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        parent_post_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        level: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
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
        tableName: 'forum_posts',
        timestamps: false, // Disabling automatic timestamps as we handle them manually
    });

    return forumPostModel;
};

module.exports = defineForumPostModel;
