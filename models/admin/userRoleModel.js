const {DataTypes} = require('sequelize')


const defineUserRoleModel = (sequelize) => {
    const userRoleModel = sequelize.define('UserRole', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.BIGINT,
            unique: true,
            allowNull: false,
        },
        role_id: {
            type: DataTypes.BIGINT,
            unique: true,
            allowNull: false,
        }
    }, {
        tableName: 'user_role',
        timestamps: false,
    })

    return userRoleModel;
}

module.exports = defineUserRoleModel