"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardStats = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = require("./Database");
class DashboardStats extends sequelize_1.Model {
}
exports.DashboardStats = DashboardStats;
DashboardStats.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    date: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    totalPlayers: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    allUsers: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    classCounts: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    totalGangs: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    prisonCount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    hospitalCount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    jobCount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    scavengeCount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    casinoCount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    robberyCount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    beatUpCount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    idleCount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    englishCount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    portugueseCount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    spanishCount: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    sequelize: Database_1.sequelize,
    tableName: "dashboard_stats",
    timestamps: false,
});
exports.default = DashboardStats;
//# sourceMappingURL=DashboardStats.js.map