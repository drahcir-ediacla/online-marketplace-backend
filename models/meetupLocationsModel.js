const { DataTypes } = require('sequelize');


const defineMeetupLocationsModel = (sequelize) => {
    const meetupLocationsModel = sequelize.define('Meetup', {
        meetup_id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        product_id: {
            type: DataTypes.INTEGER,
            unique: false,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            unique: false,
            allowNull: false,
        },
        address: {
            type: DataTypes.TEXT,
            unique: false,
            allowNull: true,
        },
        latitude: {
            type: DataTypes.FLOAT,
            allowNull: false
        },
        longitude: {
            type: DataTypes.FLOAT,
            allowNull: false
        }
    }, {
        tableName: 'meetup_locations',
        timestamps: false, // Add this line to disable timestamps
    })

    return meetupLocationsModel;
}

module.exports = defineMeetupLocationsModel;