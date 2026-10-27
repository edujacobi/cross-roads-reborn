"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateAdminAuditLogsV2 = migrateAdminAuditLogsV2;
const AdminAuditLog_1 = require("#core/types/AdminAuditLog");
const sequelize_1 = require("sequelize");
const Database_1 = require("#core/database/Database");
const legacyActions = {
    setMainHeistAllowed: AdminAuditLog_1.AdminAuditActionId.SetMainHeistAllowed,
    endSeason: AdminAuditLog_1.AdminAuditActionId.EndSeason,
    createEvent: AdminAuditLog_1.AdminAuditActionId.CreateEvent,
    updateEvent: AdminAuditLog_1.AdminAuditActionId.UpdateEvent,
    deleteEvent: AdminAuditLog_1.AdminAuditActionId.DeleteEvent,
    setMoney: AdminAuditLog_1.AdminAuditActionId.SetMoney,
    cureUser: AdminAuditLog_1.AdminAuditActionId.CureUser,
    freeUser: AdminAuditLog_1.AdminAuditActionId.FreeUser,
    resetCooldown: AdminAuditLog_1.AdminAuditActionId.ResetCooldown,
    removeAction: AdminAuditLog_1.AdminAuditActionId.RemoveAction,
    setItem: AdminAuditLog_1.AdminAuditActionId.SetItem,
    addSpecialCoins: AdminAuditLog_1.AdminAuditActionId.AddSpecialCoins,
    setClass: AdminAuditLog_1.AdminAuditActionId.SetClass,
    setNickname: AdminAuditLog_1.AdminAuditActionId.SetNickname,
    setVip: AdminAuditLog_1.AdminAuditActionId.SetVip,
    killUser: AdminAuditLog_1.AdminAuditActionId.KillUser,
    addBadge: AdminAuditLog_1.AdminAuditActionId.AddBadge,
    removeBadge: AdminAuditLog_1.AdminAuditActionId.RemoveBadge,
    swapUsers: AdminAuditLog_1.AdminAuditActionId.SwapUsers,
    deleteUser: AdminAuditLog_1.AdminAuditActionId.DeleteUser,
};
function mapLegacyTarget(target) {
    const userId = target.match(/\((\d+)\)(?:\s+-\s+.*)?$/)?.[1];
    if (userId) {
        return { targetUserId: userId, targetSettingId: null };
    }
    if (target === "Main heist setting") {
        return { targetUserId: null, targetSettingId: AdminAuditLog_1.AdminAuditSettingId.MainHeist };
    }
    if (target === "Current season") {
        return { targetUserId: null, targetSettingId: AdminAuditLog_1.AdminAuditSettingId.Season };
    }
    if (target.startsWith("Event:")) {
        return { targetUserId: null, targetSettingId: AdminAuditLog_1.AdminAuditSettingId.Events };
    }
    if (target === "User accounts") {
        return { targetUserId: null, targetSettingId: AdminAuditLog_1.AdminAuditSettingId.UserAccounts };
    }
    throw new Error("Admin audit log migration found an unrecognized legacy target.");
}
async function migrateAdminAuditLogsV2(database = Database_1.sequelize) {
    const queryInterface = database.getQueryInterface();
    const columns = await queryInterface.describeTable("admin_audit_logs");
    if ("actionId" in columns && "targetUserId" in columns && "targetSettingId" in columns) {
        const indexes = await queryInterface.showIndex("admin_audit_logs");
        const indexNames = new Set(indexes.map(index => index.name));
        for (const [name, field] of [
            ["admin_audit_logs_created_at", "createdAt"],
            ["admin_audit_logs_admin_id", "adminId"],
            ["admin_audit_logs_target_user_id", "targetUserId"],
            ["admin_audit_logs_target_setting_id", "targetSettingId"],
        ]) {
            if (!indexNames.has(name)) {
                await queryInterface.addIndex("admin_audit_logs", [field], { name });
            }
        }
        return;
    }
    if (!("adminName" in columns && "action" in columns && "target" in columns)) {
        throw new Error("Admin audit log table has an unsupported schema.");
    }
    const transaction = await database.transaction();
    const migratedTable = "admin_audit_logs_v2";
    try {
        await queryInterface.createTable(migratedTable, {
            id: { type: sequelize_1.DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            adminId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
            actionId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
            targetUserId: { type: sequelize_1.DataTypes.STRING, allowNull: true },
            targetSettingId: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
            previousValue: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
            newValue: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
            createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
        }, { transaction });
        let lastId = 0;
        while (true) {
            const rows = await database.query("SELECT id, adminId, action, target, previousValue, newValue, createdAt FROM admin_audit_logs WHERE id > :lastId ORDER BY id LIMIT 500", { replacements: { lastId }, type: sequelize_1.QueryTypes.SELECT, transaction });
            if (rows.length === 0)
                break;
            const migratedRows = rows.map((row) => {
                const actionId = legacyActions[row.action];
                if (actionId === undefined) {
                    throw new Error(`Admin audit log migration found an unrecognized action in row ${row.id}.`);
                }
                return {
                    id: row.id,
                    adminId: row.adminId,
                    actionId,
                    ...mapLegacyTarget(row.target),
                    previousValue: row.previousValue,
                    newValue: row.newValue,
                    createdAt: row.createdAt,
                };
            });
            await queryInterface.bulkInsert(migratedTable, migratedRows, { transaction });
            lastId = rows[rows.length - 1].id;
        }
        await queryInterface.dropTable("admin_audit_logs", { transaction });
        await queryInterface.renameTable(migratedTable, "admin_audit_logs", { transaction });
        await queryInterface.addIndex("admin_audit_logs", ["createdAt"], { name: "admin_audit_logs_created_at", transaction });
        await queryInterface.addIndex("admin_audit_logs", ["adminId"], { name: "admin_audit_logs_admin_id", transaction });
        await queryInterface.addIndex("admin_audit_logs", ["targetUserId"], { name: "admin_audit_logs_target_user_id", transaction });
        await queryInterface.addIndex("admin_audit_logs", ["targetSettingId"], { name: "admin_audit_logs_target_setting_id", transaction });
        await transaction.commit();
    }
    catch (error) {
        await transaction.rollback();
        throw error;
    }
}
//# sourceMappingURL=AdminAuditLogsV2.js.map