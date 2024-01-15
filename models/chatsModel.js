const { Sequelize, DataTypes } = require('sequelize');

const defineChatsModel = (sequelize) => {
    const chatsModel = sequelize.define('Chats', {
        chat_id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: Sequelize.NOW,
        },
    }, {
        tableName: 'chats',
        timestamps: false,
    });

    return chatsModel;
};

module.exports = defineChatsModel;
