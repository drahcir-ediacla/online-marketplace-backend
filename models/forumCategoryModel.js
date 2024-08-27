const {DataTypes} = require('sequelize')


const defineForumCategory = (sequelize) => {
    const forumCategoryModel = sequelize.define('ForumCategory', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            unique: false,
            allowNull: false,
        },
        description : {
            type: DataTypes.STRING,
            unique: false,
            allowNull: true,
        }
    }, {
        tableName: 'forum_categories',
        timestamps: false,
    });

    return forumCategoryModel;
}

module.exports = defineForumCategory;