"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateAdminAuditLogsV3 = migrateAdminAuditLogsV3;
const sequelize_1 = require("sequelize");
const Database_1 = require("#core/database/Database");
async function migrateAdminAuditLogsV3(database = Database_1.sequelize) {
    const queryInterface = database.getQueryInterface();
    const columns = await queryInterface.describeTable("admin_audit_logs");
    for (const [name, type] of [
        ["adminIpAddress", sequelize_1.DataTypes.STRING],
        ["adminDeviceType", sequelize_1.DataTypes.STRING],
        ["adminOperatingSystem", sequelize_1.DataTypes.STRING],
    ]) {
        if (!(name in columns)) {
            await queryInterface.addColumn("admin_audit_logs", name, {
                type,
                allowNull: true,
            });
        }
    }
}
//# sourceMappingURL=AdminAuditLogsV3.js.map