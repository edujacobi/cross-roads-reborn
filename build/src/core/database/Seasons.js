"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Seasons = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = require("./Database");
class Seasons extends sequelize_1.Model {
}
exports.Seasons = Seasons;
Seasons.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    number: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        unique: true,
    },
    startDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    endDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    // ponytail: single consolidated JSON column for all 14 seasonal ranking snapshots
    topData: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
        defaultValue: "{}",
    },
    howManyPlayers: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    createdAt: sequelize_1.DataTypes.DATE,
    updatedAt: sequelize_1.DataTypes.DATE,
}, {
    sequelize: Database_1.sequelize,
    tableName: "seasons",
    indexes: [
        { fields: ["number"] },
    ],
});
//# sourceMappingURL=Seasons.js.map