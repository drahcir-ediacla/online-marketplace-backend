const {DataTypes} = require('sequelize')


const defineDiscussionTagsModel = (sequelize) => {
    const discussionTagsModel = sequelize.define('DiscussionTags', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        discussion_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        tag_id: {
            type: DataTypes.INTEGER,
            unique: false,
            allowNull: false,
        }
    }, {
        tableName: 'discussion_tags',
        timestamps: false,
    })

    return discussionTagsModel;
}

module.exports = defineDiscussionTagsModel