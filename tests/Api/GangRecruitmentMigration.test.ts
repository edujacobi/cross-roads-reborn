import { DataTypes, QueryTypes, Sequelize } from "sequelize";
import { describe, expect, it, vi } from "vitest";
import { GangJoinRequests } from "#core/database/GangJoinRequests";
import { migrateGangRecruitment } from "#core/database/migrations/GangRecruitment";
import { GangJoinRequestStatus } from "#core/types/GangRecruitment";

describe("Gang recruitment migration", () => {
	it("keeps the newest pending request and enforces one pending request per user", async () => {
		const database = new Sequelize({ dialect: "sqlite", storage: ":memory:", logging: false });
		const queryInterface = database.getQueryInterface();
		const sync = vi.spyOn(GangJoinRequests, "sync").mockResolvedValue(
			GangJoinRequests.build({
				gangId: 1,
				userId: "applicant",
				status: GangJoinRequestStatus.Pending,
			}),
		);

		try {
			await queryInterface.createTable("gangs", {
				id: { type: DataTypes.INTEGER, primaryKey: true },
				recruitmentType: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
			});
			await queryInterface.createTable("gang_join_requests", {
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				userId: { type: DataTypes.STRING(18), allowNull: false },
				status: { type: DataTypes.STRING(20), allowNull: false },
			});
			await database.query(
				`INSERT INTO "gang_join_requests" ("id", "userId", "status") VALUES
					(1, :applicant, :pending),
					(2, :applicant, :pending)`,
				{ replacements: { applicant: "applicant", pending: GangJoinRequestStatus.Pending } },
			);

			await migrateGangRecruitment(database);

			const rows = await database.query<{ id: number; status: string }>(
				`SELECT "id", "status" FROM "gang_join_requests" ORDER BY "id"`,
				{ type: QueryTypes.SELECT },
			);
			expect(rows).toEqual([
				{ id: 1, status: GangJoinRequestStatus.Cancelled },
				{ id: 2, status: GangJoinRequestStatus.Pending },
			]);
			await expect(database.query(
				`INSERT INTO "gang_join_requests" ("userId", "status") VALUES
					(:applicant, :pending)`,
				{ replacements: { applicant: "applicant", pending: GangJoinRequestStatus.Pending } },
			)).rejects.toThrow();

			await migrateGangRecruitment(database);
		}
		finally {
			sync.mockRestore();
			await database.close();
		}
	});
});
