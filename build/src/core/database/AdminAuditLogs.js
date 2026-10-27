"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAuditLogs = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = require("./Database");
class AdminAuditLogs extends sequelize_1.Model {
}
exports.AdminAuditLogs = AdminAuditLogs;
AdminAuditLogs.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    adminId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    adminIpAddress: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    adminDeviceType: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    adminOperatingSystem: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    adminBrowser: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    actionId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    targetUserId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    targetSettingId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    targetGangId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    previousValue: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    newValue: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
}, {
    sequelize: Database_1.sequelize,
    tableName: "admin_audit_logs",
    timestamps: false,
});
//# sourceMappingURL=AdminAuditLogs.js.map