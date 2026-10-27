"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const resolvers_1 = require("#api/graphql/resolvers");
const AdminAuditLog_1 = require("#core/models/AdminAuditLog");
const GangRepository_1 = require("#core/repositories/GangRepository");
const UserRepository_1 = require("#core/repositories/UserRepository");
const AdminAuditLog_2 = require("#core/types/AdminAuditLog");
const Ids_1 = require("#core/types/Ids");
const { mockClient } = vitest_1.vi.hoisted(() => ({
    mockClient: {
        guilds: {
            cache: {
                get: vitest_1.vi.fn(() => undefined),
            },
            fetch: vitest_1.vi.fn().mockResolvedValue({
                members: {
                    fetch: vitest_1.vi.fn(async ({ user }) => ({
                        displayName: `Current ${user}`,
                        displayAvatarURL: () => `https://cdn.example/${user}.png`,
                    })),
                },
            }),
        },
        users: {
            fetch: vitest_1.vi.fn(async (userId) => ({
                globalName: `Global ${userId}`,
                username: userId,
                displayAvatarURL: () => `https://cdn.example/${userId}.png`,
            })),
        },
    },
}));
vitest_1.vi.mock("#bot/client", () => ({
    getClient: () => mockClient,
}));
(0, vitest_1.describe)("Admin audit log resolver", () => {
    (0, vitest_1.afterEach)(() => vitest_1.vi.restoreAllMocks());
    (0, vitest_1.it)("resolves current admin and target names from their IDs", async () => {
        vitest_1.vi.stubEnv("SERVER_ID", "guild123");
        vitest_1.vi.spyOn(AdminAuditLog_1.AdminAuditLog, "GetPage").mockResolvedValue({
            total: 1,
            entries: [{
                    id: 1,
                    adminId: "111",
                    adminIpAddress: "203.0.113.5",
                    adminDeviceType: "Desktop",
                    adminOperatingSystem: "Windows",
                    adminBrowser: "Edge",
                    actionId: AdminAuditLog_2.AdminAuditActionId.SetMoney,
                    targetUserId: "222",
                    targetSettingId: null,
                    targetGangId: null,
                    previousValue: "1",
                    newValue: "2",
                    createdAt: new Date("2026-01-01T00:00:00.000Z"),
                }],
        });
        vitest_1.vi.spyOn(UserRepository_1.UserRepository, "FindById").mockResolvedValue({
            id: "222",
            nickname: "Current game nickname",
        });
        const result = await resolvers_1.resolvers.Query.adminAuditLogs(null, {}, {
            user: {
                userId: "111",
                username: "Old name",
                avatar: null,
                role: "DEVELOPER",
                situationId: Ids_1.SituationId.Idling,
            },
        });
        (0, vitest_1.expect)(result.entries[0]).toMatchObject({
            adminName: "Current 111",
            adminAvatarUrl: "https://cdn.example/111.png",
            targetUserName: "Current game nickname",
            targetUserAvatarUrl: "https://cdn.example/222.png",
            actionId: AdminAuditLog_2.AdminAuditActionId.SetMoney,
            targetSettingId: null,
        });
        (0, vitest_1.expect)(result.entries[0]).not.toHaveProperty("adminName", "Old name");
    });
    (0, vitest_1.it)("returns setting target IDs without requesting a game user", async () => {
        vitest_1.vi.spyOn(AdminAuditLog_1.AdminAuditLog, "GetPage").mockResolvedValue({
            total: 1,
            entries: [{
                    id: 2,
                    adminId: "111",
                    adminIpAddress: null,
                    adminDeviceType: null,
                    adminOperatingSystem: null,
                    adminBrowser: null,
                    actionId: AdminAuditLog_2.AdminAuditActionId.SetMainHeistAllowed,
                    targetUserId: null,
                    targetSettingId: AdminAuditLog_2.AdminAuditSettingId.MainHeist,
                    targetGangId: null,
                    previousValue: "true",
                    newValue: "false",
                    createdAt: new Date("2026-01-01T00:00:00.000Z"),
                }],
        });
        const findUser = vitest_1.vi.spyOn(UserRepository_1.UserRepository, "FindById");
        const result = await resolvers_1.resolvers.Query.adminAuditLogs(null, {}, {
            user: {
                userId: "111",
                username: "Old name",
                avatar: null,
                role: "DEVELOPER",
                situationId: Ids_1.SituationId.Idling,
            },
        });
        (0, vitest_1.expect)(result.entries[0]).toMatchObject({
            targetUserName: null,
            targetSettingId: AdminAuditLog_2.AdminAuditSettingId.MainHeist,
        });
        (0, vitest_1.expect)(findUser).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)("resolves gang target names from their IDs", async () => {
        vitest_1.vi.spyOn(AdminAuditLog_1.AdminAuditLog, "GetPage").mockResolvedValue({
            total: 1,
            entries: [{
                    id: 4,
                    adminId: "111",
                    adminIpAddress: null,
                    adminDeviceType: null,
                    adminOperatingSystem: null,
                    adminBrowser: null,
                    actionId: AdminAuditLog_2.AdminAuditActionId.SetGangMoney,
                    targetUserId: null,
                    targetSettingId: null,
                    targetGangId: 42,
                    previousValue: "100",
                    newValue: "250",
                    createdAt: new Date("2026-01-01T00:00:00.000Z"),
                }],
        });
        const findGang = vitest_1.vi.spyOn(GangRepository_1.GangRepository, "FindById").mockResolvedValue({ id: 42, name: "Test gang" });
        const result = await resolvers_1.resolvers.Query.adminAuditLogs(null, {}, {
            user: {
                userId: "111",
                username: "Developer",
                avatar: null,
                role: "DEVELOPER",
                situationId: Ids_1.SituationId.Idling,
            },
        });
        (0, vitest_1.expect)(findGang).toHaveBeenCalledWith(42, ["id", "name"]);
        (0, vitest_1.expect)(result.entries[0]).toMatchObject({
            targetGangId: 42,
            targetGangName: "Test gang",
        });
    });
    (0, vitest_1.it)("passes the selected action ID to the paginated query", async () => {
        const getPage = vitest_1.vi.spyOn(AdminAuditLog_1.AdminAuditLog, "GetPage").mockResolvedValue({ entries: [], total: 0 });
        await resolvers_1.resolvers.Query.adminAuditLogs(null, { actionId: AdminAuditLog_2.AdminAuditActionId.SetMoney }, {
            user: {
                userId: "111",
                username: "Developer",
                avatar: null,
                role: "DEVELOPER",
                situationId: Ids_1.SituationId.Idling,
            },
        });
        (0, vitest_1.expect)(getPage).toHaveBeenCalledWith(25, 0, AdminAuditLog_2.AdminAuditActionId.SetMoney);
    });
    (0, vitest_1.it)("allows moderators to read audit logs without request metadata", async () => {
        vitest_1.vi.spyOn(AdminAuditLog_1.AdminAuditLog, "GetPage").mockResolvedValue({
            total: 1,
            entries: [{
                    id: 3,
                    adminId: "111",
                    adminIpAddress: "203.0.113.5",
                    adminDeviceType: "Desktop",
                    adminOperatingSystem: "Windows",
                    adminBrowser: "Edge",
                    actionId: AdminAuditLog_2.AdminAuditActionId.SetMoney,
                    targetUserId: null,
                    targetSettingId: null,
                    targetGangId: null,
                    previousValue: "1",
                    newValue: "2",
                    createdAt: new Date("2026-01-01T00:00:00.000Z"),
                }],
        });
        const result = await resolvers_1.resolvers.Query.adminAuditLogs(null, {}, {
            user: {
                userId: "333",
                username: "Moderator",
                avatar: null,
                role: "MODERATOR",
                situationId: Ids_1.SituationId.Idling,
            },
        });
        (0, vitest_1.expect)(result.entries[0]).toMatchObject({
            adminIpAddress: null,
            adminDeviceType: null,
            adminOperatingSystem: null,
            adminBrowser: null,
        });
    });
    (0, vitest_1.afterEach)(() => vitest_1.vi.unstubAllEnvs());
});
//# sourceMappingURL=AdminAuditResolver.test.js.map