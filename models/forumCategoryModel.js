const {DataTypes} = require('sequelize')


const defineForumCategoryModel = (sequelize) => {
    const forumCategoryModel = sequelize.define('ForumCategory', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        parent_id: {
            type: DataTypes.INTEGER,
            unique: false,
            allowNull: true,
        },
        name: {
            type: DataTypes.STRING,
            unique: false,
            allowNull: false,
        },
        description : {
            type: DataTypes.TEXT,
            unique: false,
            allowNull: true,
        },
        icon: {
            type: DataTypes.TEXT,
            unique: false,
            allowNull: false,
        }
    }, {
        tableName: 'forum_categories',
        timestamps: false,
    });

    return forumCategoryModel;
}

module.exports = defineForumCategoryModel;