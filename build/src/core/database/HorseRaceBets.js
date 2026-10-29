"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HorseRaceBets = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = require("./Database");
const HorseRaces_1 = require("./HorseRaces");
class HorseRaceBets extends sequelize_1.Model {
}
exports.HorseRaceBets = HorseRaceBets;
HorseRaceBets.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    userId: {
        type: new sequelize_1.DataTypes.STRING(18),
        allowNull: false,
        references: {
            model: "users",
            key: "id",
        },
    },
    raceId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "horse_races",
            key: "id",
        },
    },
    horseNumber: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    amount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    hasWon: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null,
    },
    winnings: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
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
    tableName: "horse_race_bets",
    indexes: [
        { fields: ["userId"] },
        { fields: ["raceId"] },
    ],
});
// Define associations
HorseRaceBets.belongsTo(HorseRaces_1.HorseRaces, { foreignKey: "raceId" });
HorseRaces_1.HorseRaces.hasMany(HorseRaceBets, { foreignKey: "raceId" });
//# sourceMappingURL=HorseRaceBets.js.map