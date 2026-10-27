"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const resolvers_1 = require("#api/graphql/resolvers");
const User_1 = require("#core/models/User");
vitest_1.vi.mock("#api/graphql/resolvers/helpers", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        mapUserDetail: vitest_1.vi.fn().mockResolvedValue({
            id: "target",
            isInHospital: true,
            hospitalTime: "2026-10-15T15:00:00.000Z",
            isWorking: true,
            jobEndsIn: "2026-10-15T16:00:00.000Z",
            isDead: false,
            specialCoin: 500,
            automaticGrenade: true,
            language: "en",
            voteCount: 10,
            createdAt: "2020-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
        }),
    };
});
const player = {
    userId: "viewer",
    username: "Player",
    avatar: null,
    role: "PLAYER",
    situationId: User_1.SituationId.Idling,
};
(0, vitest_1.afterEach)(() => vitest_1.vi.restoreAllMocks());
(0, vitest_1.describe)("public user situation", () => {
    (0, vitest_1.it)("exposes another player's current situation while keeping private fields hidden", async () => {
        vitest_1.vi.spyOn(User_1.User.prototype, "GetInfo").mockImplementation(async function () {
            return this;
        });
        const result = await resolvers_1.resolvers.Query.user(null, { id: "target" }, { user: player });
        (0, vitest_1.expect)(result).toMatchObject({
            isInHospital: true,
            hospitalTime: "2026-10-15T15:00:00.000Z",
            isWorking: true,
            jobEndsIn: "2026-10-15T16:00:00.000Z",
            specialCoin: null,
            automaticGrenade: null,
            language: "",
            voteCount: 0,
            createdAt: "",
            updatedAt: "",
        });
    });
});
//# sourceMappingURL=UserPublicSituation.test.js.map