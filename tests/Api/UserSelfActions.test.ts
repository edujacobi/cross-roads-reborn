import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resolvers } from "#api/graphql/resolvers";
import type { AuthUser } from "#api/types";
import { SituationId, User } from "#core/models/User";
import { UserRepository } from "#core/repositories/UserRepository";
import { ClassId } from "#core/types/Classes";

const player: AuthUser = {
	userId: "123456",
	username: "Player",
	avatar: null,
	role: "PLAYER",
	situationId: SituationId.Idling,
	gangId: 1,
};

describe("Player self-service actions", () => {
	beforeEach(() => {
		vi.spyOn(User.prototype, "GetInfo").mockImplementation(async function(this: User) {
			return this;
		});
	});

	afterEach(() => vi.restoreAllMocks());

	it("claims the daily reward only for the authenticated player", async () => {
		const receiveDaily = vi.spyOn(User.prototype, "ReceiveDaily").mockResolvedValue({
			money: 300,
			bonusItems: [],
		});
		vi.spyOn(User.prototype, "CanReceiveDaily").mockReturnValue(true);

		await expect(
			resolvers.Mutation.claimDailyReward(null, {}, { user: player }),
		).resolves.toMatchObject({ success: true, message: expect.stringContaining("Cr$ 300") });
		expect(receiveDaily).toHaveBeenCalledWith({ isBooster: false });
	});

	it("does not claim the daily reward during cooldown", async () => {
		const receiveDaily = vi.spyOn(User.prototype, "ReceiveDaily");
		vi.spyOn(User.prototype, "CanReceiveDaily").mockReturnValue(false);

		await expect(
			resolvers.Mutation.claimDailyReward(null, {}, { user: player }),
		).resolves.toMatchObject({ success: false });
		expect(receiveDaily).not.toHaveBeenCalled();
	});

	it("charges the authenticated player's nickname change cost", async () => {
		const search = vi.spyOn(UserRepository, "SearchByNameOrId").mockResolvedValue(null);
		const setNickname = vi.spyOn(User.prototype, "SetNickname").mockResolvedValue(true);
		vi.spyOn(User.prototype, "GetNicknameChangeCost").mockReturnValue(75_000);
		vi.spyOn(User.prototype, "GetInfo").mockImplementation(async function(this: User) {
			this.Nickname = "Old Name";
			this.Money = 100_000;
			return this;
		});

		await expect(
			resolvers.Mutation.changeOwnNickname(null, { nickname: "New Name" }, { user: player }),
		).resolves.toMatchObject({ success: true });
		expect(search).toHaveBeenCalledWith("New Name");
		expect(setNickname).toHaveBeenCalledWith("New Name", 75_000);
	});

	it("rejects invalid nicknames before loading or changing the player", async () => {
		const getInfo = vi.spyOn(User.prototype, "GetInfo");

		await expect(
			resolvers.Mutation.changeOwnNickname(null, { nickname: "Invalid  Name!" }, { user: player }),
		).resolves.toMatchObject({ success: false });
		expect(getInfo).not.toHaveBeenCalled();
	});

	it("allows only the classes available through the setclass command", async () => {
		const setClass = vi.spyOn(User.prototype, "SetClass").mockResolvedValue(true);
		vi.spyOn(User.prototype, "GetClassChangeCost").mockReturnValue(50_000);
		vi.spyOn(User.prototype, "GetInfo").mockImplementation(async function(this: User) {
			this.Money = 100_000;
			this.Class = ClassId.None;
			return this;
		});

		await expect(
			resolvers.Mutation.changeOwnClass(null, { classId: ClassId.Thief }, { user: player }),
		).resolves.toMatchObject({ success: true });
		expect(setClass).toHaveBeenCalledWith(ClassId.Thief, 50_000);

		const getInfo = vi.spyOn(User.prototype, "GetInfo");
		getInfo.mockClear();
		await expect(
			resolvers.Mutation.changeOwnClass(null, { classId: ClassId.Assassin }, { user: player }),
		).resolves.toMatchObject({ success: false });
		expect(getInfo).not.toHaveBeenCalled();
	});

	it("rejects self-service mutations when unauthenticated", async () => {
		await expect(
			resolvers.Mutation.changeOwnClass(null, { classId: ClassId.Thief }, { user: null }),
		).rejects.toThrow("Authentication required to perform this action.");
	});
});
