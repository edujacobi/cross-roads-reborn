"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const sequelize_1 = require("sequelize");
const AdminAuditLogsV2_1 = require("#core/database/migrations/AdminAuditLogsV2");
const AdminAuditLogsV3_1 = require("#core/database/migrations/AdminAuditLogsV3");
const AdminAuditLogsV4_1 = require("#core/database/migrations/AdminAuditLogsV4");
const AdminAuditLogsV5_1 = require("#core/database/migrations/AdminAuditLogsV5");
(0, vitest_1.describe)("Admin audit log schema migration", () => {
    let database;
    (0, vitest_1.afterEach)(async () => {
        await database?.close();
        database = undefined;
    });
    (0, vitest_1.it)("migrates legacy rows without retaining stored names or free-form targets", async () => {
        database = new sequelize_1.Sequelize({ dialect: "sqlite", storage: ":memory:", logging: false });
        const queryInterface = database.getQueryInterface();
        await queryInterface.createTable("admin_audit_logs", {
            id: { type: sequelize_1.DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            adminId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
            adminName: { type: sequelize_1.DataTypes.STRING, allowNull: false },
            action: { type: sequelize_1.DataTypes.STRING, allowNull: false },
            target: { type: sequelize_1.DataTypes.STRING, allowNull: false },
            previousValue: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
            newValue: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
            createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
        });
        await queryInterface.bulkInsert("admin_audit_logs", [
            {
                id: 3,
                adminId: "111",
                adminName: "Old name",
                action: "setItem",
                target: "Player (222) - Grenade",
                previousValue: "{\"quantity\":1}",
                newValue: "{\"quantity\":2}",
                createdAt: new Date("2026-01-01T00:00:00.000Z"),
            },
            {
                id: 4,
                adminId: "111",
                adminName: "Old name",
                action: "setMainHeistAllowed",
                target: "Main heist setting",
                previousValue: "true",
                newValue: "false",
                createdAt: new Date("2026-01-02T00:00:00.000Z"),
            },
        ]);
        await (0, AdminAuditLogsV2_1.migrateAdminAuditLogsV2)(database);
        await (0, AdminAuditLogsV2_1.migrateAdminAuditLogsV2)(database);
        const columns = await queryInterface.describeTable("admin_audit_logs");
        (0, vitest_1.expect)(columns).not.toHaveProperty("adminName");
        (0, vitest_1.expect)(columns).not.toHaveProperty("target");
        (0, vitest_1.expect)(columns.actionId).toBeDefined();
        (0, vitest_1.expect)(columns.targetUserId).toBeDefined();
        (0, vitest_1.expect)(columns.targetSettingId).toBeDefined();
        const rows = await database.query("SELECT id, actionId, targetUserId, targetSettingId, previousValue, newValue FROM admin_audit_logs ORDER BY id", { type: sequelize_1.QueryTypes.SELECT });
        (0, vitest_1.expect)(rows).toEqual([
            {
                id: 3,
                actionId: 11,
                targetUserId: "222",
                targetSettingId: null,
                previousValue: "{\"quantity\":1}",
                newValue: "{\"quantity\":2}",
            },
            {
                id: 4,
                actionId: 1,
                targetUserId: null,
                targetSettingId: 1,
                previousValue: "true",
                newValue: "false",
            },
        ]);
    });
    (0, vitest_1.it)("adds nullable request metadata columns idempotently", async () => {
        database = new sequelize_1.Sequelize({ dialect: "sqlite", storage: ":memory:", logging: false });
        await database.getQueryInterface().createTable("admin_audit_logs", {
            id: { type: sequelize_1.DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
            adminId: { type: sequelize_1.DataTypes.STRING, allowNull: false },
            actionId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
            targetUserId: { type: sequelize_1.DataTypes.STRING, allowNull: true },
            targetSettingId: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
            previousValue: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
            newValue: { type: sequelize_1.DataTypes.TEXT, allowNull: false },
            createdAt: { type: sequelize_1.DataTypes.DATE, allowNull: false },
        });
        await (0, AdminAuditLogsV3_1.migrateAdminAuditLogsV3)(database);
        await (0, AdminAuditLogsV3_1.migrateAdminAuditLogsV3)(database);
        const columns = await database.getQueryInterface().describeTable("admin_audit_logs");
        (0, vitest_1.expect)(columns.adminIpAddress.allowNull).toBe(true);
        (0, vitest_1.expect)(columns.adminDeviceType.allowNull).toBe(true);
        (0, vitest_1.expect)(columns.adminOperatingSystem.allowNull).toBe(true);
    });
    (0, vitest_1.it)("adds the browser metadata column idempotently", async () => {
        database = new sequelize_1.Sequelize({ dialect: "sqlite", storage: ":memory:", logging: false });
        await database.getQueryInterface().createTable("admin_audit_logs", {
            id: { type: sequelize_1.DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        });
        await (0, AdminAuditLogsV4_1.migrateAdminAuditLogsV4)(database);
        await (0, AdminAuditLogsV4_1.migrateAdminAuditLogsV4)(database);
        const columns = await database.getQueryInterface().describeTable("admin_audit_logs");
        (0, vitest_1.expect)(columns.adminBrowser.allowNull).toBe(true);
    });
    (0, vitest_1.it)("adds the gang target column idempotently", async () => {
        database = new sequelize_1.Sequelize({ dialect: "sqlite", storage: ":memory:", logging: false });
        await database.getQueryInterface().createTable("admin_audit_logs", {
            id: { type: sequelize_1.DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        });
        await (0, AdminAuditLogsV5_1.migrateAdminAuditLogsV5)(database);
        await (0, AdminAuditLogsV5_1.migrateAdminAuditLogsV5)(database);
        const columns = await database.getQueryInterface().describeTable("admin_audit_logs");
        (0, vitest_1.expect)(columns.targetGangId.allowNull).toBe(true);
    });
});
//# sourceMappingURL=AdminAuditLogsV2.test.js.map