import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolvers } from "#api/graphql/resolvers";
import { User } from "#core/models/User";
import { UserBadge } from "#core/models/UserBadge";
import { UserRepository } from "#core/repositories/UserRepository";
import { UserItemRepository } from "#core/repositories/UserItemRepository";
import { BadgeId } from "#core/types/Badges";
import { ClassId } from "#core/types/Classes";
import { BundleId, ItemId } from "#core/types/Ids";

vi.mock("#bot/client", () => ({
	getClient: () => ({
		users: {
			fetch: vi.fn().mockResolvedValue({ avatarURL: () => null }),
		},
		userLastCommand: new Map(),
	}),
}));

const moderator = {
	userId: "654321",
	username: "ModTester",
	avatar: null,
	role: "MODERATOR" as const,
};

const developer = {
	...moderator,
	role: "DEVELOPER" as const,
};

describe("Admin action mutations", () => {
	beforeEach(() => {
		vi.spyOn(User.prototype, "GetInfo").mockImplementation(async function(this: User) {
			return this;
		});
		vi.spyOn(User.prototype, "GetGang").mockResolvedValue(null);
		vi.spyOn(UserBadge, "GetList").mockResolvedValue([]);
	});

	afterEach(() => vi.restoreAllMocks());

	it("sets a user's item quantity", async () => {
		const findItem = vi.spyOn(UserItemRepository, "FindByUserAndItem").mockResolvedValue(null);
		const createItem = vi.spyOn(UserItemRepository, "Create").mockResolvedValue(null as never);

		await expect(
			resolvers.Mutation.setItem(null, {
				userId: "target123",
				itemId: ItemId.Grenade,
				mode: "SET",
				hoursOrQuantity: 5,
			}, { user: moderator }),
		).resolves.toMatchObject({ success: true });

		expect(findItem).toHaveBeenCalledWith("target123", ItemId.Grenade);
		expect(createItem).toHaveBeenCalledWith({
			userId: "target123",
			itemId: ItemId.Grenade,
			quantity: 5,
			skin: BundleId.Default,
		});
	});

	it("adds a consumable quantity to an existing item", async () => {
		const existingItem = { quantity: 4, remainingTime: new Date() };
		vi.spyOn(UserItemRepository, "FindByUserAndItem").mockResolvedValue(existingItem as never);
		const updateItem = vi.spyOn(UserItemRepository, "UpdateDurationOrQuantity").mockResolvedValue();

		await expect(
			resolvers.Mutation.setItem(null, {
				userId: "target123",
				itemId: ItemId.Grenade,
				mode: "ADD",
				hoursOrQuantity: 3,
			}, { user: moderator }),
		).resolves.toMatchObject({ success: true });

		expect(updateItem).toHaveBeenCalledWith("target123", ItemId.Grenade, { quantity: 7 });
	});

	it("rejects fractional consumable quantities", async () => {
		const getInfo = vi.spyOn(User.prototype, "GetInfo");
		const findItem = vi.spyOn(UserItemRepository, "FindByUserAndItem");

		await expect(
			resolvers.Mutation.setItem(null, {
				userId: "target123",
				itemId: ItemId.Grenade,
				mode: "ADD",
				hoursOrQuantity: 1.5,
			}, { user: moderator }),
		).resolves.toEqual({
			success: false,
			message: "Consumable quantity must be a non-negative integer.",
			user: null,
		});

		expect(getInfo).not.toHaveBeenCalled();
		expect(findItem).not.toHaveBeenCalled();
	});

	it("adds special coins to a user", async () => {
		const addSpecialCoin = vi.spyOn(User.prototype, "AddSpecialCoin").mockResolvedValue();

		await expect(
			resolvers.Mutation.addSpecialCoins(null, { userId: "target123", amount: 12 }, { user: moderator }),
		).resolves.toMatchObject({ success: true });

		expect(addSpecialCoin).toHaveBeenCalledWith(12);
	});

	it("removes special coins when given a negative amount", async () => {
		const addSpecialCoin = vi.spyOn(User.prototype, "AddSpecialCoin").mockResolvedValue();

		await expect(
			resolvers.Mutation.addSpecialCoins(null, { userId: "target123", amount: -12 }, { user: moderator }),
		).resolves.toMatchObject({ success: true });

		expect(addSpecialCoin).toHaveBeenCalledWith(-12);
	});

	it("changes a user's class", async () => {
		const setClass = vi.spyOn(User.prototype, "SetClass").mockResolvedValue(true);

		await expect(
			resolvers.Mutation.setClass(null, { userId: "target123", classId: ClassId.Assassin }, { user: moderator }),
		).resolves.toMatchObject({ success: true });

		expect(setClass).toHaveBeenCalledWith(ClassId.Assassin);
	});

	it("changes a user's nickname", async () => {
		const setNickname = vi.spyOn(User.prototype, "SetNickname").mockResolvedValue(true);

		await expect(
			resolvers.Mutation.setNickname(null, { userId: "target123", nickname: "NewNickname" }, { user: moderator }),
		).resolves.toMatchObject({ success: true });

		expect(setNickname).toHaveBeenCalledWith("NewNickname");
	});

	it("adds VIP time to a user", async () => {
		const addVip = vi.spyOn(User.prototype, "AddVip").mockResolvedValue();

		await expect(
			resolvers.Mutation.setVip(null, { userId: "target123", days: 30 }, { user: moderator }),
		).resolves.toMatchObject({ success: true });

		expect(addVip).toHaveBeenCalledWith(30);
	});

	it("removes VIP time when given negative days", async () => {
		const addVip = vi.spyOn(User.prototype, "AddVip").mockResolvedValue();

		await expect(
			resolvers.Mutation.setVip(null, { userId: "target123", days: -30 }, { user: moderator }),
		).resolves.toMatchObject({ success: true });

		expect(addVip).toHaveBeenCalledWith(-30);
	});

	it("applies a timed death to a user", async () => {
		const deadUntil = new Date("2026-10-01T00:00:00.000Z");
		const kill = vi.spyOn(User.prototype, "Kill").mockResolvedValue(deadUntil);

		await expect(
			resolvers.Mutation.killUser(null, { userId: "target123", days: 2 }, { user: moderator }),
		).resolves.toMatchObject({ success: true, message: expect.stringContaining(deadUntil.toISOString()) });

		expect(kill).toHaveBeenCalledWith(2);
	});

	it("adds a badge to a user", async () => {
		const createBadge = vi.spyOn(UserBadge, "Create").mockResolvedValue(true);

		await expect(
			resolvers.Mutation.addBadge(null, { userId: "target123", badgeId: BadgeId.Helper }, { user: moderator }),
		).resolves.toMatchObject({ success: true });

		expect(createBadge).toHaveBeenCalledWith("target123", BadgeId.Helper);
	});

	it("removes a badge from a user", async () => {
		const deleteBadge = vi.spyOn(UserBadge, "Delete").mockResolvedValue(true);

		await expect(
			resolvers.Mutation.removeBadge(null, { userId: "target123", badgeId: BadgeId.Helper }, { user: moderator }),
		).resolves.toMatchObject({ success: true });

		expect(deleteBadge).toHaveBeenCalledWith("target123", BadgeId.Helper);
	});

	it("allows only Developers to swap users", async () => {
		const findById = vi.spyOn(UserRepository, "FindById");
		const swapUsers = vi.spyOn(UserRepository, "SwapUsers");

		await expect(
			resolvers.Mutation.swapUsers(null, {
				firstUserId: "first123",
				secondUserId: "second123",
			}, { user: moderator }),
		).rejects.toThrow("Forbidden: Developer access required.");

		expect(findById).not.toHaveBeenCalled();
		expect(swapUsers).not.toHaveBeenCalled();
	});

	it("swaps two existing users through the repository", async () => {
		const firstUser = { id: "first123", nickname: "First" };
		const secondUser = { id: "second123", nickname: "Second" };
		const findById = vi.spyOn(UserRepository, "FindById")
			.mockResolvedValueOnce(firstUser as never)
			.mockResolvedValueOnce(secondUser as never);
		const swapUsers = vi.spyOn(UserRepository, "SwapUsers").mockResolvedValue(["users", "items"]);

		await expect(
			resolvers.Mutation.swapUsers(null, {
				firstUserId: firstUser.id,
				secondUserId: secondUser.id,
			}, { user: developer }),
		).resolves.toMatchObject({
			success: true,
			message: expect.stringContaining("First and Second"),
		});

		expect(findById).toHaveBeenCalledTimes(2);
		expect(swapUsers).toHaveBeenCalledWith(firstUser.id, secondUser.id, expect.stringMatching(/^TEMP_[a-f0-9]{12}$/));
	});

	it("rejects swapping a user with itself", async () => {
		const findById = vi.spyOn(UserRepository, "FindById");
		const swapUsers = vi.spyOn(UserRepository, "SwapUsers");

		await expect(
			resolvers.Mutation.swapUsers(null, {
				firstUserId: "same123",
				secondUserId: "same123",
			}, { user: developer }),
		).resolves.toMatchObject({ success: false, message: "Choose two different users." });

		expect(findById).not.toHaveBeenCalled();
		expect(swapUsers).not.toHaveBeenCalled();
	});
});
