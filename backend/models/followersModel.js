const { DataTypes } = require('sequelize')


const defineFollowersModel = (sequelize) => {
    const followersModel = sequelize.define('Followers', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        follower_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        },
        following_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
        }
    }, {
        tableName: 'followers',
        timestamps: false,
    })

    return followersModel;
}

module.exports = defineFollowersModel;