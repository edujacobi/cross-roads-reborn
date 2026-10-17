import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { addDays } from "date-fns";
import { sequelize } from "#core/database/Database";
import { Users } from "#core/database/Users";
import { UserRepository } from "#core/repositories/UserRepository";
import { AvatarDecorationId } from "#core/types/Ids";

vi.mock("#core/database/Database", async () => {
	const { Sequelize } = await import("sequelize");
	return { sequelize: new Sequelize({ dialect: "sqlite", storage: ":memory:", logging: false }) };
});

describe("VIP gift persistence", () => {
	beforeEach(async () => {
		vi.restoreAllMocks();
		await Users.sync({ force: true });
		const now = new Date();
		await sequelize.getQueryInterface().bulkInsert(Users.getTableName(), [
			{ id: "giver", specialCoin: 1_190, createdAt: now, updatedAt: now },
			{ id: "recipient", specialCoin: 0, createdAt: now, updatedAt: now },
		]);
	});

	afterAll(async () => {
		await sequelize.close();
	});

	it("charges the giver and extends existing VIP without replacing a custom decoration", async () => {
		const vipTime = addDays(new Date(), 10);
		await UserRepository.Update("recipient", { vipTime, avatarDecoration: AvatarDecorationId.Purple });

		await expect(UserRepository.GiftVipForDays("giver", "recipient", 7, 1_190)).resolves.toBe(true);
		const giver = await UserRepository.FindById("giver");
		const receiver = await UserRepository.FindById("recipient");
		expect(giver?.specialCoin).toBe(0);
		expect(giver?.vipTime).toBeNull();
		expect(receiver?.specialCoin).toBe(0);
		expect(receiver?.vipTime).toEqual(addDays(vipTime, 7));
		expect(receiver?.avatarDecoration).toBe(AvatarDecorationId.Purple);

		await expect(UserRepository.GiftVipForDays("giver", "recipient", 7, 1_190)).resolves.toBe(false);
		expect((await UserRepository.FindById("recipient"))?.vipTime).toEqual(addDays(vipTime, 7));
	});

	it("starts VIP from now when expired and grants the default VIP decoration", async () => {
		await UserRepository.Update("recipient", { vipTime: addDays(new Date(), -10) });
		const before = addDays(new Date(), 7);
		await UserRepository.GiftVipForDays("giver", "recipient", 7, 1_190);
		const receiver = await UserRepository.FindById("recipient");
		expect(receiver?.vipTime?.getTime()).toBeGreaterThanOrEqual(before.getTime());
		expect(receiver?.vipTime?.getTime()).toBeLessThanOrEqual(addDays(new Date(), 7).getTime());
		expect(receiver?.avatarDecoration).toBe(AvatarDecorationId.VIP);
	});

	it("does not charge for a missing or eternal VIP recipient", async () => {
		await expect(UserRepository.GiftVipForDays("giver", "missing", 7, 1_190)).resolves.toBe(false);
		await UserRepository.Update("recipient", { vipEternal: true });
		await expect(UserRepository.GiftVipForDays("giver", "recipient", 7, 1_190)).resolves.toBe(false);
		expect((await UserRepository.FindById("giver"))?.specialCoin).toBe(1_190);
	});

	it("rolls back the charge if granting VIP fails", async () => {
		vi.spyOn(Users.prototype, "update").mockRejectedValueOnce(new Error("VIP update failed"));
		await expect(UserRepository.GiftVipForDays("giver", "recipient", 7, 1_190)).rejects.toThrow("VIP update failed");
		expect((await UserRepository.FindById("giver"))?.specialCoin).toBe(1_190);
		expect((await UserRepository.FindById("recipient"))?.vipTime).toBeNull();
	});
});
