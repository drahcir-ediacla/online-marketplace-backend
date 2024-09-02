const { DataTypes } = require('sequelize');

const defineForumPostModel = (sequelize) => {
    const forumPostModel = sequelize.define('ForumPost', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        discussion_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        parent_post_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        content: {
            type: DataTypes.TEXT,
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
        tableName: 'posts',
        timestamps: false, // Disabling automatic timestamps as we handle them manually
    });

    return forumPostModel;
};

module.exports = defineForumPostModel;
