import { DataTypes, type Sequelize } from "sequelize";
import { sequelize } from "#core/database/Database";

export async function migrateAdminAuditLogsV4(database: Sequelize = sequelize): Promise<void> {
	const queryInterface = database.getQueryInterface();
	const columns = await queryInterface.describeTable("admin_audit_logs");

	if (!("adminBrowser" in columns)) {
		await queryInterface.addColumn("admin_audit_logs", "adminBrowser", {
			type: DataTypes.STRING,
			allowNull: true,
		});
	}
}
