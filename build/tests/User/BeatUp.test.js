"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const User_1 = require("#core/models/User");
const Language_1 = require("#core/models/Language");
const Jobs_1 = require("#core/types/Jobs");
const Classes_1 = require("#core/types/Classes");
const BeatUp_1 = require("#core/models/BeatUp");
const Scavenge_1 = require("#core/types/Scavenge");
const Ids_1 = require("#core/types/Ids");
const Items_1 = require("#core/types/Items");
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
(0, vitest_1.describe)("BeatUp", () => {
    let user;
    let defender;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        user = new User_1.User("123", Language_1.Language.English);
        user.Nickname = "TestUser";
        user.Class = Classes_1.ClassId.Entrepreneur;
        user.Money = 5_000;
        defender = new User_1.User("456", Language_1.Language.English);
        defender.Nickname = "Defender";
        defender.Class = Classes_1.ClassId.Entrepreneur;
        defender.Money = 5_000;
    });
    (0, vitest_1.describe)("When testing if user can beat up", () => {
        (0, vitest_1.beforeEach)(async () => {
            user.Items = [Items_1.ItemList[Ids_1.ItemId.Knife]];
            defender.Items = [Items_1.ItemList[Ids_1.ItemId.Knife]];
        });
        (0, vitest_1.it)("Should fail if attacker is defender", async () => {
            const beatUp = new BeatUp_1.BeatUp(user, user);
            const result = await beatUp.CanBeatUser();
            (0, vitest_1.expect)(result.canBeat).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("yourself");
        });
        (0, vitest_1.it)("Should fail if attacker and defender are in same gang", async () => {
            user.GangId = 1;
            defender.GangId = 1;
            const beatUp = new BeatUp_1.BeatUp(user, defender);
            const result = await beatUp.CanBeatUser();
            (0, vitest_1.expect)(result.canBeat).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("gang");
        });
        (0, vitest_1.it)("Should fail if defender has no nickname", async () => {
            const beatUp = new BeatUp_1.BeatUp(user, defender);
            defender.Nickname = "";
            const result = await beatUp.CanBeatUser();
            (0, vitest_1.expect)(result.canBeat).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("nickname");
        });
        (0, vitest_1.it)("Should fail if defender has no class", async () => {
            const beatUp = new BeatUp_1.BeatUp(user, defender);
            defender.Class = Classes_1.ClassId.None;
            const result = await beatUp.CanBeatUser();
            (0, vitest_1.expect)(result.canBeat).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("class");
        });
        (0, vitest_1.it)("Should fail if attacker without weapon", async () => {
            user.Items = [];
            await user.GetAttributes(true);
            const beatUp = new BeatUp_1.BeatUp(user, defender);
            const result = await beatUp.CanBeatUser();
            (0, vitest_1.expect)(result.canBeat).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("weapon");
        });
        (0, vitest_1.it)("Should fail if defender too strong", async () => {
            user.Items = [Items_1.ItemList[Ids_1.ItemId.Knife]];
            defender.Items = [Items_1.ItemList[Ids_1.ItemId.Bazooka]];
            const beatUp = new BeatUp_1.BeatUp(user, defender);
            const result = await beatUp.CanBeatUser();
            (0, vitest_1.expect)(result.canBeat).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("current weapons");
        });
        (0, vitest_1.it)("Should fail if attacker is scavenging", async () => {
            const beatUp = new BeatUp_1.BeatUp(user, defender);
            user.Scavenge.IsScavengingId = Scavenge_1.ScavengeId.AlienShip;
            const result = await beatUp.CanBeatUser();
            (0, vitest_1.expect)(result.canBeat).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("scavenging");
        });
        (0, vitest_1.it)("Should fail if defender is scavenging", async () => {
            const beatUp = new BeatUp_1.BeatUp(user, defender);
            defender.Scavenge.IsScavengingId = Scavenge_1.ScavengeId.AlienShip;
            const result = await beatUp.CanBeatUser();
            (0, vitest_1.expect)(result.canBeat).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("scavenging");
        });
        (0, vitest_1.it)("Should fail if attacker is working", async () => {
            const beatUp = new BeatUp_1.BeatUp(user, defender);
            user.Job.Id = Jobs_1.JobId.Bodyguard;
            const result = await beatUp.CanBeatUser();
            (0, vitest_1.expect)(result.canBeat).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("working");
        });
        (0, vitest_1.it)("Should fail if defender is working", async () => {
            const beatUp = new BeatUp_1.BeatUp(user, defender);
            defender.Job.Id = Jobs_1.JobId.Bodyguard;
            const result = await beatUp.CanBeatUser();
            (0, vitest_1.expect)(result.canBeat).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("working");
        });
        (0, vitest_1.it)("Should fail if attacker is in prison but defender is not", async () => {
            const beatUp = new BeatUp_1.BeatUp(user, defender);
            user.Prison.Time = new Date(Date.now() + 3_600_000);
            const result = await beatUp.CanBeatUser();
            (0, vitest_1.expect)(result.canBeat).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("prison");
        });
        (0, vitest_1.it)("Should fail if defender is in prison but attacker is not", async () => {
            const beatUp = new BeatUp_1.BeatUp(user, defender);
            defender.Prison.Time = new Date(Date.now() + 3_600_000);
            const result = await beatUp.CanBeatUser();
            (0, vitest_1.expect)(result.canBeat).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("prison");
        });
        (0, vitest_1.it)("Should fail if attacker is wanted by the police", async () => {
            const beatUp = new BeatUp_1.BeatUp(user, defender);
            user.Wanted.Time = new Date(Date.now() + 3_600_000);
            const result = await beatUp.CanBeatUser();
            (0, vitest_1.expect)(result.canBeat).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("wanted");
        });
        (0, vitest_1.it)("Should fail if attacker is in hospital", async () => {
            const beatUp = new BeatUp_1.BeatUp(user, defender);
            user.Hospital.Time = new Date(Date.now() + 3_600_000);
            const result = await beatUp.CanBeatUser();
            (0, vitest_1.expect)(result.canBeat).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("hospital");
        });
        (0, vitest_1.it)("Should fail if defender is in hospital", async () => {
            const beatUp = new BeatUp_1.BeatUp(user, defender);
            defender.Hospital.Time = new Date(Date.now() + 3_600_000);
            const result = await beatUp.CanBeatUser();
            (0, vitest_1.expect)(result.canBeat).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("hospital");
        });
        (0, vitest_1.it)("Should fail if attacker is in casino game", async () => {
            const beatUp = new BeatUp_1.BeatUp(user, defender);
            user.Casino.IsInGame = true;
            const result = await beatUp.CanBeatUser();
            (0, vitest_1.expect)(result.canBeat).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("casino");
        });
        (0, vitest_1.it)("Should fail if defender is in casino game", async () => {
            const beatUp = new BeatUp_1.BeatUp(user, defender);
            defender.Casino.IsInGame = true;
            const result = await beatUp.CanBeatUser();
            (0, vitest_1.expect)(result.canBeat).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("casino");
        });
        (0, vitest_1.it)("Should fail if beat up is in cooldown", async () => {
            const beatUp = new BeatUp_1.BeatUp(user, defender);
            user.BeatUp.Time = new Date(Date.now() + 3_600_000);
            const result = await beatUp.CanBeatUser();
            (0, vitest_1.expect)(result.canBeat).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("beat again");
        });
        (0, vitest_1.it)("Should fail if already beating", async () => {
            const beatUp = new BeatUp_1.BeatUp(user, defender);
            user.BeatUp.IsBeatingId = "123";
            const result = await beatUp.CanBeatUser();
            (0, vitest_1.expect)(result.canBeat).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("beating");
        });
        (0, vitest_1.it)("Should fail if already being beaten", async () => {
            const beatUp = new BeatUp_1.BeatUp(user, defender);
            defender.BeatUp.IsBeingBeatUpById = "123";
            const result = await beatUp.CanBeatUser();
            (0, vitest_1.expect)(result.canBeat).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("beated");
        });
        (0, vitest_1.it)("Should fail if defender is in beating", async () => {
            const beatUp = new BeatUp_1.BeatUp(user, defender);
            defender.BeatUp.IsBeatingId = "123";
            const result = await beatUp.CanBeatUser();
            (0, vitest_1.expect)(result.canBeat).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("beating");
        });
        (0, vitest_1.it)("Should fail if defender is being beaten", async () => {
            const beatUp = new BeatUp_1.BeatUp(user, defender);
            defender.BeatUp.IsBeingBeatUpById = "123";
            const result = await beatUp.CanBeatUser();
            (0, vitest_1.expect)(result.canBeat).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("beated");
        });
        (0, vitest_1.it)("Should fail if already robbing", async () => {
            const beatUp = new BeatUp_1.BeatUp(user, defender);
            user.Robbery.IsRobbingId = "123";
            const result = await beatUp.CanBeatUser();
            (0, vitest_1.expect)(result.canBeat).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("robbing");
        });
        (0, vitest_1.it)("Should fail if already being robbed", async () => {
            const beatUp = new BeatUp_1.BeatUp(user, defender);
            defender.Robbery.IsBeingRobbedById = "123";
            const result = await beatUp.CanBeatUser();
            (0, vitest_1.expect)(result.canBeat).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("robbed");
        });
        (0, vitest_1.it)("Should fail if defender is in robbing", async () => {
            const beatUp = new BeatUp_1.BeatUp(user, defender);
            defender.Robbery.IsRobbingId = "123";
            const result = await beatUp.CanBeatUser();
            (0, vitest_1.expect)(result.canBeat).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("robbing");
        });
        (0, vitest_1.it)("Should fail if defender is being robbed", async () => {
            const beatUp = new BeatUp_1.BeatUp(user, defender);
            defender.Robbery.IsBeingRobbedById = "123";
            const result = await beatUp.CanBeatUser();
            (0, vitest_1.expect)(result.canBeat).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("robbed");
        });
        (0, vitest_1.it)("Should fail if attacker is robbing location", async () => {
            const beatUp = new BeatUp_1.BeatUp(user, defender);
            user.Robbery.IsRobbingLocationId = Locations_1.LocationId.ArmyDepot;
            const result = await beatUp.CanBeatUser();
            (0, vitest_1.expect)(result.canBeat).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("robbing");
        });
        (0, vitest_1.it)("Should fail if defender is robbing location", async () => {
            const beatUp = new BeatUp_1.BeatUp(user, defender);
            defender.Robbery.IsRobbingLocationId = Locations_1.LocationId.ArmyDepot;
            const result = await beatUp.CanBeatUser();
            (0, vitest_1.expect)(result.canBeat).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("robbing");
        });
        (0, vitest_1.it)("Should fail if attacker is escaping prison", async () => {
            const beatUp = new BeatUp_1.BeatUp(user, defender);
            user.Escape.Time = new Date(Date.now() + 3_600_000);
            const result = await beatUp.CanBeatUser();
            (0, vitest_1.expect)(result.canBeat).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("escape");
        });
        (0, vitest_1.it)("Should fail if defender is escaping prison", async () => {
            const beatUp = new BeatUp_1.BeatUp(user, defender);
            defender.Escape.Time = new Date(Date.now() + 3_600_000);
            const result = await beatUp.CanBeatUser();
            (0, vitest_1.expect)(result.canBeat).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("escape");
        });
        (0, vitest_1.it)("Should fail if attacker is defending investment", async () => {
            const beatUp = new BeatUp_1.BeatUp(user, defender);
            user.Robbery.InvestmentIsDefending = true;
            const result = await beatUp.CanBeatUser();
            (0, vitest_1.expect)(result.canBeat).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("investment");
        });
        (0, vitest_1.it)("Should fail if attacker is participating in gang action", async () => {
            const beatUp = new BeatUp_1.BeatUp(user, defender);
            user.Robbery.ParticipatingInGangAction = true;
            const result = await beatUp.CanBeatUser();
            (0, vitest_1.expect)(result.canBeat).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("gang action");
        });
        (0, vitest_1.it)("Should fail if defender is defending investment", async () => {
            const beatUp = new BeatUp_1.BeatUp(user, defender);
            defender.Robbery.InvestmentIsDefending = true;
            const result = await beatUp.CanBeatUser();
            (0, vitest_1.expect)(result.canBeat).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("investment");
        });
        (0, vitest_1.it)("Should fail if defender is participating in gang action", async () => {
            const beatUp = new BeatUp_1.BeatUp(user, defender);
            defender.Robbery.ParticipatingInGangAction = true;
            const result = await beatUp.CanBeatUser();
            (0, vitest_1.expect)(result.canBeat).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("gang action");
        });
        (0, vitest_1.it)("Should succeed", async () => {
            const beatUp = new BeatUp_1.BeatUp(user, defender);
            const result = await beatUp.CanBeatUser();
            (0, vitest_1.expect)(result.canBeat).toBe(true);
        });
    });
});
//# sourceMappingURL=BeatUp.test.js.map