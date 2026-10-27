"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HorseRaces = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = require("./Database");
class HorseRaces extends sequelize_1.Model {
}
exports.HorseRaces = HorseRaces;
HorseRaces.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    raceTime: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    winningHorse: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
    },
    totalBets: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    totalAmount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    isFinished: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: Database_1.sequelize,
    tableName: "horse_races",
    indexes: [
        { fields: ["raceTime"] },
        { fields: ["isFinished"] },
    ],
});
//# sourceMappingURL=HorseRaces.js.map