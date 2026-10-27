"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const User_1 = require("#core/models/User");
const Language_1 = require("#core/models/Language");
const Classes_1 = require("#core/types/Classes");
const Shop_1 = require("#core/models/Shop");
const Scavenge_1 = require("#core/types/Scavenge");
const Ids_1 = require("#core/types/Ids");
const Items_1 = require("#core/types/Items");
const Locations_1 = require("#core/types/Locations");
const date_fns_1 = require("date-fns");
// --- Global Mocks ---
vitest_1.vi.mock("#core/database/Users", () => ({
    Users: {
        update: vitest_1.vi.fn(),
        findOne: vitest_1.vi.fn(),
        findByPk: vitest_1.vi.fn(() => Promise.resolve({ class: Classes_1.ClassId.Entrepreneur, nickname: "OtherUser" })),
        findAll: vitest_1.vi.fn(() => Promise.resolve([])),
    },
}));
(0, vitest_1.describe)("Shop", () => {
    let user;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        user = new User_1.User("123", Language_1.Language.English);
        user.Nickname = "TestUser";
        user.Class = Classes_1.ClassId.Entrepreneur;
        user.Money = 5_000;
    });
    (0, vitest_1.describe)("When testing if user can buy item", () => {
        (0, vitest_1.it)("Should fail if no money", async () => {
            const shop = new Shop_1.Shop(user);
            user.Money = 0;
            const result = await shop.CanUserBuyItem(Items_1.ItemList[Ids_1.ItemId.Knife]);
            (0, vitest_1.expect)(result.canBuy).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("money");
        });
        (0, vitest_1.it)("Should fail if user has more hours than allowed (360)", async () => {
            const shop = new Shop_1.Shop(user);
            const item = Items_1.ItemList[Ids_1.ItemId.Knife];
            item.RemainingTime = (0, date_fns_1.addHours)(new Date(), 370);
            user.Items = [item];
            const result = await shop.CanUserBuyItem(Items_1.ItemList[Ids_1.ItemId.Knife]);
            (0, vitest_1.expect)(result.canBuy).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("hours");
        });
        (0, vitest_1.it)("Should fail if user is scavenging", async () => {
            const shop = new Shop_1.Shop(user);
            user.Scavenge.IsScavengingId = Scavenge_1.ScavengeId.Dump;
            const result = await shop.CanUserBuyItem(Items_1.ItemList[Ids_1.ItemId.Knife]);
            (0, vitest_1.expect)(result.canBuy).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("scavenging");
        });
        (0, vitest_1.it)("Should fail if user is in prison", async () => {
            const shop = new Shop_1.Shop(user);
            user.Prison.Time = new Date(Date.now() + 3_600_000);
            const result = await shop.CanUserBuyItem(Items_1.ItemList[Ids_1.ItemId.Knife]);
            (0, vitest_1.expect)(result.canBuy).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("prison");
        });
        (0, vitest_1.it)("Should fail if user is in hospital", async () => {
            const shop = new Shop_1.Shop(user);
            user.Hospital.Time = new Date(Date.now() + 3_600_000);
            const result = await shop.CanUserBuyItem(Items_1.ItemList[Ids_1.ItemId.Knife]);
            (0, vitest_1.expect)(result.canBuy).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("hospital");
        });
        (0, vitest_1.it)("Should fail if user is in casino", async () => {
            const shop = new Shop_1.Shop(user);
            user.Casino.IsInGame = true;
            const result = await shop.CanUserBuyItem(Items_1.ItemList[Ids_1.ItemId.Knife]);
            (0, vitest_1.expect)(result.canBuy).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("casino");
        });
        (0, vitest_1.it)("Should fail if user is beating", async () => {
            const shop = new Shop_1.Shop(user);
            user.BeatUp.IsBeatingId = "123";
            const result = await shop.CanUserBuyItem(Items_1.ItemList[Ids_1.ItemId.Knife]);
            (0, vitest_1.expect)(result.canBuy).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("beating");
        });
        (0, vitest_1.it)("Should fail if user is being beated", async () => {
            const shop = new Shop_1.Shop(user);
            user.BeatUp.IsBeingBeatUpById = "123";
            const result = await shop.CanUserBuyItem(Items_1.ItemList[Ids_1.ItemId.Knife]);
            (0, vitest_1.expect)(result.canBuy).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("being beated");
        });
        (0, vitest_1.it)("Should fail if user is robbing user", async () => {
            const shop = new Shop_1.Shop(user);
            user.Robbery.IsRobbingId = "123";
            const result = await shop.CanUserBuyItem(Items_1.ItemList[Ids_1.ItemId.Knife]);
            (0, vitest_1.expect)(result.canBuy).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("robbing");
        });
        (0, vitest_1.it)("Should fail if user is being robbed", async () => {
            const shop = new Shop_1.Shop(user);
            user.Robbery.IsBeingRobbedById = "123";
            const result = await shop.CanUserBuyItem(Items_1.ItemList[Ids_1.ItemId.Knife]);
            (0, vitest_1.expect)(result.canBuy).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("being robbed");
        });
        (0, vitest_1.it)("Should fail if user is robbing location", async () => {
            const shop = new Shop_1.Shop(user);
            user.Robbery.IsRobbingLocationId = Locations_1.LocationId.GroceryStore;
            const result = await shop.CanUserBuyItem(Items_1.ItemList[Ids_1.ItemId.Knife]);
            (0, vitest_1.expect)(result.canBuy).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("robbing");
        });
        (0, vitest_1.it)("Should fail if user is working", async () => {
            const shop = new Shop_1.Shop(user);
            user.Job.Id = 1;
            user.Job.EndsIn = new Date(Date.now() + 3_600_000);
            // Mock IsWorking to return true since it probably checks Job.EndsIn
            vitest_1.vi.spyOn(user, "IsWorking").mockReturnValue(true);
            const result = await shop.CanUserBuyItem(Items_1.ItemList[Ids_1.ItemId.Knife]);
            (0, vitest_1.expect)(result.canBuy).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("working");
        });
        (0, vitest_1.it)("Should fail if user is defending investment", async () => {
            const shop = new Shop_1.Shop(user);
            user.Robbery.InvestmentIsDefending = true;
            const result = await shop.CanUserBuyItem(Items_1.ItemList[Ids_1.ItemId.Knife]);
            (0, vitest_1.expect)(result.canBuy).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("defending your investment");
        });
        (0, vitest_1.it)("Should fail if user is participating in gang action", async () => {
            const shop = new Shop_1.Shop(user);
            user.Robbery.ParticipatingInGangAction = true;
            const result = await shop.CanUserBuyItem(Items_1.ItemList[Ids_1.ItemId.Knife]);
            (0, vitest_1.expect)(result.canBuy).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("participating in a gang action");
        });
        (0, vitest_1.it)("Should fail if buying a consumable and user already has 20 or more", async () => {
            const shop = new Shop_1.Shop(user);
            user.Money = 500_000;
            const item = { ...Items_1.ItemList[Ids_1.ItemId.Grenade] };
            item.Quantity = 20;
            user.Items = [item];
            const result = await shop.CanUserBuyItem(Items_1.ItemList[Ids_1.ItemId.Grenade]);
            (0, vitest_1.expect)(result.canBuy).toBe(false);
            (0, vitest_1.expect)(result.message).toContain("20 of the same consumable");
        });
        (0, vitest_1.it)("Should succeed if buying a consumable and user has less than 20", async () => {
            const shop = new Shop_1.Shop(user);
            user.Money = 500_000;
            const item = { ...Items_1.ItemList[Ids_1.ItemId.Grenade] };
            item.Quantity = 19;
            user.Items = [item];
            const result = await shop.CanUserBuyItem(Items_1.ItemList[Ids_1.ItemId.Grenade]);
            (0, vitest_1.expect)(result.canBuy).toBe(true);
            (0, vitest_1.expect)(result.message).toBe("");
        });
        (0, vitest_1.it)("Should succeed", async () => {
            const shop = new Shop_1.Shop(user);
            const result = await shop.CanUserBuyItem(Items_1.ItemList[Ids_1.ItemId.Knife]);
            (0, vitest_1.expect)(result.canBuy).toBe(true);
            (0, vitest_1.expect)(result.message).toBe("");
        });
    });
});
//# sourceMappingURL=Shop.test.js.map