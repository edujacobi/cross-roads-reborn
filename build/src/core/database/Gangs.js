"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Gangs = void 0;
const GangRecruitment_1 = require("#core/types/GangRecruitment");
const sequelize_1 = require("sequelize");
const Database_1 = require("./Database");
class Gangs extends sequelize_1.Model {
}
exports.Gangs = Gangs;
Gangs.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    acronym: {
        type: sequelize_1.DataTypes.STRING(4),
        allowNull: false,
        unique: true,
    },
    money: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    baseId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    color: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    image: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    experience: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    level: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    recruitmentType: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: GangRecruitment_1.GangRecruitmentType.Disabled,
    },
    leaderId: {
        type: new sequelize_1.DataTypes.STRING(18),
        allowNull: false,
        references: {
            model: "users",
            key: "id",
        },
    },
    lastInvestmentRobbery: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    shipmentArrivesAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    lastShipmentSuccess: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    lastShipmentCancelled: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    createdAt: sequelize_1.DataTypes.DATE,
    updatedAt: sequelize_1.DataTypes.DATE,
}, {
    sequelize: Database_1.sequelize,
    tableName: "gangs",
    indexes: [
        { fields: ["level", "experience"] },
    ],
});
exports.default = Gangs;
//# sourceMappingURL=Gangs.js.map