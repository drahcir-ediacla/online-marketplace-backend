const { DataTypes } = require('sequelize');


const defineListedLocationsModel = (sequelize) => {
    const listedLocationsModel = sequelize.define('ListedIn', {
        listedIn_id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
            allowNull: false,
        },
        product_id: {
            type: DataTypes.INTEGER,
            unique: true,
            allowNull: false,
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
        tableName: 'listed_locations',
    })

    return listedLocationsModel;
}

module.exports = defineListedLocationsModel;