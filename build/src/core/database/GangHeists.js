"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GangHeists = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = require("./Database");
class GangHeists extends sequelize_1.Model {
}
exports.GangHeists = GangHeists;
GangHeists.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    gangId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
            model: "gangs",
            key: "id",
        },
        onDelete: "CASCADE",
    },
    heistCooldownUntil: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    mission1Completed: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    mission1CooldownUntil: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    mission2Completed: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    mission2CooldownUntil: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    mission3Completed: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    mission3CooldownUntil: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    heistWins: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    heistLosses: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    totalStolen: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
}, {
    sequelize: Database_1.sequelize,
    tableName: "gang_heists",
    timestamps: false,
    indexes: [
        { fields: ["gangId"] },
    ],
});
exports.default = GangHeists;
//# sourceMappingURL=GangHeists.js.map