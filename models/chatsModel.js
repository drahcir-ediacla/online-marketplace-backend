const { Sequelize, DataTypes } = require('sequelize');

const defineChatsModel = (sequelize) => {
    const chatsModel = sequelize.define('Chats', {
        chat_id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        // Update the participants attribute type to match the MySQL table
        participants: {
            type: DataTypes.TEXT, // Or DataTypes.STRING, depending on your specific requirements
            allowNull: false,
            get() {
                // Parse JSON stored as TEXT into a JavaScript object when accessed
                const value = this.getDataValue('participants');
                return value ? JSON.parse(value) : null;
            },
            set(value) {
                // Stringify JavaScript object into JSON when setting the value
                this.setDataValue('participants', JSON.stringify(value));
            },
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: Sequelize.NOW,
        },
        last_message_at: {
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
