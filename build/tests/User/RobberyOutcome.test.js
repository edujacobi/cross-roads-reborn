"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
const vitest_1 = require("vitest");
const User_1 = require("#core/models/User");
const Language_1 = require("#core/models/Language");
const UserRobberyStrategy_1 = require("#core/models/strategies/robbery/UserRobberyStrategy");
const Classes_1 = require("#core/types/Classes");
const Event_1 = require("#core/models/Event");
const Notification_1 = require("#core/models/Notification");
const RobHistoryRepository_1 = require("#core/repositories/RobHistoryRepository");
// Mock Database & External APIs
vitest_1.vi.mock("#core/database/Users", () => ({
    Users: {
        update: vitest_1.vi.fn(),
        findOne: vitest_1.vi.fn(),
        findByPk: vitest_1.vi.fn(() => Promise.resolve({ class: Classes_1.ClassId.Thief, nickname: "OtherUser" })),
    },
}));
(0, vitest_1.describe)("Robbery Outcome Logic", () => {
    let attacker;
    let defender;
    let robbery;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        // Spy on Event, Notification, and histories static methods to bypass database
        vitest_1.vi.spyOn(Event_1.Event, "GetActiveFromType").mockResolvedValue(1);
        vitest_1.vi.spyOn(Event_1.Event, "GetActiveBonusFromType").mockResolvedValue(0);
        vitest_1.vi.spyOn(Notification_1.Notification, "RobAgain").mockResolvedValue(undefined);
        vitest_1.vi.spyOn(Notification_1.Notification, "Free").mockResolvedValue(undefined);
        vitest_1.vi.spyOn(Notification_1.Notification, "Hospital").mockResolvedValue(undefined);
        vitest_1.vi.spyOn(RobHistoryRepository_1.RobHistoryRepository, "CreateUserRobberyHistory").mockResolvedValue(undefined);
        vitest_1.vi.spyOn(RobHistoryRepository_1.RobHistoryRepository, "CreateLocationHistory").mockResolvedValue(undefined);
        attacker = new User_1.User("111", Language_1.Language.English);
        attacker.Nickname = "Attacker";
        attacker.Class = Classes_1.ClassId.Thief; // Thief has the 1.15 positive modifier
        attacker.Money = 1_000;
        attacker.Attributes = { Attack: 10, Defense: 5, MoneyAttack: 20, MoneyDefense: 0 };
        defender = new User_1.User("222", Language_1.Language.English);
        defender.Nickname = "Defender";
        defender.Class = Classes_1.ClassId.Entrepreneur;
        defender.Money = 2_000;
        defender.Attributes = { Attack: 5, Defense: 10, MoneyAttack: 5, MoneyDefense: 0 }; // MoneyDefense: 0 prevents reduction
        robbery = new UserRobberyStrategy_1.UserRobberyStrategy(attacker, defender);
        robbery.BeatUpChance = 0; // Deterministic behavior
        // Spy on GetInfo to prevent DB loading
        vitest_1.vi.spyOn(attacker, "GetInfo").mockImplementation(async function () {
            return this;
        });
        vitest_1.vi.spyOn(defender, "GetInfo").mockImplementation(async function () {
            return this;
        });
        // Spy on GetAttributes to prevent resetting attributes to 0
        vitest_1.vi.spyOn(attacker, "GetAttributes").mockResolvedValue(undefined);
        vitest_1.vi.spyOn(defender, "GetAttributes").mockResolvedValue(undefined);
        vitest_1.vi.spyOn(attacker, "GetItemSkin").mockReturnValue("🔪");
    });
    (0, vitest_1.it)("should calculate correct robbery outcome when successful", async () => {
        // Mock Math.random to guarantee success (Chance = 0, which is < Attack = 10)
        const randomSpy = vitest_1.vi.spyOn(Math, "random").mockReturnValue(0);
        await robbery.LockStates(false);
        const outcome = await robbery.Resolve("nothing");
        (0, vitest_1.expect)(outcome.success).toBe(true);
        // 20% of defender's 2000 money = 400.
        // Class modifier for Thief is 1.15
        // 400 * 1.15 = 460, but due to floating-point precision (400 * 1.15 = 459.99999999999994)
        // Math.floor truncates this to 459.
        (0, vitest_1.expect)(outcome.moneyRobbed).toBe(459);
        (0, vitest_1.expect)(attacker.Money).toBe(1459);
        (0, vitest_1.expect)(defender.Money).toBe(1541);
        (0, vitest_1.expect)(attacker.Robbery.SuccessCount).toBe(1);
        (0, vitest_1.expect)(defender.Robbery.BeingRobbedCount).toBe(1);
        randomSpy.mockRestore();
    });
    (0, vitest_1.it)("should apply prison time to attacker when unsuccessful", async () => {
        // Mock Math.random to guarantee failure (Chance = 99, which is >= Attack = 10)
        const randomSpy = vitest_1.vi.spyOn(Math, "random").mockReturnValue(0.99);
        await robbery.LockStates(false);
        const outcome = await robbery.Resolve("nothing");
        (0, vitest_1.expect)(outcome.success).toBe(false);
        (0, vitest_1.expect)(attacker.Prison.Count).toBe(1);
        (0, vitest_1.expect)(attacker.Robbery.FailureCount).toBe(1);
        (0, vitest_1.expect)(attacker.Prison.Time.getTime()).toBeGreaterThan(Date.now());
        randomSpy.mockRestore();
    });
    (0, vitest_1.it)("should apply +5 defense and 100% beat up chance when defender reacts", async () => {
        // Mock Math.random to guarantee success (5 < 8.5) and beat up (0.05 < 1)
        const randomSpy = vitest_1.vi.spyOn(Math, "random").mockReturnValue(0.05);
        await robbery.LockStates(false);
        const originalDefense = defender.Attributes.Defense;
        const outcome = await robbery.Resolve("react");
        (0, vitest_1.expect)(defender.Attributes.Defense).toBe(originalDefense + 5);
        (0, vitest_1.expect)(robbery.BeatUpChance).toBe(1);
        (0, vitest_1.expect)(outcome.success).toBe(true);
        (0, vitest_1.expect)(outcome.willBeBeatenUp).toBe(true);
        randomSpy.mockRestore();
    });
    (0, vitest_1.it)("should decrease defender defense and increase attacker prison time when defender calls police", async () => {
        // Mock Math.random to guarantee failure
        const randomSpy = vitest_1.vi.spyOn(Math, "random").mockReturnValue(0.99);
        await robbery.LockStates(false);
        const originalDefense = defender.Attributes.Defense;
        const originalPrisonTime = robbery.AttackerTimeInPrison;
        const additionalPoliceTime = robbery.AttackerAditionalTimeCallPolice;
        const outcome = await robbery.Resolve("police");
        (0, vitest_1.expect)(defender.Attributes.Defense).toBe(originalDefense - 5);
        (0, vitest_1.expect)(robbery.AttackerTimeInPrison).toBe(originalPrisonTime + additionalPoliceTime);
        (0, vitest_1.expect)(outcome.success).toBe(false);
        // Thief class applies a 1.15 multiplier in Prison.Arrest
        const thiefMultiplier = attacker.Class === Classes_1.ClassId.Thief ? 1.15 : 1.0;
        const expectedPrisonTime = new Date(Date.now() + Math.floor((originalPrisonTime + additionalPoliceTime) * thiefMultiplier) * 60000);
        // Check that the time is roughly correct (allow some ms difference)
        (0, vitest_1.expect)(attacker.Prison.Time.getTime()).toBeCloseTo(expectedPrisonTime.getTime(), -4);
        randomSpy.mockRestore();
    });
});
//# sourceMappingURL=RobberyOutcome.test.js.map