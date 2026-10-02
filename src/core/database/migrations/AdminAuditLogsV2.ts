import { AdminAuditActionId, AdminAuditSettingId } from "#core/types/AdminAuditLog";
import { DataTypes, QueryTypes, type Sequelize } from "sequelize";
import { sequelize } from "#core/database/Database";

interface LegacyAuditLog {
	id: number;
	adminId: string;
	action: string;
	target: string;
	previousValue: string;
	newValue: string;
	createdAt: Date;
}

const legacyActions: Record<string, AdminAuditActionId> = {
	setMainHeistAllowed: AdminAuditActionId.SetMainHeistAllowed,
	endSeason: AdminAuditActionId.EndSeason,
	createEvent: AdminAuditActionId.CreateEvent,
	updateEvent: AdminAuditActionId.UpdateEvent,
	deleteEvent: AdminAuditActionId.DeleteEvent,
	setMoney: AdminAuditActionId.SetMoney,
	cureUser: AdminAuditActionId.CureUser,
	freeUser: AdminAuditActionId.FreeUser,
	resetCooldown: AdminAuditActionId.ResetCooldown,
	removeAction: AdminAuditActionId.RemoveAction,
	setItem: AdminAuditActionId.SetItem,
	addSpecialCoins: AdminAuditActionId.AddSpecialCoins,
	setClass: AdminAuditActionId.SetClass,
	setNickname: AdminAuditActionId.SetNickname,
	setVip: AdminAuditActionId.SetVip,
	killUser: AdminAuditActionId.KillUser,
	addBadge: AdminAuditActionId.AddBadge,
	removeBadge: AdminAuditActionId.RemoveBadge,
	swapUsers: AdminAuditActionId.SwapUsers,
	deleteUser: AdminAuditActionId.DeleteUser,
};

function mapLegacyTarget(target: string): { targetUserId: string | null; targetSettingId: AdminAuditSettingId | null } {
	const userId = target.match(/\((\d+)\)(?:\s+-\s+.*)?$/)?.[1];
	if (userId) {
		return { targetUserId: userId, targetSettingId: null };
	}

	if (target === "Main heist setting") {
		return { targetUserId: null, targetSettingId: AdminAuditSettingId.MainHeist };
	}
	if (target === "Current season") {
		return { targetUserId: null, targetSettingId: AdminAuditSettingId.Season };
	}
	if (target.startsWith("Event:")) {
		return { targetUserId: null, targetSettingId: AdminAuditSettingId.Events };
	}
	if (target === "User accounts") {
		return { targetUserId: null, targetSettingId: AdminAuditSettingId.UserAccounts };
	}

	throw new Error("Admin audit log migration found an unrecognized legacy target.");
}

export async function migrateAdminAuditLogsV2(database: Sequelize = sequelize): Promise<void> {
	const queryInterface = database.getQueryInterface();
	const columns = await queryInterface.describeTable("admin_audit_logs");
	if ("actionId" in columns && "targetUserId" in columns && "targetSettingId" in columns) {
		const indexes = await queryInterface.showIndex("admin_audit_logs") as Array<{ name: string }>;
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
		await queryInterface.createTable(
			migratedTable,
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
				adminId: { type: DataTypes.STRING, allowNull: false },
				actionId: { type: DataTypes.INTEGER, allowNull: false },
				targetUserId: { type: DataTypes.STRING, allowNull: true },
				targetSettingId: { type: DataTypes.INTEGER, allowNull: true },
				previousValue: { type: DataTypes.TEXT, allowNull: false },
				newValue: { type: DataTypes.TEXT, allowNull: false },
				createdAt: { type: DataTypes.DATE, allowNull: false },
			},
			{ transaction },
		);

		let lastId = 0;
		while (true) {
			const rows = await database.query<LegacyAuditLog>(
				"SELECT id, adminId, action, target, previousValue, newValue, createdAt FROM admin_audit_logs WHERE id > :lastId ORDER BY id LIMIT 500",
				{ replacements: { lastId }, type: QueryTypes.SELECT, transaction },
			);
			if (rows.length === 0) break;

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
