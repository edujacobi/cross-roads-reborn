"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
const vitest_1 = require("vitest");
const User_1 = require("#core/models/User");
const Language_1 = require("#core/models/Language");
const BeatUp_1 = require("#core/models/BeatUp");
const Classes_1 = require("#core/types/Classes");
const Event_1 = require("#core/models/Event");
const Notification_1 = require("#core/models/Notification");
const RobHistoryRepository_1 = require("#core/repositories/RobHistoryRepository");
// Mock Database & External APIs
vitest_1.vi.mock("#core/database/Users", () => ({
    Users: {
        update: vitest_1.vi.fn(),
        findOne: vitest_1.vi.fn(),
        findByPk: vitest_1.vi.fn(() => Promise.resolve({ class: Classes_1.ClassId.Entrepreneur, nickname: "OtherUser" })),
    },
}));
(0, vitest_1.describe)("BeatUp Outcome Logic", () => {
    let attacker;
    let defender;
    let beatUp;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        // Spy on static methods
        vitest_1.vi.spyOn(Event_1.Event, "GetActiveFromType").mockResolvedValue(1);
        vitest_1.vi.spyOn(Event_1.Event, "GetActiveBonusFromType").mockResolvedValue(0);
        vitest_1.vi.spyOn(Notification_1.Notification, "BeatAgain").mockResolvedValue(undefined);
        vitest_1.vi.spyOn(Notification_1.Notification, "Hospital").mockResolvedValue(undefined);
        vitest_1.vi.spyOn(RobHistoryRepository_1.RobHistoryRepository, "CreateUserBeatUpHistory").mockResolvedValue(undefined);
        attacker = new User_1.User("111", Language_1.Language.English);
        attacker.Nickname = "Attacker";
        attacker.Class = Classes_1.ClassId.Entrepreneur;
        attacker.Money = 1_000;
        attacker.Attributes = { Attack: 20, Defense: 5, MoneyAttack: 10, MoneyDefense: 5 };
        defender = new User_1.User("222", Language_1.Language.English);
        defender.Nickname = "Defender";
        defender.Class = Classes_1.ClassId.Entrepreneur;
        defender.Money = 2_000;
        defender.Attributes = { Attack: 10, Defense: 10, MoneyAttack: 5, MoneyDefense: 10 };
        // Spy on GetAttributes BEFORE calling BeatUp constructor
        vitest_1.vi.spyOn(attacker, "GetAttributes").mockResolvedValue(undefined);
        vitest_1.vi.spyOn(defender, "GetAttributes").mockResolvedValue(undefined);
        vitest_1.vi.spyOn(attacker, "GetItemSkin").mockReturnValue("🔪");
        beatUp = new BeatUp_1.BeatUp(attacker, defender);
        // Spy on domain loading to bypass database
        vitest_1.vi.spyOn(attacker, "GetInfo").mockImplementation(async function () {
            return this;
        });
        vitest_1.vi.spyOn(defender, "GetInfo").mockImplementation(async function () {
            return this;
        });
    });
    (0, vitest_1.it)("should calculate correct beatup outcome when successful", async () => {
        // Mock Math.random to return 0.9 on first call (Attacker: 0.9 * 20 = 18) and 0.1 on second call (Defender: 0.1 * 10 = 1) -> Success = true
        const randomSpy = vitest_1.vi.spyOn(Math, "random")
            .mockReturnValueOnce(0.9)
            .mockReturnValueOnce(0.1);
        await beatUp.LockStates(false);
        const outcome = await beatUp.Resolve("nothing");
        (0, vitest_1.expect)(outcome.success).toBe(true);
        (0, vitest_1.expect)(attacker.BeatUp.SuccessCount).toBe(1);
        (0, vitest_1.expect)(defender.BeatUp.BeatedUpCount).toBe(1);
        (0, vitest_1.expect)(defender.Hospital.Count).toBe(1);
        (0, vitest_1.expect)(defender.Hospital.Time.getTime()).toBeGreaterThan(Date.now());
        (0, vitest_1.expect)(attacker.Wanted.Count).toBe(1);
        (0, vitest_1.expect)(attacker.Wanted.Time.getTime()).toBeGreaterThan(Date.now());
        randomSpy.mockRestore();
    });
    (0, vitest_1.it)("should hospitalize attacker when unsuccessful", async () => {
        // Mock Math.random to return 0.1 on first call (Attacker: 0.1 * 20 = 2) and 0.9 on second call (Defender: 0.9 * 10 = 9) -> Success = false
        const randomSpy = vitest_1.vi.spyOn(Math, "random")
            .mockReturnValueOnce(0.1)
            .mockReturnValueOnce(0.9);
        await beatUp.LockStates(false);
        const outcome = await beatUp.Resolve("nothing");
        (0, vitest_1.expect)(outcome.success).toBe(false);
        (0, vitest_1.expect)(attacker.BeatUp.FailureCount).toBe(1);
        (0, vitest_1.expect)(attacker.BeatUp.BeatedUpCount).toBe(1);
        (0, vitest_1.expect)(defender.BeatUp.SuccessCount).toBe(1);
        (0, vitest_1.expect)(attacker.Hospital.Count).toBe(1);
        (0, vitest_1.expect)(attacker.Hospital.Time.getTime()).toBeGreaterThan(Date.now());
        randomSpy.mockRestore();
    });
    (0, vitest_1.it)("should increase defender attack and hospital time when defender fights", async () => {
        // Mock Math.random for success = false
        const randomSpy = vitest_1.vi.spyOn(Math, "random")
            .mockReturnValueOnce(0.1) // Attacker chance low
            .mockReturnValueOnce(0.9); // Defender chance high
        await beatUp.LockStates(false);
        const originalAttack = defender.Attributes.Attack;
        const originalBaseTime = beatUp.TimeInHospital.Base;
        const additionalTime = beatUp.TimeInHospital.Aditional;
        const outcome = await beatUp.Resolve("fight");
        (0, vitest_1.expect)(defender.Attributes.Attack).toBe(originalAttack + 5);
        (0, vitest_1.expect)(beatUp.TimeInHospital.Base).toBe(originalBaseTime + additionalTime);
        (0, vitest_1.expect)(outcome.success).toBe(false);
        randomSpy.mockRestore();
    });
    (0, vitest_1.it)("should decrease defender attack and hospital time when defender runs", async () => {
        // Mock Math.random for success = false
        const randomSpy = vitest_1.vi.spyOn(Math, "random")
            .mockReturnValueOnce(0.1)
            .mockReturnValueOnce(0.9);
        await beatUp.LockStates(false);
        const originalAttack = defender.Attributes.Attack;
        const originalBaseTime = beatUp.TimeInHospital.Base;
        const additionalTime = beatUp.TimeInHospital.Aditional;
        const outcome = await beatUp.Resolve("run");
        (0, vitest_1.expect)(defender.Attributes.Attack).toBe(originalAttack - 5);
        (0, vitest_1.expect)(beatUp.TimeInHospital.Base).toBe(originalBaseTime - additionalTime);
        (0, vitest_1.expect)(outcome.success).toBe(false);
        randomSpy.mockRestore();
    });
});
//# sourceMappingURL=BeatUpOutcome.test.js.map