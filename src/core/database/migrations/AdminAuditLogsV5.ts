import { DataTypes, type Sequelize } from "sequelize";
import { sequelize } from "#core/database/Database";

export async function migrateAdminAuditLogsV5(database: Sequelize = sequelize): Promise<void> {
	const queryInterface = database.getQueryInterface();
	const columns = await queryInterface.describeTable("admin_audit_logs");

	if (!("targetGangId" in columns)) {
		await queryInterface.addColumn("admin_audit_logs", "targetGangId", {
			type: DataTypes.INTEGER,
			allowNull: true,
		});
	}
}
