"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const User_1 = require("#core/models/User");
const Language_1 = require("#core/models/Language");
const Classes_1 = require("#core/types/Classes");
const UserRobberyStrategy_1 = require("#core/models/strategies/robbery/UserRobberyStrategy");
const LocationRobberyStrategy_1 = require("#core/models/strategies/robbery/LocationRobberyStrategy");
const Items_1 = require("#core/types/Items");
const Ids_1 = require("#core/types/Ids");
const Scavenge_1 = require("#core/types/Scavenge");
const Jobs_1 = require("#core/types/Jobs");
const Locations_1 = require("#core/types/Locations");
vitest_1.vi.mock("#core/database/Users", () => ({
    Users: {
        update: vitest_1.vi.fn(),
        findOne: vitest_1.vi.fn(),
        findByPk: vitest_1.vi.fn(() => Promise.resolve({ class: Classes_1.ClassId.Entrepreneur, nickname: "OtherUser" })),
        findAll: vitest_1.vi.fn(() => Promise.resolve([])),
    },
}));
(0, vitest_1.describe)("Robbery", () => {
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
    (0, vitest_1.describe)("When testing if user can rob another user", () => {
        (0, vitest_1.beforeEach)(() => {
            user.Items = [Items_1.ItemList[Ids_1.ItemId.Pistol]];
            user.GetAttributes();
        });
        (0, vitest_1.it)("Should fail if user tries to rob themselves", async () => {
            const robbery = new UserRobberyStrategy_1.UserRobberyStrategy(user, user);
            const result = await robbery.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("yourself");
        });
        (0, vitest_1.it)("Should fail if attacker and defender are in same gang", async () => {
            user.GangId = 1;
            defender.GangId = 1;
            const robbery = new UserRobberyStrategy_1.UserRobberyStrategy(user, defender);
            const result = await robbery.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("gang");
        });
        (0, vitest_1.it)("Should fail if defender has no nickname", async () => {
            defender.Nickname = "";
            const robbery = new UserRobberyStrategy_1.UserRobberyStrategy(user, defender);
            const result = await robbery.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("nickname");
        });
        (0, vitest_1.it)("Should fail if defender has no class", async () => {
            defender.Class = Classes_1.ClassId.None;
            const robbery = new UserRobberyStrategy_1.UserRobberyStrategy(user, defender);
            const result = await robbery.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("class");
        });
        (0, vitest_1.it)("Should fail if attacker has no weapon", async () => {
            user.Items = [];
            user.GetAttributes();
            const robbery = new UserRobberyStrategy_1.UserRobberyStrategy(user, defender);
            const result = await robbery.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("weapon");
        });
        (0, vitest_1.it)("Should fail if defender attack is too high", async () => {
            user.Attributes.Attack = 10;
            defender.Attributes.Attack = 30; // Difference > 15
            const robbery = new UserRobberyStrategy_1.UserRobberyStrategy(user, defender);
            const result = await robbery.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("weapons");
        });
        (0, vitest_1.it)("Should fail if attacker is scavenging", async () => {
            user.Scavenge.IsScavengingId = Scavenge_1.ScavengeId.Dump;
            const robbery = new UserRobberyStrategy_1.UserRobberyStrategy(user, defender);
            const result = await robbery.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("scavenging");
        });
        (0, vitest_1.it)("Should fail if defender is scavenging", async () => {
            defender.Scavenge.IsScavengingId = Scavenge_1.ScavengeId.Dump;
            const robbery = new UserRobberyStrategy_1.UserRobberyStrategy(user, defender);
            const result = await robbery.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("scavenging");
        });
        (0, vitest_1.it)("Should fail if attacker is working", async () => {
            user.Job.Id = Jobs_1.JobId.UberDriver;
            user.Job.EndsIn = new Date(Date.now() + 3_600_000);
            const robbery = new UserRobberyStrategy_1.UserRobberyStrategy(user, defender);
            const result = await robbery.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("working");
        });
        (0, vitest_1.it)("Should fail if attacker in prison", async () => {
            user.Prison.Time = new Date(Date.now() + 3_600_000);
            const robbery = new UserRobberyStrategy_1.UserRobberyStrategy(user, defender);
            const result = await robbery.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("prison");
        });
        (0, vitest_1.it)("Should fail if attacker is wanted", async () => {
            user.Wanted.Time = new Date(Date.now() + 3_600_000);
            const robbery = new UserRobberyStrategy_1.UserRobberyStrategy(user, defender);
            const result = await robbery.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("wanted");
        });
        (0, vitest_1.it)("Should fail if attacker in hospital", async () => {
            user.Hospital.Time = new Date(Date.now() + 3_600_000);
            const robbery = new UserRobberyStrategy_1.UserRobberyStrategy(user, defender);
            const result = await robbery.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("hospital");
        });
        (0, vitest_1.it)("Should fail if attacker in casino", async () => {
            user.Casino.IsInGame = true;
            const robbery = new UserRobberyStrategy_1.UserRobberyStrategy(user, defender);
            const result = await robbery.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("casino");
        });
        (0, vitest_1.it)("Should fail if defender in casino", async () => {
            defender.Casino.IsInGame = true;
            const robbery = new UserRobberyStrategy_1.UserRobberyStrategy(user, defender);
            const result = await robbery.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("casino");
        });
        (0, vitest_1.it)("Should fail if attacker is beating someone", async () => {
            user.BeatUp.IsBeatingId = "999";
            const robbery = new UserRobberyStrategy_1.UserRobberyStrategy(user, defender);
            const result = await robbery.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("beating");
        });
        (0, vitest_1.it)("Should fail if attacker is being beaten", async () => {
            user.BeatUp.IsBeingBeatUpById = "999";
            const robbery = new UserRobberyStrategy_1.UserRobberyStrategy(user, defender);
            const result = await robbery.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("beated");
        });
        (0, vitest_1.it)("Should fail if attacker is already robbing someone", async () => {
            user.Robbery.IsRobbingId = "999";
            const robbery = new UserRobberyStrategy_1.UserRobberyStrategy(user, defender);
            const result = await robbery.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("robbing");
        });
        (0, vitest_1.it)("Should fail if attacker is being robbed", async () => {
            user.Robbery.IsBeingRobbedById = "999";
            const robbery = new UserRobberyStrategy_1.UserRobberyStrategy(user, defender);
            const result = await robbery.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("robbed");
        });
        (0, vitest_1.it)("Should fail if attacker is robbing a location", async () => {
            user.Robbery.IsRobbingLocationId = Locations_1.LocationId.GroceryStore;
            const robbery = new UserRobberyStrategy_1.UserRobberyStrategy(user, defender);
            const result = await robbery.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("robbing");
        });
        (0, vitest_1.it)("Should fail if defender is beating someone", async () => {
            defender.BeatUp.IsBeatingId = "999";
            const robbery = new UserRobberyStrategy_1.UserRobberyStrategy(user, defender);
            const result = await robbery.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("beating");
        });
        (0, vitest_1.it)("Should fail if defender is being beaten", async () => {
            defender.BeatUp.IsBeingBeatUpById = "999";
            const robbery = new UserRobberyStrategy_1.UserRobberyStrategy(user, defender);
            const result = await robbery.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("beated");
        });
        (0, vitest_1.it)("Should fail if defender is robbing someone", async () => {
            defender.Robbery.IsRobbingId = "999";
            const robbery = new UserRobberyStrategy_1.UserRobberyStrategy(user, defender);
            const result = await robbery.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("robbing");
        });
        (0, vitest_1.it)("Should fail if defender is being robbed", async () => {
            defender.Robbery.IsBeingRobbedById = "999";
            const robbery = new UserRobberyStrategy_1.UserRobberyStrategy(user, defender);
            const result = await robbery.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("robbed");
        });
        (0, vitest_1.it)("Should fail if defender is robbing a location", async () => {
            defender.Robbery.IsRobbingLocationId = Locations_1.LocationId.GroceryStore;
            const robbery = new UserRobberyStrategy_1.UserRobberyStrategy(user, defender);
            const result = await robbery.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("robbing");
        });
        (0, vitest_1.it)("Should fail if attacker is defending investment", async () => {
            user.Robbery.InvestmentIsDefending = true;
            const robbery = new UserRobberyStrategy_1.UserRobberyStrategy(user, defender);
            const result = await robbery.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("investment");
        });
        (0, vitest_1.it)("Should fail if attacker is participating in gang action", async () => {
            user.Robbery.ParticipatingInGangAction = true;
            const robbery = new UserRobberyStrategy_1.UserRobberyStrategy(user, defender);
            const result = await robbery.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("gang action");
        });
        (0, vitest_1.it)("Should fail if defender is defending investment", async () => {
            defender.Robbery.InvestmentIsDefending = true;
            const robbery = new UserRobberyStrategy_1.UserRobberyStrategy(user, defender);
            const result = await robbery.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("investment");
        });
        (0, vitest_1.it)("Should fail if defender is participating in gang action", async () => {
            defender.Robbery.ParticipatingInGangAction = true;
            const robbery = new UserRobberyStrategy_1.UserRobberyStrategy(user, defender);
            const result = await robbery.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("gang action");
        });
        (0, vitest_1.it)("Should succeed if all conditions met", async () => {
            user.Items = [Items_1.ItemList[Ids_1.ItemId.Bazooka]];
            defender.Items = [Items_1.ItemList[Ids_1.ItemId.Pistol]];
            user.GetAttributes();
            const robbery = new UserRobberyStrategy_1.UserRobberyStrategy(user, defender);
            const result = await robbery.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(true);
        });
    });
    (0, vitest_1.describe)("When testing if user can rob a location", () => {
        (0, vitest_1.beforeEach)(() => {
            user.Items = [Items_1.ItemList[Ids_1.ItemId.Knife]];
        });
        (0, vitest_1.it)("Should initialize prison time from location before LockStates", () => {
            const robberyLoc = new LocationRobberyStrategy_1.LocationRobberyStrategy(user, Locations_1.LocationId.SmallBank);
            (0, vitest_1.expect)(robberyLoc.AttackerTimeInPrison).toBe(20 * (Locations_1.LocationId.SmallBank + 1));
        });
        (0, vitest_1.it)("Should fail if low ATK", async () => {
            const robberyLoc = new LocationRobberyStrategy_1.LocationRobberyStrategy(user, Locations_1.LocationId.SmallBank);
            const result = await robberyLoc.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("ATK");
        });
        (0, vitest_1.it)("Should fail if scavenging", async () => {
            user.Scavenge.IsScavengingId = Scavenge_1.ScavengeId.AlienShip;
            const robberyLoc = new LocationRobberyStrategy_1.LocationRobberyStrategy(user, Locations_1.LocationId.SmallBank);
            const result = await robberyLoc.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("scavenging");
        });
        (0, vitest_1.it)("Should fail if working", async () => {
            user.Items = [{ Id: Ids_1.ItemId.Knife }];
            user.Job.Id = Jobs_1.JobId.Butcher;
            const robberyLoc = new LocationRobberyStrategy_1.LocationRobberyStrategy(user, Locations_1.LocationId.SmallBank);
            const result = await robberyLoc.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("working");
        });
        (0, vitest_1.it)("Should fail if user is in prison", async () => {
            user.Prison.Time = new Date(Date.now() + 3_600_000);
            const robberyLoc = new LocationRobberyStrategy_1.LocationRobberyStrategy(user, Locations_1.LocationId.SmallBank);
            const result = await robberyLoc.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("prison");
        });
        (0, vitest_1.it)("Should fail if user is wanted", async () => {
            user.Wanted.Time = new Date(Date.now() + 3_600_000);
            const robberyLoc = new LocationRobberyStrategy_1.LocationRobberyStrategy(user, Locations_1.LocationId.SmallBank);
            const result = await robberyLoc.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("wanted");
        });
        (0, vitest_1.it)("Should fail if user is in hospital", async () => {
            user.Hospital.Time = new Date(Date.now() + 3_600_000);
            const robberyLoc = new LocationRobberyStrategy_1.LocationRobberyStrategy(user, Locations_1.LocationId.SmallBank);
            const result = await robberyLoc.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("hospital");
        });
        (0, vitest_1.it)("Should fail if user is in casino", async () => {
            user.Casino.IsInGame = true;
            const robberyLoc = new LocationRobberyStrategy_1.LocationRobberyStrategy(user, Locations_1.LocationId.SmallBank);
            const result = await robberyLoc.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("casino");
        });
        (0, vitest_1.it)("Should fail if user is beating", async () => {
            user.BeatUp.IsBeatingId = "999";
            const robberyLoc = new LocationRobberyStrategy_1.LocationRobberyStrategy(user, Locations_1.LocationId.SmallBank);
            const result = await robberyLoc.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("beating");
        });
        (0, vitest_1.it)("Should fail if user is being beated", async () => {
            user.BeatUp.IsBeingBeatUpById = "999";
            const robberyLoc = new LocationRobberyStrategy_1.LocationRobberyStrategy(user, Locations_1.LocationId.SmallBank);
            const result = await robberyLoc.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("beated");
        });
        (0, vitest_1.it)("Should fail if user is robbing", async () => {
            user.Robbery.IsRobbingId = "999";
            const robberyLoc = new LocationRobberyStrategy_1.LocationRobberyStrategy(user, Locations_1.LocationId.SmallBank);
            const result = await robberyLoc.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("robbing");
        });
        (0, vitest_1.it)("Should fail if user is being robbed", async () => {
            user.Robbery.IsBeingRobbedById = "999";
            const robberyLoc = new LocationRobberyStrategy_1.LocationRobberyStrategy(user, Locations_1.LocationId.SmallBank);
            const result = await robberyLoc.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("robbed");
        });
        (0, vitest_1.it)("Should fail if user is robbing a location", async () => {
            user.Robbery.IsRobbingLocationId = Locations_1.LocationId.SmallBank;
            const robberyLoc = new LocationRobberyStrategy_1.LocationRobberyStrategy(user, Locations_1.LocationId.SmallBank);
            const result = await robberyLoc.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("robbing");
        });
        (0, vitest_1.it)("Should fail if user is defending investment", async () => {
            user.Robbery.InvestmentIsDefending = true;
            const robberyLoc = new LocationRobberyStrategy_1.LocationRobberyStrategy(user, Locations_1.LocationId.SmallBank);
            const result = await robberyLoc.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("investment");
        });
        (0, vitest_1.it)("Should fail if user is participating in gang action", async () => {
            user.Robbery.ParticipatingInGangAction = true;
            const robberyLoc = new LocationRobberyStrategy_1.LocationRobberyStrategy(user, Locations_1.LocationId.SmallBank);
            const result = await robberyLoc.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("gang action");
        });
        (0, vitest_1.it)("Should succeed if all conditions met", async () => {
            user.Items = [Items_1.ItemList[Ids_1.ItemId.Bazooka]];
            user.GetAttributes();
            const robberyLoc = new LocationRobberyStrategy_1.LocationRobberyStrategy(user, Locations_1.LocationId.SmallBank);
            const result = await robberyLoc.CanRob();
            (0, vitest_1.expect)(result.canRob).toBe(true);
        });
    });
});
//# sourceMappingURL=Robbery.test.js.map