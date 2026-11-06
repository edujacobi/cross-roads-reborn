"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const vitest_1 = require("vitest");
const GangJoinRequests_1 = require("#core/database/GangJoinRequests");
const GangRecruitment_1 = require("#core/database/migrations/GangRecruitment");
const GangRecruitment_2 = require("#core/types/GangRecruitment");
(0, vitest_1.describe)("Gang recruitment migration", () => {
    (0, vitest_1.it)("keeps the newest pending request and enforces one pending request per user", async () => {
        const database = new sequelize_1.Sequelize({ dialect: "sqlite", storage: ":memory:", logging: false });
        const queryInterface = database.getQueryInterface();
        const sync = vitest_1.vi.spyOn(GangJoinRequests_1.GangJoinRequests, "sync").mockResolvedValue(GangJoinRequests_1.GangJoinRequests.build({
            gangId: 1,
            userId: "applicant",
            status: GangRecruitment_2.GangJoinRequestStatus.Pending,
        }));
        try {
            await queryInterface.createTable("gangs", {
                id: { type: sequelize_1.DataTypes.INTEGER, primaryKey: true },
                recruitmentType: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            });
            await queryInterface.createTable("gang_join_requests", {
                id: { type: sequelize_1.DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
                userId: { type: sequelize_1.DataTypes.STRING(18), allowNull: false },
                status: { type: sequelize_1.DataTypes.STRING(20), allowNull: false },
            });
            await database.query(`INSERT INTO "gang_join_requests" ("id", "userId", "status") VALUES
					(1, :applicant, :pending),
					(2, :applicant, :pending)`, { replacements: { applicant: "applicant", pending: GangRecruitment_2.GangJoinRequestStatus.Pending } });
            await (0, GangRecruitment_1.migrateGangRecruitment)(database);
            const rows = await database.query(`SELECT "id", "status" FROM "gang_join_requests" ORDER BY "id"`, { type: sequelize_1.QueryTypes.SELECT });
            (0, vitest_1.expect)(rows).toEqual([
                { id: 1, status: GangRecruitment_2.GangJoinRequestStatus.Cancelled },
                { id: 2, status: GangRecruitment_2.GangJoinRequestStatus.Pending },
            ]);
            await (0, vitest_1.expect)(database.query(`INSERT INTO "gang_join_requests" ("userId", "status") VALUES
					(:applicant, :pending)`, { replacements: { applicant: "applicant", pending: GangRecruitment_2.GangJoinRequestStatus.Pending } })).rejects.toThrow();
            await (0, GangRecruitment_1.migrateGangRecruitment)(database);
        }
        finally {
            sync.mockRestore();
            await database.close();
        }
    });
});
//# sourceMappingURL=GangRecruitmentMigration.test.js.map