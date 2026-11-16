import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { unlink } from "node:fs/promises";
import { sequelize } from "#core/database/Database";
import { Users } from "#core/database/Users";
import { UserItems } from "#core/database/UserItems";
import Gangs from "#core/database/Gangs";
import { UserRepository } from "#core/repositories/UserRepository";
import { SeasonRepository } from "#core/repositories/SeasonRepository";
import { BundleId, ItemId } from "#core/types/Ids";
import { ClassId } from "#core/types/Classes";

const { storage } = vi.hoisted(() => ({ storage: { path: "" } }));

vi.mock("#core/database/Database", async () => {
	const { Sequelize } = await import("sequelize");
	const { tmpdir } = await import("node:os");
	const { join } = await import("node:path");
	const { randomUUID } = await import("node:crypto");
	storage.path = join(tmpdir(), `cross-roads-rankings-${randomUUID()}.sqlite`);
	return {
		sequelize: new Sequelize({
			dialect: "sqlite",
			storage: storage.path,
			logging: false,
		}),
	};
});

beforeEach(async () => {
	for (const model of [Users, UserItems, Gangs]) {
		await model.sync({ force: true });
	}

	const now = new Date();
	await sequelize.getQueryInterface().bulkInsert(Users.getTableName(), [
		{
			id: "recent",
			nickname: "Recently Active",
			money: 1_000,
			class: ClassId.Entrepreneur,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: "inactive",
			nickname: "Inactive",
			money: 5_000,
			class: ClassId.Entrepreneur,
			createdAt: now,
			updatedAt: now,
		},
	]);
	await UserItems.bulkCreate([
		{
			userId: "recent",
			itemId: ItemId.Knife,
			remainingTime: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
			skin: BundleId.Default,
		},
		{
			userId: "inactive",
			itemId: ItemId.Knife,
			remainingTime: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
			skin: BundleId.Default,
		},
		{
			userId: "inactive",
			itemId: ItemId.Grenade,
			remainingTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
			quantity: 1,
			skin: BundleId.Default,
		},
	]);
});

afterAll(async () => {
	await sequelize.close();
	await unlink(storage.path);
});

describe("User rankings", () => {
	it("excludes inactive users before pagination and from the total", async () => {
		const users = await UserRepository.FindTopUsers("money", 1, 0);

		expect(users.map(user => user.id)).toEqual(["recent"]);
		await expect(UserRepository.CountTopUsers("money")).resolves.toBe(1);
	});

	it("excludes inactive users from end-of-season rankings", async () => {
		const [topMoney] = await SeasonRepository.GetEndSeasonRankingData();

		expect(topMoney.map(user => user.id)).toEqual(["recent"]);
	});
});
