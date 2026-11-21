"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const User_1 = require("#core/models/User");
const Language_1 = require("#core/models/Language");
const Jobs_1 = require("#core/types/Jobs");
const Classes_1 = require("#core/types/Classes");
const Scavenge_1 = require("#core/models/Scavenge");
const Scavenge_2 = require("#core/types/Scavenge");
const Locations_1 = require("#core/types/Locations");
const TimedActionRepository_1 = require("#core/repositories/TimedActionRepository");
// --- Global Mocks ---
vitest_1.vi.mock("#core/database/Users", () => ({
    Users: {
        update: vitest_1.vi.fn(),
        findOne: vitest_1.vi.fn(),
        findByPk: vitest_1.vi.fn(() => Promise.resolve({ class: Classes_1.ClassId.Entrepreneur, nickname: "OtherUser" })),
        findAll: vitest_1.vi.fn(() => Promise.resolve([])),
    },
}));
(0, vitest_1.describe)("Scavenge", () => {
    let user;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        user = new User_1.User("123", Language_1.Language.English);
        user.Nickname = "TestUser";
        user.Class = Classes_1.ClassId.Entrepreneur;
        user.Money = 5_000;
    });
    (0, vitest_1.describe)("When testing if user can scavenge", () => {
        (0, vitest_1.it)("Should pass if user can scavenge", async () => {
            const scavenge = new Scavenge_1.Scavenge(user, Scavenge_2.ScavengeId.Dump);
            const result = await scavenge.CanScavenge();
            (0, vitest_1.expect)(result.canScavenge).toBe(true);
        });
        (0, vitest_1.it)("Should fail if in cooldown", async () => {
            const scavenge = new Scavenge_1.Scavenge(user, Scavenge_2.ScavengeId.Dump);
            user.Scavenge.Time = new Date(Date.now() + 3_600_000);
            const result = await scavenge.CanScavenge();
            (0, vitest_1.expect)(result.canScavenge).toBe(false);
            (0, vitest_1.expect)(result.reason).toBe(Scavenge_2.ScavengeFailureReason.UserScavengeTime);
        });
        (0, vitest_1.it)("Should fail if already scavenging", async () => {
            const scavenge = new Scavenge_1.Scavenge(user, Scavenge_2.ScavengeId.Dump);
            user.Scavenge.IsScavengingId = Scavenge_2.ScavengeId.Dump;
            const result = await scavenge.CanScavenge();
            (0, vitest_1.expect)(result.canScavenge).toBe(false);
            (0, vitest_1.expect)(result.reason).toBe(Scavenge_2.ScavengeFailureReason.UserScavenging);
        });
        (0, vitest_1.it)("Should fail if in job", async () => {
            const scavenge = new Scavenge_1.Scavenge(user, Scavenge_2.ScavengeId.Dump);
            user.Job.Id = Jobs_1.JobId.Butcher;
            const result = await scavenge.CanScavenge();
            (0, vitest_1.expect)(result.canScavenge).toBe(false);
            (0, vitest_1.expect)(result.reason).toBe(Scavenge_2.ScavengeFailureReason.UserWorking);
        });
        (0, vitest_1.it)("Should fail if in prison", async () => {
            const scavenge = new Scavenge_1.Scavenge(user, Scavenge_2.ScavengeId.Dump);
            user.Prison.Time = new Date(Date.now() + 3_600_000);
            const result = await scavenge.CanScavenge();
            (0, vitest_1.expect)(result.canScavenge).toBe(false);
            (0, vitest_1.expect)(result.reason).toBe(Scavenge_2.ScavengeFailureReason.UserPrison);
        });
        (0, vitest_1.it)("Should fail if in hospital", async () => {
            const scavenge = new Scavenge_1.Scavenge(user, Scavenge_2.ScavengeId.Dump);
            user.Hospital.Time = new Date(Date.now() + 3_600_000);
            const result = await scavenge.CanScavenge();
            (0, vitest_1.expect)(result.canScavenge).toBe(false);
            (0, vitest_1.expect)(result.reason).toBe(Scavenge_2.ScavengeFailureReason.UserHospital);
        });
        (0, vitest_1.it)("Should fail if in casino", async () => {
            const scavenge = new Scavenge_1.Scavenge(user, Scavenge_2.ScavengeId.Dump);
            user.Casino.IsInGame = true;
            const result = await scavenge.CanScavenge();
            (0, vitest_1.expect)(result.canScavenge).toBe(false);
            (0, vitest_1.expect)(result.reason).toBe(Scavenge_2.ScavengeFailureReason.UserCasino);
        });
        (0, vitest_1.it)("Should fail if beating user", async () => {
            const scavenge = new Scavenge_1.Scavenge(user, Scavenge_2.ScavengeId.Dump);
            user.BeatUp.IsBeatingId = "123";
            const result = await scavenge.CanScavenge();
            (0, vitest_1.expect)(result.canScavenge).toBe(false);
            (0, vitest_1.expect)(result.reason).toBe(Scavenge_2.ScavengeFailureReason.AttackerIsBeatingId);
        });
        (0, vitest_1.it)("Should fail if being beated", async () => {
            const scavenge = new Scavenge_1.Scavenge(user, Scavenge_2.ScavengeId.Dump);
            user.BeatUp.IsBeingBeatUpById = "123";
            const result = await scavenge.CanScavenge();
            (0, vitest_1.expect)(result.canScavenge).toBe(false);
            (0, vitest_1.expect)(result.reason).toBe(Scavenge_2.ScavengeFailureReason.AttackerIsBeingBeatedById);
        });
        (0, vitest_1.it)("Should fail if robbing user", async () => {
            const scavenge = new Scavenge_1.Scavenge(user, Scavenge_2.ScavengeId.Dump);
            user.Robbery.IsRobbingId = "123";
            const result = await scavenge.CanScavenge();
            (0, vitest_1.expect)(result.canScavenge).toBe(false);
            (0, vitest_1.expect)(result.reason).toBe(Scavenge_2.ScavengeFailureReason.AttackerIsRobbingId);
        });
        (0, vitest_1.it)("Should fail if being robbed", async () => {
            const scavenge = new Scavenge_1.Scavenge(user, Scavenge_2.ScavengeId.Dump);
            user.Robbery.IsBeingRobbedById = "123";
            const result = await scavenge.CanScavenge();
            (0, vitest_1.expect)(result.canScavenge).toBe(false);
            (0, vitest_1.expect)(result.reason).toBe(Scavenge_2.ScavengeFailureReason.AttackerIsBeingRobbedById);
        });
        (0, vitest_1.it)("Should fail if robbing location", async () => {
            const scavenge = new Scavenge_1.Scavenge(user, Scavenge_2.ScavengeId.Dump);
            user.Robbery.IsRobbingLocationId = Locations_1.LocationId.GroceryStore;
            const result = await scavenge.CanScavenge();
            (0, vitest_1.expect)(result.canScavenge).toBe(false);
            (0, vitest_1.expect)(result.reason).toBe(Scavenge_2.ScavengeFailureReason.AttackerIsRobbingLocationId);
        });
        (0, vitest_1.it)("Should fail if defending investment", async () => {
            const scavenge = new Scavenge_1.Scavenge(user, Scavenge_2.ScavengeId.Dump);
            user.Robbery.InvestmentIsDefending = true;
            const result = await scavenge.CanScavenge();
            (0, vitest_1.expect)(result.canScavenge).toBe(false);
            (0, vitest_1.expect)(result.reason).toBe(Scavenge_2.ScavengeFailureReason.UserDefendingInvestment);
        });
        (0, vitest_1.it)("Should fail if participating in gang action", async () => {
            const scavenge = new Scavenge_1.Scavenge(user, Scavenge_2.ScavengeId.Dump);
            user.Robbery.ParticipatingInGangAction = true;
            const result = await scavenge.CanScavenge();
            (0, vitest_1.expect)(result.canScavenge).toBe(false);
            (0, vitest_1.expect)(result.reason).toBe(Scavenge_2.ScavengeFailureReason.UserParticipatingInGangAction);
        });
        (0, vitest_1.it)("Should succeed", async () => {
            const scavenge = new Scavenge_1.Scavenge(user, Scavenge_2.ScavengeId.Dump);
            const result = await scavenge.CanScavenge();
            (0, vitest_1.expect)(result.canScavenge).toBe(true);
            (0, vitest_1.expect)(result.reason).toBeUndefined();
        });
    });
    (0, vitest_1.describe)("When scavenging", () => {
        (0, vitest_1.it)("Should scavenge", async () => {
            vitest_1.vi.spyOn(TimedActionRepository_1.TimedActionRepository, "Start").mockResolvedValue("00000000-0000-0000-0000-000000000001");
            const scavenge = new Scavenge_1.Scavenge(user, Scavenge_2.ScavengeId.Dump);
            await scavenge.StartScavenge();
            (0, vitest_1.expect)(user.Scavenge.IsScavengingId).toBe(Scavenge_2.ScavengeId.Dump);
        });
        (0, vitest_1.it)("Should replay another flow's committed result without resolving twice", async () => {
            const result = { completed: true, success: true, rewardDescription: "Cr$ 100" };
            vitest_1.vi.spyOn(user, "GetInfo").mockResolvedValue(user);
            const run = vitest_1.vi.spyOn(TimedActionRepository_1.TimedActionRepository, "Run").mockResolvedValue(result);
            const scavenge = new Scavenge_1.Scavenge(user, Scavenge_2.ScavengeId.Dump);
            await (0, vitest_1.expect)(scavenge.EndScavenge()).resolves.toEqual(result);
            (0, vitest_1.expect)(run).toHaveBeenCalledWith(user.Id, "scavenge", Scavenge_2.ScavengeId.Dump, vitest_1.expect.any(Function), undefined);
        });
    });
});
//# sourceMappingURL=Scavenge.test.js.map