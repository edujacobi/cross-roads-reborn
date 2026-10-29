import { DataTypes, type Sequelize } from "sequelize";
import { sequelize } from "#core/database/Database";
import { GangJoinRequests } from "#core/database/GangJoinRequests";
import { GangJoinRequestStatus, GangRecruitmentType } from "#core/types/GangRecruitment";

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

	await database.transaction(async transaction => {
		await database.query(
			`UPDATE "gang_join_requests"
			SET "status" = :cancelled
			WHERE "status" = :pending
			AND "id" NOT IN (
				SELECT MAX("id")
				FROM "gang_join_requests"
				WHERE "status" = :pending
				GROUP BY "userId"
			)`,
			{
				replacements: {
					cancelled: GangJoinRequestStatus.Cancelled,
					pending: GangJoinRequestStatus.Pending,
				},
				transaction,
			},
		);

		await database.query(
			`CREATE UNIQUE INDEX IF NOT EXISTS "gang_join_requests_one_pending_per_user"
			ON "gang_join_requests" ("userId")
			WHERE "status" = 'PENDING'`,
			{ transaction },
		);
	});
}
