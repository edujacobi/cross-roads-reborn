"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
const vitest_1 = require("vitest");
const User_1 = require("#core/models/User");
const Language_1 = require("#core/models/Language");
const BeatUp_1 = require("#core/models/BeatUp");
const Classes_1 = require("#core/types/Classes");
const Ids_1 = require("#core/types/Ids");
const Items_1 = require("#core/types/Items");
// --- Global Mocks ---
const { mockUpdate } = vitest_1.vi.hoisted(() => ({
    mockUpdate: vitest_1.vi.fn(),
}));
vitest_1.vi.mock("#core/database/Users", () => ({
    Users: {
        update: mockUpdate,
        findOne: vitest_1.vi.fn(),
        findByPk: vitest_1.vi.fn(() => Promise.resolve({ class: Classes_1.ClassId.Entrepreneur, nickname: "OtherUser" })),
    },
}));
(0, vitest_1.describe)("BeatUp — LockStates & ReleaseLocks", () => {
    let attacker;
    let defender;
    let beatUp;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        attacker = new User_1.User("111", Language_1.Language.English);
        attacker.Nickname = "Attacker";
        attacker.Class = Classes_1.ClassId.Entrepreneur;
        attacker.Money = 1_000;
        attacker.Items = [Items_1.ItemList[Ids_1.ItemId.Pistol]];
        defender = new User_1.User("222", Language_1.Language.English);
        defender.Nickname = "Defender";
        defender.Class = Classes_1.ClassId.Entrepreneur;
        defender.Money = 2_000;
        defender.Items = [Items_1.ItemList[Ids_1.ItemId.Pistol]];
        // Prevent fire-and-forget GetAttributes in constructor from interfering
        vitest_1.vi.spyOn(attacker, "GetAttributes").mockResolvedValue(undefined);
        vitest_1.vi.spyOn(defender, "GetAttributes").mockResolvedValue(undefined);
        vitest_1.vi.spyOn(attacker, "GetItemSkin").mockReturnValue("🔪");
        // Manually set attributes so logic is deterministic
        attacker.Attributes = { Attack: 20, Defense: 5, MoneyAttack: 10, MoneyDefense: 5 };
        defender.Attributes = { Attack: 10, Defense: 10, MoneyAttack: 5, MoneyDefense: 5 };
        beatUp = new BeatUp_1.BeatUp(attacker, defender);
    });
    // -------------------------------------------------------------------------
    (0, vitest_1.describe)("LockStates", () => {
        (0, vitest_1.it)("should set IsBeatingId on attacker and IsBeingBeatUpById on defender", async () => {
            await beatUp.LockStates(false);
            (0, vitest_1.expect)(attacker.BeatUp.IsBeatingId).toBe(defender.Id);
            (0, vitest_1.expect)(defender.BeatUp.IsBeingBeatUpById).toBe(attacker.Id);
        });
        (0, vitest_1.it)("should write lock fields to the database for both attacker and defender", async () => {
            await beatUp.LockStates(false);
            (0, vitest_1.expect)(mockUpdate).toHaveBeenCalledTimes(2);
            const attackerCallArgs = mockUpdate.mock.calls.find((call) => call[0].beatingUserId === defender.Id);
            (0, vitest_1.expect)(attackerCallArgs).toBeDefined();
            const defenderCallArgs = mockUpdate.mock.calls.find((call) => call[0].beingBeatUpByUserId === attacker.Id);
            (0, vitest_1.expect)(defenderCallArgs).toBeDefined();
        });
        (0, vitest_1.it)("should calculate TimeInHospital.Base based on defender ATK", async () => {
            await beatUp.LockStates(false);
            const expectedBase = 45 + defender.Attributes.Attack;
            (0, vitest_1.expect)(beatUp.TimeInHospital.Base).toBe(expectedBase);
        });
        (0, vitest_1.it)("should calculate TimeInHospital.Aditional based on defender ATK", async () => {
            await beatUp.LockStates(false);
            const expectedAdditional = 5 + defender.Attributes.Attack;
            (0, vitest_1.expect)(beatUp.TimeInHospital.Aditional).toBe(expectedAdditional);
        });
        (0, vitest_1.it)("should return correct BeatUpInitData shape", async () => {
            const data = await beatUp.LockStates(false);
            (0, vitest_1.expect)(data).toHaveProperty("cannotRun");
            (0, vitest_1.expect)(data).toHaveProperty("usedGunSkin");
            (0, vitest_1.expect)(data).toHaveProperty("usedGunName");
            (0, vitest_1.expect)(data).toHaveProperty("usedGrenade");
            (0, vitest_1.expect)(data).toHaveProperty("timeInHospitalBase");
            (0, vitest_1.expect)(data).toHaveProperty("timeInHospitalAditional");
        });
        (0, vitest_1.it)("should set cannotRun when defender ATK is below 5", async () => {
            defender.Attributes.Attack = 4;
            const data = await beatUp.LockStates(false);
            (0, vitest_1.expect)(data.cannotRun).toBe(true);
        });
        (0, vitest_1.it)("should NOT set cannotRun when defender ATK is 5 or above", async () => {
            defender.Attributes.Attack = 5;
            const data = await beatUp.LockStates(false);
            (0, vitest_1.expect)(data.cannotRun).toBe(false);
        });
        (0, vitest_1.it)("should boost attacker ATK by 1.35x when defender has 0 or less defense", async () => {
            const originalAttack = attacker.Attributes.Attack;
            defender.Attributes.Defense = 0;
            await beatUp.LockStates(false);
            (0, vitest_1.expect)(attacker.Attributes.Attack).toBeCloseTo(originalAttack * 1.35);
        });
        (0, vitest_1.it)("should NOT boost attacker ATK when defender has positive defense", async () => {
            const originalAttack = attacker.Attributes.Attack;
            defender.Attributes.Defense = 10;
            await beatUp.LockStates(false);
            (0, vitest_1.expect)(attacker.Attributes.Attack).toBe(originalAttack);
        });
        (0, vitest_1.it)("should consume a grenade and push ItemId.Grenade to UsedConsumables when useGrenade is true", async () => {
            vitest_1.vi.spyOn(attacker, "ConsumeItem").mockResolvedValue(true);
            const data = await beatUp.LockStates(true);
            (0, vitest_1.expect)(attacker.ConsumeItem).toHaveBeenCalledWith(Ids_1.ItemId.Grenade);
            (0, vitest_1.expect)(beatUp.UsedConsumables).toContain(Ids_1.ItemId.Grenade);
            (0, vitest_1.expect)(data.usedGrenade).toBe(true);
        });
        (0, vitest_1.it)("should NOT add grenade to UsedConsumables if ConsumeItem returns false", async () => {
            vitest_1.vi.spyOn(attacker, "ConsumeItem").mockResolvedValue(false);
            const data = await beatUp.LockStates(true);
            (0, vitest_1.expect)(beatUp.UsedConsumables).not.toContain(Ids_1.ItemId.Grenade);
            (0, vitest_1.expect)(data.usedGrenade).toBe(false);
        });
    });
    // -------------------------------------------------------------------------
    (0, vitest_1.describe)("ReleaseLocks", () => {
        (0, vitest_1.it)("should clear IsBeatingId on attacker and IsBeingBeatUpById on defender", async () => {
            // Simulate locks being set first
            attacker.BeatUp.IsBeatingId = defender.Id;
            defender.BeatUp.IsBeingBeatUpById = attacker.Id;
            await beatUp.ReleaseLocks();
            (0, vitest_1.expect)(attacker.BeatUp.IsBeatingId).toBeNull();
            (0, vitest_1.expect)(defender.BeatUp.IsBeingBeatUpById).toBeNull();
        });
        (0, vitest_1.it)("should write null lock fields to the database for both attacker and defender", async () => {
            await beatUp.ReleaseLocks();
            (0, vitest_1.expect)(mockUpdate).toHaveBeenCalledTimes(2);
            const attackerCallArgs = mockUpdate.mock.calls.find((call) => "beatingUserId" in call[0]);
            (0, vitest_1.expect)(attackerCallArgs).toBeDefined();
            (0, vitest_1.expect)(attackerCallArgs[0].beatingUserId).toBeNull();
            const defenderCallArgs = mockUpdate.mock.calls.find((call) => "beingBeatUpByUserId" in call[0]);
            (0, vitest_1.expect)(defenderCallArgs).toBeDefined();
            (0, vitest_1.expect)(defenderCallArgs[0].beingBeatUpByUserId).toBeNull();
        });
        (0, vitest_1.it)("should be idempotent — calling twice does not throw", async () => {
            await (0, vitest_1.expect)(beatUp.ReleaseLocks()).resolves.not.toThrow();
            await (0, vitest_1.expect)(beatUp.ReleaseLocks()).resolves.not.toThrow();
        });
        (0, vitest_1.it)("should clear locks even if they were never set", async () => {
            // Locks start as null by default
            (0, vitest_1.expect)(attacker.BeatUp.IsBeatingId).toBeNull();
            (0, vitest_1.expect)(defender.BeatUp.IsBeingBeatUpById).toBeNull();
            await beatUp.ReleaseLocks();
            (0, vitest_1.expect)(attacker.BeatUp.IsBeatingId).toBeNull();
            (0, vitest_1.expect)(defender.BeatUp.IsBeingBeatUpById).toBeNull();
        });
    });
});
//# sourceMappingURL=BeatUpLocks.test.js.map