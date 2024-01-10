const { Sequelize } = require('sequelize');
const {DataTypes} = require('sequelize');

const defineMessagesModel = (sequelize) => {
    const messagesModel = sequelize.define('Messages', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        sender: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        receiver: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: Sequelize.NOW
          },
    }, {
        tableName: 'messages',
        timestamps: false,
    });

    return messagesModel;
}


module.exports = defineMessagesModel;