import { beforeEach, describe, expect, it, vi } from "vitest";
import { User } from "#core/models/User";
import { Language } from "#core/models/Language";
import { ClassId } from "#core/types/Classes";
import { Shop } from "#core/models/Shop";
import { ScavengeId } from "#core/types/Scavenge";
import { ItemId } from "#core/types/Ids";
import { ItemList, type UserItem } from "#core/types/Items";
import { LocationId } from "#core/types/Locations";
import { addHours } from "date-fns";

// --- Global Mocks ---

vi.mock("#core/database/Users", () => ({
	Users: {
		update: vi.fn(),
		findOne: vi.fn(),
		findByPk: vi.fn(() => Promise.resolve({ class: ClassId.Entrepreneur, nickname: "OtherUser" })),
		findAll: vi.fn(() => Promise.resolve([])),
	},
}));

describe("Shop", () => {
	let user: User;

	beforeEach(() => {
		vi.clearAllMocks();
		user = new User("123", Language.English);
		user.Nickname = "TestUser";
		user.Class = ClassId.Entrepreneur;
		user.Money = 5_000;
	});

	describe("When testing if user can buy item", () => {
		it("Should fail if no money", async () => {
			const shop = new Shop(user);
			user.Money = 0;
			const result = await shop.CanUserBuyItem(ItemList[ItemId.Knife]);
			expect(result.canBuy).toBe(false);
			expect(result.message).toContain("money");
		});

		it("Should fail if user has more hours than allowed (360)", async () => {
			const shop = new Shop(user);
			const item = ItemList[ItemId.Knife] as UserItem;
			item.RemainingTime = addHours(new Date(), 370);
			user.Items = [item];
			const result = await shop.CanUserBuyItem(ItemList[ItemId.Knife]);
			expect(result.canBuy).toBe(false);
			expect(result.message).toContain("hours");
		});

		it("Should fail if user is scavenging", async () => {
			const shop = new Shop(user);
			user.Scavenge.IsScavengingId = ScavengeId.Dump;
			const result = await shop.CanUserBuyItem(ItemList[ItemId.Knife]);
			expect(result.canBuy).toBe(false);
			expect(result.message).toContain("scavenging");
		});

		it("Should fail if user is in prison", async () => {
			const shop = new Shop(user);
			user.Prison.Time = new Date(Date.now() + 3_600_000);
			const result = await shop.CanUserBuyItem(ItemList[ItemId.Knife]);
			expect(result.canBuy).toBe(false);
			expect(result.message).toContain("prison");
		});

		it("Should fail if user is in hospital", async () => {
			const shop = new Shop(user);
			user.Hospital.Time = new Date(Date.now() + 3_600_000);
			const result = await shop.CanUserBuyItem(ItemList[ItemId.Knife]);
			expect(result.canBuy).toBe(false);
			expect(result.message).toContain("hospital");
		});

		it("Should fail if user is in casino", async () => {
			const shop = new Shop(user);
			user.Casino.IsInGame = true;
			const result = await shop.CanUserBuyItem(ItemList[ItemId.Knife]);
			expect(result.canBuy).toBe(false);
			expect(result.message).toContain("casino");
		});

		it("Should fail if user is beating", async () => {
			const shop = new Shop(user);
			user.BeatUp.IsBeatingId = "123";
			const result = await shop.CanUserBuyItem(ItemList[ItemId.Knife]);
			expect(result.canBuy).toBe(false);
			expect(result.message).toContain("beating");
		});

		it("Should fail if user is being beated", async () => {
			const shop = new Shop(user);
			user.BeatUp.IsBeingBeatUpById = "123";
			const result = await shop.CanUserBuyItem(ItemList[ItemId.Knife]);
			expect(result.canBuy).toBe(false);
			expect(result.message).toContain("being beated");
		});

		it("Should fail if user is robbing user", async () => {
			const shop = new Shop(user);
			user.Robbery.IsRobbingId = "123";
			const result = await shop.CanUserBuyItem(ItemList[ItemId.Knife]);
			expect(result.canBuy).toBe(false);
			expect(result.message).toContain("robbing");
		});

		it("Should fail if user is being robbed", async () => {
			const shop = new Shop(user);
			user.Robbery.IsBeingRobbedById = "123";
			const result = await shop.CanUserBuyItem(ItemList[ItemId.Knife]);
			expect(result.canBuy).toBe(false);
			expect(result.message).toContain("being robbed");
		});

		it("Should fail if user is robbing location", async () => {
			const shop = new Shop(user);
			user.Robbery.IsRobbingLocationId = LocationId.GroceryStore;
			const result = await shop.CanUserBuyItem(ItemList[ItemId.Knife]);
			expect(result.canBuy).toBe(false);
			expect(result.message).toContain("robbing");
		});

		it("Should succeed", async () => {
			const shop = new Shop(user);
			const result = await shop.CanUserBuyItem(ItemList[ItemId.Knife]);
			expect(result.canBuy).toBe(true);
			expect(result.message).toBe("");
		});
	});
});
