"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateAdminAuditLogsV5 = migrateAdminAuditLogsV5;
const sequelize_1 = require("sequelize");
const Database_1 = require("#core/database/Database");
async function migrateAdminAuditLogsV5(database = Database_1.sequelize) {
    const queryInterface = database.getQueryInterface();
    const columns = await queryInterface.describeTable("admin_audit_logs");
    if (!("targetGangId" in columns)) {
        await queryInterface.addColumn("admin_audit_logs", "targetGangId", {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: true,
        });
    }
}
//# sourceMappingURL=AdminAuditLogsV5.js.map