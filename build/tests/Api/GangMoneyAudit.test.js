"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const resolvers_1 = require("#api/graphql/resolvers");
const Gang_1 = require("#core/models/Gang");
const AdminAuditLog_1 = require("#core/models/AdminAuditLog");
const AdminAuditLog_2 = require("#core/types/AdminAuditLog");
const Ids_1 = require("#core/types/Ids");
(0, vitest_1.describe)("gang money audit", () => {
    (0, vitest_1.afterEach)(() => vitest_1.vi.restoreAllMocks());
    (0, vitest_1.it)("records the acting admin and before/after money for a successful web update", async () => {
        const gang = {
            Money: 100,
            Update: vitest_1.vi.fn().mockResolvedValue(true),
        };
        vitest_1.vi.spyOn(Gang_1.Gang, "GetById").mockResolvedValue(gang);
        const record = vitest_1.vi.spyOn(AdminAuditLog_1.AdminAuditLog, "Record").mockResolvedValue();
        const requestInfo = { ipAddress: "203.0.113.10", userAgent: "Test browser" };
        const result = await resolvers_1.resolvers.Mutation.setGangMoney(null, {
            gangId: "42",
            amount: 250,
            mode: "SET",
        }, {
            user: {
                userId: "123",
                username: "Admin",
                avatar: null,
                role: "DEVELOPER",
                situationId: Ids_1.SituationId.Idling,
            },
            auditRequestInfo: requestInfo,
        });
        (0, vitest_1.expect)(result.success).toBe(true);
        (0, vitest_1.expect)(record).toHaveBeenCalledWith({
            userId: "123",
            username: "Admin",
            avatar: null,
            role: "DEVELOPER",
            situationId: Ids_1.SituationId.Idling,
            auditRequestInfo: requestInfo,
        }, AdminAuditLog_2.AdminAuditActionId.SetGangMoney, { gangId: 42 }, 100, 250, requestInfo);
    });
});
//# sourceMappingURL=GangMoneyAudit.test.js.map