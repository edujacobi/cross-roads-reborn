import { afterEach, describe, expect, it } from "vitest";
import { DataTypes, QueryTypes, Sequelize } from "sequelize";
import { migrateAdminAuditLogsV2 } from "#core/database/migrations/AdminAuditLogsV2";
import { migrateAdminAuditLogsV3 } from "#core/database/migrations/AdminAuditLogsV3";

describe("Admin audit log schema migration", () => {
	let database: Sequelize | undefined;

	afterEach(async () => {
		await database?.close();
		database = undefined;
	});

	it("migrates legacy rows without retaining stored names or free-form targets", async () => {
		database = new Sequelize({ dialect: "sqlite", storage: ":memory:", logging: false });
		const queryInterface = database.getQueryInterface();
		await queryInterface.createTable("admin_audit_logs", {
			id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			adminId: { type: DataTypes.STRING, allowNull: false },
			adminName: { type: DataTypes.STRING, allowNull: false },
			action: { type: DataTypes.STRING, allowNull: false },
			target: { type: DataTypes.STRING, allowNull: false },
			previousValue: { type: DataTypes.TEXT, allowNull: false },
			newValue: { type: DataTypes.TEXT, allowNull: false },
			createdAt: { type: DataTypes.DATE, allowNull: false },
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

		await migrateAdminAuditLogsV2(database);
		await migrateAdminAuditLogsV2(database);

		const columns = await queryInterface.describeTable("admin_audit_logs");
		expect(columns).not.toHaveProperty("adminName");
		expect(columns).not.toHaveProperty("target");
		expect(columns.actionId).toBeDefined();
		expect(columns.targetUserId).toBeDefined();
		expect(columns.targetSettingId).toBeDefined();
		const rows = await database.query<{
			id: number;
			actionId: number;
			targetUserId: string | null;
			targetSettingId: number | null;
			previousValue: string;
			newValue: string;
		}>(
			"SELECT id, actionId, targetUserId, targetSettingId, previousValue, newValue FROM admin_audit_logs ORDER BY id",
			{ type: QueryTypes.SELECT },
		);
		expect(rows).toEqual([
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

	it("adds nullable request metadata columns idempotently", async () => {
		database = new Sequelize({ dialect: "sqlite", storage: ":memory:", logging: false });
		await database.getQueryInterface().createTable("admin_audit_logs", {
			id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
			adminId: { type: DataTypes.STRING, allowNull: false },
			actionId: { type: DataTypes.INTEGER, allowNull: false },
			targetUserId: { type: DataTypes.STRING, allowNull: true },
			targetSettingId: { type: DataTypes.INTEGER, allowNull: true },
			previousValue: { type: DataTypes.TEXT, allowNull: false },
			newValue: { type: DataTypes.TEXT, allowNull: false },
			createdAt: { type: DataTypes.DATE, allowNull: false },
		});

		await migrateAdminAuditLogsV3(database);
		await migrateAdminAuditLogsV3(database);

		const columns = await database.getQueryInterface().describeTable("admin_audit_logs");
		expect(columns.adminIpAddress.allowNull).toBe(true);
		expect(columns.adminDeviceType.allowNull).toBe(true);
		expect(columns.adminOperatingSystem.allowNull).toBe(true);
	});
});
