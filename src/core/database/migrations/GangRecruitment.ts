import { DataTypes, type Sequelize } from "sequelize";
import { sequelize } from "#core/database/Database";
import { GangJoinRequests } from "#core/database/GangJoinRequests";
import { GangRecruitmentType } from "#core/types/GangRecruitment";

export async function migrateGangRecruitment(
	database: Sequelize = sequelize,
): Promise<void> {
	const queryInterface = database.getQueryInterface();
	const gangColumns = await queryInterface.describeTable("gangs");

	if (!("recruitmentType" in gangColumns)) {
		await queryInterface.addColumn("gangs", "recruitmentType", {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: GangRecruitmentType.Disabled,
		});
	}

	await GangJoinRequests.sync();
}
