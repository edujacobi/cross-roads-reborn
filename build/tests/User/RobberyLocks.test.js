"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
const vitest_1 = require("vitest");
const User_1 = require("#core/models/User");
const Language_1 = require("#core/models/Language");
const UserRobberyStrategy_1 = require("#core/models/strategies/robbery/UserRobberyStrategy");
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
(0, vitest_1.describe)("Robbery — LockStates & ReleaseLocks", () => {
    let attacker;
    let defender;
    let robbery;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        attacker = new User_1.User("111", Language_1.Language.English);
        attacker.Nickname = "Attacker";
        attacker.Class = Classes_1.ClassId.Entrepreneur;
        attacker.Money = 1_000;
        attacker.Items = [Items_1.ItemList[Ids_1.ItemId.Pistol]];
        attacker.GetAttributes();
        vitest_1.vi.spyOn(attacker, "GetItemSkin").mockReturnValue("🔫");
        defender = new User_1.User("222", Language_1.Language.English);
        defender.Nickname = "Defender";
        defender.Class = Classes_1.ClassId.Entrepreneur;
        defender.Money = 2_000;
        defender.Items = [Items_1.ItemList[Ids_1.ItemId.Pistol]];
        defender.GetAttributes();
        robbery = new UserRobberyStrategy_1.UserRobberyStrategy(attacker, defender);
    });
    // -------------------------------------------------------------------------
    (0, vitest_1.describe)("LockStates", () => {
        (0, vitest_1.it)("should set IsRobbingId on attacker and IsBeingRobbedById on defender", async () => {
            await robbery.LockStates(false);
            (0, vitest_1.expect)(attacker.Robbery.IsRobbingId).toBe(defender.Id);
            (0, vitest_1.expect)(defender.Robbery.IsBeingRobbedById).toBe(attacker.Id);
        });
        (0, vitest_1.it)("should write lock fields to the database for both attacker and defender", async () => {
            await robbery.LockStates(false);
            (0, vitest_1.expect)(mockUpdate).toHaveBeenCalledTimes(2);
            // Verify attacker DB write contains the lock field
            const attackerCallArgs = mockUpdate.mock.calls.find((call) => call[0].robbingUserId === defender.Id);
            (0, vitest_1.expect)(attackerCallArgs).toBeDefined();
            // Verify defender DB write contains the lock field
            const defenderCallArgs = mockUpdate.mock.calls.find((call) => call[0].beingRobbedByUserId === attacker.Id);
            (0, vitest_1.expect)(defenderCallArgs).toBeDefined();
        });
        (0, vitest_1.it)("should calculate AttackerTimeInPrison based on attacker ATK", async () => {
            await robbery.LockStates(false);
            const expectedTime = 10 + 1.5 * attacker.Attributes.Attack;
            (0, vitest_1.expect)(robbery.AttackerTimeInPrison).toBe(expectedTime);
        });
        (0, vitest_1.it)("should calculate AttackerAditionalTimeCallPolice based on attacker ATK", async () => {
            await robbery.LockStates(false);
            const expectedAdditional = Math.floor(25 + 0.5 * attacker.Attributes.Attack);
            (0, vitest_1.expect)(robbery.AttackerAditionalTimeCallPolice).toBe(expectedAdditional);
        });
        (0, vitest_1.it)("should calculate DefenderTimeInHospital based on defender DEF", async () => {
            await robbery.LockStates(false);
            const expectedTime = 25 + defender.Attributes.Defense / 2;
            (0, vitest_1.expect)(robbery.DefenderTimeInHospital).toBe(expectedTime);
        });
        (0, vitest_1.it)("should return correct RobberyInitData shape", async () => {
            const data = await robbery.LockStates(false);
            (0, vitest_1.expect)(data).toHaveProperty("attackerTimeInPrison");
            (0, vitest_1.expect)(data).toHaveProperty("attackerAditionalTimeCallPolice");
            (0, vitest_1.expect)(data).toHaveProperty("defenderTimeInHospital");
            (0, vitest_1.expect)(data).toHaveProperty("cannotReact");
            (0, vitest_1.expect)(data).toHaveProperty("cannotCallPolice");
            (0, vitest_1.expect)(data).toHaveProperty("usedGunSkin");
            (0, vitest_1.expect)(data).toHaveProperty("usedGunName");
            (0, vitest_1.expect)(data).toHaveProperty("usedGrenade");
        });
        (0, vitest_1.it)("should set cannotReact when defender is working", async () => {
            defender.Job.Id = 1; // any active job
            defender.Job.EndsIn = new Date(Date.now() + 3_600_000);
            const data = await robbery.LockStates(false);
            (0, vitest_1.expect)(data.cannotReact).toBe(true);
        });
        (0, vitest_1.it)("should set cannotCallPolice when defender defense is below 5", async () => {
            defender.Attributes.Defense = 4;
            const data = await robbery.LockStates(false);
            (0, vitest_1.expect)(data.cannotCallPolice).toBe(true);
        });
        (0, vitest_1.it)("should boost attacker ATK by 1.35x when defender has 0 or less defense", async () => {
            const originalAttack = attacker.Attributes.Attack;
            defender.Attributes.Defense = 0;
            await robbery.LockStates(false);
            (0, vitest_1.expect)(attacker.Attributes.Attack).toBeCloseTo(originalAttack * 1.35);
        });
        (0, vitest_1.it)("should NOT boost attacker ATK when defender has positive defense", async () => {
            const originalAttack = attacker.Attributes.Attack;
            defender.Attributes.Defense = 10;
            await robbery.LockStates(false);
            (0, vitest_1.expect)(attacker.Attributes.Attack).toBe(originalAttack);
        });
        (0, vitest_1.it)("should consume a grenade and push ItemId.Grenade to UsedConsumables when useGrenade is true", async () => {
            attacker.Items = [
                Items_1.ItemList[Ids_1.ItemId.Pistol],
                { ...Items_1.ItemList[Ids_1.ItemId.Grenade], Quantity: 1 },
            ];
            vitest_1.vi.spyOn(attacker, "ConsumeItem").mockResolvedValue(true);
            vitest_1.vi.spyOn(attacker, "GetAttributes").mockResolvedValue(undefined);
            const data = await robbery.LockStates(true);
            (0, vitest_1.expect)(attacker.ConsumeItem).toHaveBeenCalledWith(Ids_1.ItemId.Grenade);
            (0, vitest_1.expect)(robbery.UsedConsumables).toContain(Ids_1.ItemId.Grenade);
            (0, vitest_1.expect)(data.usedGrenade).toBe(true);
        });
        (0, vitest_1.it)("should NOT add grenade to UsedConsumables if ConsumeItem returns false", async () => {
            vitest_1.vi.spyOn(attacker, "ConsumeItem").mockResolvedValue(false);
            const data = await robbery.LockStates(true);
            (0, vitest_1.expect)(robbery.UsedConsumables).not.toContain(Ids_1.ItemId.Grenade);
            (0, vitest_1.expect)(data.usedGrenade).toBe(false);
        });
    });
    // -------------------------------------------------------------------------
    (0, vitest_1.describe)("ReleaseLocks", () => {
        (0, vitest_1.it)("should clear IsRobbingId on attacker and IsBeingRobbedById on defender", async () => {
            // Simulate locks being set first
            attacker.Robbery.IsRobbingId = defender.Id;
            defender.Robbery.IsBeingRobbedById = attacker.Id;
            await robbery.ReleaseLocks();
            (0, vitest_1.expect)(attacker.Robbery.IsRobbingId).toBeNull();
            (0, vitest_1.expect)(defender.Robbery.IsBeingRobbedById).toBeNull();
        });
        (0, vitest_1.it)("should write null lock fields to the database for both attacker and defender", async () => {
            await robbery.ReleaseLocks();
            (0, vitest_1.expect)(mockUpdate).toHaveBeenCalledTimes(2);
            const attackerCallArgs = mockUpdate.mock.calls.find((call) => "robbingUserId" in call[0]);
            (0, vitest_1.expect)(attackerCallArgs).toBeDefined();
            (0, vitest_1.expect)(attackerCallArgs[0].robbingUserId).toBeNull();
            const defenderCallArgs = mockUpdate.mock.calls.find((call) => "beingRobbedByUserId" in call[0]);
            (0, vitest_1.expect)(defenderCallArgs).toBeDefined();
            (0, vitest_1.expect)(defenderCallArgs[0].beingRobbedByUserId).toBeNull();
        });
        (0, vitest_1.it)("should be idempotent — calling twice does not throw", async () => {
            await (0, vitest_1.expect)(robbery.ReleaseLocks()).resolves.not.toThrow();
            await (0, vitest_1.expect)(robbery.ReleaseLocks()).resolves.not.toThrow();
        });
        (0, vitest_1.it)("should clear locks even if they were never set", async () => {
            // Locks start as null by default
            (0, vitest_1.expect)(attacker.Robbery.IsRobbingId).toBeNull();
            (0, vitest_1.expect)(defender.Robbery.IsBeingRobbedById).toBeNull();
            await robbery.ReleaseLocks();
            (0, vitest_1.expect)(attacker.Robbery.IsRobbingId).toBeNull();
            (0, vitest_1.expect)(defender.Robbery.IsBeingRobbedById).toBeNull();
        });
    });
});
//# sourceMappingURL=RobberyLocks.test.js.map