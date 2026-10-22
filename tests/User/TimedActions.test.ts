import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { unlink } from "node:fs/promises";
import { sequelize } from "#core/database/Database";
import { Users } from "#core/database/Users";
import { UserItems } from "#core/database/UserItems";
import { TimedActions } from "#core/database/TimedActions";
import { RobHistories } from "#core/database/RobHistories";
import { Notifications } from "#core/database/Notifications";
import { TimedActionRepository } from "#core/repositories/TimedActionRepository";
import { UserRepository } from "#core/repositories/UserRepository";
import { UserItemRepository } from "#core/repositories/UserItemRepository";
import { User } from "#core/models/User";
import { TimedAction } from "#core/models/TimedAction";
import { Scavenge } from "#core/models/Scavenge";
import { Event } from "#core/models/Event";
import { Language } from "#core/models/Language";
import { ClassId } from "#core/types/Classes";
import { BundleId, ItemId, LocationId, ScavengeId } from "#core/types/Ids";
import { LocationRobberyStrategy } from "#core/models/strategies/robbery/LocationRobberyStrategy";

const { storage } = vi.hoisted(() => ({ storage: { path: "" } }));

vi.mock("#core/database/Database", async () => {
	const { Sequelize } = await import("sequelize");
	const { tmpdir } = await import("node:os");
	const { join } = await import("node:path");
	const { randomUUID } = await import("node:crypto");
	storage.path = join(tmpdir(), `cross-roads-actions-${randomUUID()}.sqlite`);
	return {
		sequelize: new Sequelize({
			dialect: "sqlite", storage: storage.path, logging: false,
		}),
	};
});

beforeEach(async () => {
	vi.restoreAllMocks();
	for (const model of [Users, UserItems, TimedActions, RobHistories, Notifications]) await model.sync({ force: true });
	const now = new Date();
	await sequelize.getQueryInterface().bulkInsert(Users.getTableName(), [{
		id: "player", money: 1_000, class: ClassId.Entrepreneur,
		scavengingId: null, robbingLocationId: null, createdAt: now, updatedAt: now,
	}]);
	vi.spyOn(Event, "GetActiveFromType").mockResolvedValue(1);
	vi.spyOn(Event, "GetActiveBonusFromType").mockResolvedValue(0);
	vi.spyOn(User.prototype, "GetInfo").mockImplementation(async function(this: User) {
		const row = await UserRepository.FindById(this.Id);
		if (!row) return null;
		this.Money = row.money;
		this.Class = row.class;
		this.Prison.Time = row.prisonTime ?? new Date(0);
		this.Prison.Count = row.prisonCount;
		this.Robbery.FailureCount = row.robberyFailureCount;
		this.Robbery.SuccessCount = row.robberySuccessCount;
		this.Robbery.SuccessRobbedSum = row.robberySuccessRobbedSum;
		this.Robbery.IsRobbingLocationId = row.robbingLocationId;
		this.Scavenge.IsScavengingId = row.scavengingId;
		this.Scavenge.Count = row.scavengeCount;
		this.Scavenge.Time = row.scavengeTime ?? new Date(0);
		this.Scavenge.Found.Total = row.scavengeFoundTotal;
		this.Scavenge.Found.MoneyCount = row.scavengeMoneyCount;
		this.Scavenge.Found.MoneySum = row.scavengeMoneySum;
		this.Scavenge.Found.Items = row.scavengeFoundItems;
		this.Scavenge.Found.Failures = row.scavengeFailures;
		return this;
	});
});

afterEach(() => {
	TimedAction.Stop();
	vi.restoreAllMocks();
});

afterAll(async () => {
	await sequelize.close();
	await unlink(storage.path);
});

async function start(kind: "scavenge" | "robbery") {
	await TimedActionRepository.Start("player", kind, 0, -1);
}

describe("Durable action persistence", () => {
	it("keeps the active marker visible until rewards and result commit together", async () => {
		await start("scavenge");
		let release!: () => void;
		let staged!: () => void;
		const stagedPromise = new Promise<void>(resolve => {
			staged = resolve;
		});
		const releasePromise = new Promise<void>(resolve => {
			release = resolve;
		});
		const completion = TimedActionRepository.Run("player", "scavenge", 0, async () => {
			await UserRepository.Update("player", { money: 1_100 });
			staged();
			await releasePromise;
			return { success: true };
		});
		await stagedPromise;
		try {
			expect((await UserRepository.FindById("player"))?.scavengingId).toBe(0);
			expect((await UserRepository.FindById("player"))?.money).toBe(1_000);
			expect((await TimedAction.GetStatus("player", "scavenge"))?.result).toBeNull();
		}
		finally {
			release();
			await completion;
		}
		expect((await UserRepository.FindById("player"))?.scavengingId).toBeNull();
		expect((await UserRepository.FindById("player"))?.money).toBe(1_100);
		expect((await TimedAction.GetStatus("player", "scavenge"))?.result).not.toBeNull();
	});

	it("rolls back item rewards and keeps the action pending when saving the result fails", async () => {
		await start("scavenge");
		vi.spyOn(TimedActions.prototype, "update").mockRejectedValueOnce(new Error("result write failed"));
		await expect(TimedActionRepository.Run("player", "scavenge", 0, async () => {
			await UserItemRepository.Upsert({ userId: "player", itemId: ItemId.Knife, quantity: 1, skin: BundleId.Default });
			await UserRepository.Update("player", { scavengeCount: 1 });
			return { success: true };
		})).rejects.toThrow("result write failed");
		expect(await UserItems.count()).toBe(0);
		expect((await UserRepository.FindById("player"))?.scavengeCount).toBe(0);
		expect((await UserRepository.FindById("player"))?.scavengingId).toBe(0);
		expect((await TimedAction.GetStatus("player", "scavenge"))?.result).toBeNull();
	});

	it.each(["scavenge", "robbery"] as const)("commits %s only once across concurrent database transactions", async kind => {
		await start(kind);
		const resolve = vi.fn(async () => {
			const user = await UserRepository.FindById("player");
			await UserRepository.Update("player", { money: user!.money + 100 });
			return { success: true, amount: 100 };
		});
		const results = await Promise.all([
			TimedActionRepository.Run("player", kind, 0, resolve),
			TimedActionRepository.Run("player", kind, 0, resolve),
		]);
		expect(resolve).toHaveBeenCalledOnce();
		expect(results[0]).toEqual(results[1]);
		expect((await UserRepository.FindById("player"))?.money).toBe(1_100);
	});

	it("does not restart an existing deadline on reconnection or duplicate start", async () => {
		await TimedActionRepository.Start("player", "robbery", 0, 60_000);
		const initial = await TimedAction.GetStatus("player", "robbery");
		await expect(TimedActionRepository.Start("player", "robbery", 0, 60_000)).rejects.toThrow("another action");
		await expect(TimedActionRepository.Run("player", "robbery", 0, async () => true)).rejects.toThrow("not due");
		expect(await TimedAction.GetStatus("player", "robbery")).toEqual(initial);
	});

	it("recovers legacy active markers without replacing already persisted attempts", async () => {
		await UserRepository.Update("player", { scavengingId: ScavengeId.Dump });
		await TimedActionRepository.AdoptLegacyActions();
		const initial = await TimedAction.GetStatus("player", "scavenge");
		await TimedActionRepository.AdoptLegacyActions();
		expect(initial?.referenceId).toBe(ScavengeId.Dump);
		expect(await TimedAction.GetStatus("player", "scavenge")).toEqual(initial);
	});

	it("does not let a delayed caller resolve a newer attempt at the same location", async () => {
		const originalId = await TimedActionRepository.Start("player", "robbery", 0, -1);
		await TimedActionRepository.Run("player", "robbery", 0, async () => ({ success: true }), originalId);
		await start("robbery");
		const resolve = vi.fn(async () => ({ success: false }));

		await expect(TimedActionRepository.Run("player", "robbery", 0, resolve, originalId)).rejects.toThrow("Missing");
		expect(resolve).not.toHaveBeenCalled();
		expect((await TimedAction.GetStatus("player", "robbery"))?.result).toBeNull();
	});

	it("respects cancelled active markers instead of retrying them forever", async () => {
		await start("scavenge");
		await UserRepository.Update("player", { scavengingId: null });
		await TimedAction.ProcessPending();
		expect(await TimedAction.GetStatus("player", "scavenge")).toBeNull();
		expect((await UserRepository.FindById("player"))?.scavengeCount).toBe(0);
	});
});

describe("Recovered action outcomes", () => {
	it("finishes scavenge without any SSE subscriber and replays its result", async () => {
		await start("scavenge");
		vi.spyOn(Math, "random").mockReturnValue(0);
		await TimedAction.Initialize();
		const row = await UserRepository.FindById("player");
		expect(row?.scavengingId).toBeNull();
		expect(row?.scavengeCount).toBe(1);
		expect(row?.money).toBeGreaterThan(1_000);
		const status = await TimedAction.GetStatus("player", "scavenge");
		const user = new User("player", Language.English);
		const replay = await new Scavenge(user, ScavengeId.Dump).EndScavenge();
		expect(replay).toEqual(TimedAction.DecodeScavengeResult(status!.result!));
		expect(user.Money).toBe(row?.money);
		expect(user.Scavenge.IsScavengingId).toBeNull();
		expect((await UserRepository.FindById("player"))?.scavengeCount).toBe(1);
	});

	it("retries scavenge save failures without losing the active marker or doubling rewards", async () => {
		await start("scavenge");
		vi.spyOn(Math, "random").mockReturnValue(0);
		const update = vi.spyOn(UserRepository, "Update").mockRejectedValueOnce(new Error("SQLITE_BUSY"));
		await TimedAction.ProcessPending();
		expect((await UserRepository.FindById("player"))?.scavengingId).toBe(0);
		expect((await UserRepository.FindById("player"))?.money).toBe(1_000);
		expect((await TimedAction.GetStatus("player", "scavenge"))?.result).toBeNull();
		update.mockRestore();
		await TimedAction.ProcessPending();
		expect((await UserRepository.FindById("player"))?.money).toBe(1_100);
		expect((await UserRepository.FindById("player"))?.scavengeCount).toBe(1);
		expect((await UserRepository.FindById("player"))?.scavengingId).toBeNull();
	});

	it.each([0, 0.999])("retries robbery after a failed save without losing its outcome (random: %s)", async random => {
		await start("robbery");
		vi.spyOn(Math, "random").mockReturnValue(random);
		const update = vi.spyOn(UserRepository, "Update").mockRejectedValueOnce(new Error("SQLITE_BUSY"));
		await TimedAction.ProcessPending();
		expect((await UserRepository.FindById("player"))?.robbingLocationId).toBe(0);
		expect((await TimedAction.GetStatus("player", "robbery"))?.result).toBeNull();
		update.mockRestore();
		await TimedAction.ProcessPending();
		const row = await UserRepository.FindById("player");
		expect(row?.robbingLocationId).toBeNull();
		expect(await RobHistories.count()).toBe(1);
		if (random === 0) expect(row?.money).toBeGreaterThan(1_000);
		else expect(row?.prisonTime!.getTime()).toBeGreaterThan(Date.now());
		expect((await TimedAction.GetStatus("player", "robbery"))?.result).not.toBeNull();
	});

	it("preserves pending robbery when the Discord interaction releases its locks", async () => {
		await start("robbery");
		await new LocationRobberyStrategy(new User("player"), LocationId.SmallBank).ReleaseLocks();
		expect((await UserRepository.FindById("player"))?.robbingLocationId).toBe(0);
	});
});
