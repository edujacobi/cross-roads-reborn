import { DataTypes, type Sequelize } from "sequelize";
import { sequelize } from "#core/database/Database";

export async function migrateAdminAuditLogsV3(database: Sequelize = sequelize): Promise<void> {
	const queryInterface = database.getQueryInterface();
	const columns = await queryInterface.describeTable("admin_audit_logs");

	for (const [name, type] of [
		["adminIpAddress", DataTypes.STRING],
		["adminDeviceType", DataTypes.STRING],
		["adminOperatingSystem", DataTypes.STRING],
	] as const) {
		if (!(name in columns)) {
			await queryInterface.addColumn("admin_audit_logs", name, {
				type,
				allowNull: true,
			});
		}
	}
}
