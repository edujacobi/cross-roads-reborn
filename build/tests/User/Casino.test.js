"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const User_1 = require("#core/models/User");
const Language_1 = require("#core/models/Language");
const Jobs_1 = require("#core/types/Jobs");
const Classes_1 = require("#core/types/Classes");
const Casino_1 = require("#core/models/Casino");
const Scavenge_1 = require("#core/types/Scavenge");
const Locations_1 = require("#core/types/Locations");
// --- Global Mocks ---
vitest_1.vi.mock("#core/database/Users", () => ({
    Users: {
        update: vitest_1.vi.fn(),
        findOne: vitest_1.vi.fn(),
        findByPk: vitest_1.vi.fn(() => Promise.resolve({ class: Classes_1.ClassId.Entrepreneur, nickname: "OtherUser" })),
        findAll: vitest_1.vi.fn(() => Promise.resolve([])),
    },
}));
(0, vitest_1.describe)("Casino", () => {
    let user;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        user = new User_1.User("123", Language_1.Language.English);
        user.Nickname = "TestUser";
        user.Class = Classes_1.ClassId.Entrepreneur;
        user.Money = 5_000;
    });
    (0, vitest_1.describe)("When testing if user can play game", () => {
        const BET_VALUE = 100;
        (0, vitest_1.it)("Should fail if user has no money", async () => {
            user.Money = 0;
            const result = await Casino_1.Casino.CanUserPlayGame(user, BET_VALUE);
            (0, vitest_1.expect)(result.canPlay).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("money");
        });
        (0, vitest_1.it)("Should use the requested language for eligibility messages", async () => {
            user.Money = 0;
            const result = await Casino_1.Casino.CanUserPlayGame(user, BET_VALUE, Language_1.Language.Portuguese);
            (0, vitest_1.expect)(result.message).toContain("Você não possui dinheiro suficiente para apostar");
        });
        (0, vitest_1.it)("Should fail if user is scavenging", async () => {
            user.Scavenge.IsScavengingId = Scavenge_1.ScavengeId.AlienShip;
            const result = await Casino_1.Casino.CanUserPlayGame(user, BET_VALUE);
            (0, vitest_1.expect)(result.canPlay).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("scavenging");
        });
        (0, vitest_1.it)("Should fail if user is working", async () => {
            user.Job.Id = Jobs_1.JobId.BlackMarket;
            const result = await Casino_1.Casino.CanUserPlayGame(user, BET_VALUE);
            (0, vitest_1.expect)(result.canPlay).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("working");
        });
        (0, vitest_1.it)("Should fail if user is in prison", async () => {
            user.Prison.Time = new Date(Date.now() + 3_600_000);
            const result = await Casino_1.Casino.CanUserPlayGame(user, BET_VALUE);
            (0, vitest_1.expect)(result.canPlay).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("prison");
        });
        (0, vitest_1.it)("Should fail if user is in hospital", async () => {
            user.Hospital.Time = new Date(Date.now() + 3_600_000);
            const result = await Casino_1.Casino.CanUserPlayGame(user, BET_VALUE);
            (0, vitest_1.expect)(result.canPlay).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("hospital");
        });
        (0, vitest_1.it)("Should fail if user in another casino game", async () => {
            user.Casino.IsInGame = true;
            const result = await Casino_1.Casino.CanUserPlayGame(user, BET_VALUE);
            (0, vitest_1.expect)(result.canPlay).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("game");
        });
        // in order: isBeatingId, isBeingBeatUpById, isRobbingId, isBeingRobbedById, isRobbingLocationId
        (0, vitest_1.it)("Should fail if user is beating up someone", async () => {
            user.BeatUp.IsBeatingId = "123";
            const result = await Casino_1.Casino.CanUserPlayGame(user, BET_VALUE);
            (0, vitest_1.expect)(result.canPlay).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("beating");
        });
        (0, vitest_1.it)("Should fail if user is being beat up", async () => {
            user.BeatUp.IsBeingBeatUpById = "123";
            const result = await Casino_1.Casino.CanUserPlayGame(user, BET_VALUE);
            (0, vitest_1.expect)(result.canPlay).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("beated");
        });
        (0, vitest_1.it)("Should fail if user is robbing someone", async () => {
            user.Robbery.IsRobbingId = "123";
            const result = await Casino_1.Casino.CanUserPlayGame(user, BET_VALUE);
            (0, vitest_1.expect)(result.canPlay).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("robbing");
        });
        (0, vitest_1.it)("Should fail if user is being robbed", async () => {
            user.Robbery.IsBeingRobbedById = "123";
            const result = await Casino_1.Casino.CanUserPlayGame(user, BET_VALUE);
            (0, vitest_1.expect)(result.canPlay).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("robbed");
        });
        (0, vitest_1.it)("Should fail if user is robbing location", async () => {
            user.Robbery.IsRobbingLocationId = Locations_1.LocationId.ArmyDepot;
            const result = await Casino_1.Casino.CanUserPlayGame(user, BET_VALUE);
            (0, vitest_1.expect)(result.canPlay).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("robbing");
        });
        (0, vitest_1.it)("Should fail if user is defending investment", async () => {
            user.Robbery.InvestmentIsDefending = true;
            const result = await Casino_1.Casino.CanUserPlayGame(user, BET_VALUE);
            (0, vitest_1.expect)(result.canPlay).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("investment");
        });
        (0, vitest_1.it)("Should fail if user is participating in gang action", async () => {
            user.Robbery.ParticipatingInGangAction = true;
            const result = await Casino_1.Casino.CanUserPlayGame(user, BET_VALUE);
            (0, vitest_1.expect)(result.canPlay).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("gang action");
        });
        (0, vitest_1.it)("Should succeed", async () => {
            const result = await Casino_1.Casino.CanUserPlayGame(user, BET_VALUE);
            (0, vitest_1.expect)(result.canPlay).toBe(true);
        });
    });
    (0, vitest_1.describe)("When finishing user game with loss", () => {
        (0, vitest_1.it)("Should deduct money and update stats when using FinishUserGameWithLoss", async () => {
            user.Money = 5_000;
            user.Casino.IsInGame = true;
            user.Casino.LoseCount = 10;
            user.Casino.LoseSum = 50_000;
            await Casino_1.Casino.FinishUserGameWithLoss(user, 1_000);
            (0, vitest_1.expect)(user.Money).toBe(4_000);
            (0, vitest_1.expect)(user.Casino.IsInGame).toBe(false);
            (0, vitest_1.expect)(user.Casino.LoseCount).toBe(11);
            (0, vitest_1.expect)(user.Casino.LoseSum).toBe(51_000);
        });
        (0, vitest_1.it)("Should NOT deduct money but still update stats when using FinishUserGameWithLossNoSubtraction", async () => {
            user.Money = 5_000;
            user.Casino.IsInGame = true;
            user.Casino.LoseCount = 10;
            user.Casino.LoseSum = 50_000;
            await Casino_1.Casino.FinishUserGameWithLossNoSubtraction(user, 1_000);
            (0, vitest_1.expect)(user.Money).toBe(5_000);
            (0, vitest_1.expect)(user.Casino.IsInGame).toBe(false);
            (0, vitest_1.expect)(user.Casino.LoseCount).toBe(11);
            (0, vitest_1.expect)(user.Casino.LoseSum).toBe(51_000);
        });
    });
});
//# sourceMappingURL=Casino.test.js.map