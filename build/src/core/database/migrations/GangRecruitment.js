"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateGangRecruitment = migrateGangRecruitment;
const sequelize_1 = require("sequelize");
const Database_1 = require("#core/database/Database");
const GangJoinRequests_1 = require("#core/database/GangJoinRequests");
const GangRecruitment_1 = require("#core/types/GangRecruitment");
async function migrateGangRecruitment(database = Database_1.sequelize) {
    const queryInterface = database.getQueryInterface();
    const gangColumns = await queryInterface.describeTable("gangs");
    if (!("recruitmentType" in gangColumns)) {
        await queryInterface.addColumn("gangs", "recruitmentType", {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            defaultValue: GangRecruitment_1.GangRecruitmentType.Disabled,
        });
    }
    await GangJoinRequests_1.GangJoinRequests.sync();
    await database.transaction(async (transaction) => {
        await database.query(`UPDATE "gang_join_requests"
			SET "status" = :cancelled
			WHERE "status" = :pending
			AND "id" NOT IN (
				SELECT MAX("id")
				FROM "gang_join_requests"
				WHERE "status" = :pending
				GROUP BY "userId"
			)`, {
            replacements: {
                cancelled: GangRecruitment_1.GangJoinRequestStatus.Cancelled,
                pending: GangRecruitment_1.GangJoinRequestStatus.Pending,
            },
            transaction,
        });
        await database.query(`CREATE UNIQUE INDEX IF NOT EXISTS "gang_join_requests_one_pending_per_user"
			ON "gang_join_requests" ("userId")
			WHERE "status" = 'PENDING'`, { transaction });
    });
}
//# sourceMappingURL=GangRecruitment.js.map