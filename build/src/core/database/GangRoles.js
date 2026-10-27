"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GangRoles = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = require("./Database");
const Gangs_1 = require("./Gangs");
class GangRoles extends sequelize_1.Model {
}
exports.GangRoles = GangRoles;
GangRoles.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    gangId: {
        type: sequelize_1.DataTypes.INTEGER,
        references: {
            model: Gangs_1.Gangs,
            key: "id",
        },
        allowNull: false,
    },
    name: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
    },
    canInvite: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    canKick: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    canPromote: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    canEditGang: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    canImportShipments: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
}, {
    sequelize: Database_1.sequelize,
    tableName: "gangroles",
    timestamps: false,
    indexes: [
        { fields: ["gangId"] },
    ],
});
exports.default = GangRoles;
//# sourceMappingURL=GangRoles.js.map