const { DataTypes } = require('sequelize')


const defineForumPostLikesModel = (sequelize) => {
    const forumPostLikesModel = sequelize.define('ForumPostLikes', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        post_id: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    }, {
        tableName: 'forum_post_likes',
        timestamps: false,
    })

    return forumPostLikesModel;
}

module.exports = defineForumPostLikesModel;