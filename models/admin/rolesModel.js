const {DataTypes} = require('sequelize')


const defineRolesModel = (sequelize) => {
    const rolesModel = sequelize.define('Roles', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        role: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        }
    }, {
        tableName: 'roles',
        timestamps: false,
    })

    return rolesModel;
}

module.exports = defineRolesModel