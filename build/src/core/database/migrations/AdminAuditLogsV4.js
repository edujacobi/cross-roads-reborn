"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateAdminAuditLogsV4 = migrateAdminAuditLogsV4;
const sequelize_1 = require("sequelize");
const Database_1 = require("#core/database/Database");
async function migrateAdminAuditLogsV4(database = Database_1.sequelize) {
    const queryInterface = database.getQueryInterface();
    const columns = await queryInterface.describeTable("admin_audit_logs");
    if (!("adminBrowser" in columns)) {
        await queryInterface.addColumn("admin_audit_logs", "adminBrowser", {
            type: sequelize_1.DataTypes.STRING,
            allowNull: true,
        });
    }
}
//# sourceMappingURL=AdminAuditLogsV4.js.map