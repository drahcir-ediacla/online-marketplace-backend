const {DataTypes} = require('sequelize')


const defineTagsModel = (sequelize) => {
    const tagsModel = sequelize.define('Tags', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        }
    }, {
        tableName: 'tags',
        timestamps: false,
    })

    return tagsModel;
}

module.exports = defineTagsModel