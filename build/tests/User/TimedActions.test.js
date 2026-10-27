"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const promises_1 = require("node:fs/promises");
const Database_1 = require("#core/database/Database");
const Users_1 = require("#core/database/Users");
const UserItems_1 = require("#core/database/UserItems");
const TimedActions_1 = require("#core/database/TimedActions");
const RobHistories_1 = require("#core/database/RobHistories");
const Notifications_1 = require("#core/database/Notifications");
const TimedActionRepository_1 = require("#core/repositories/TimedActionRepository");
const UserRepository_1 = require("#core/repositories/UserRepository");
const UserItemRepository_1 = require("#core/repositories/UserItemRepository");
const User_1 = require("#core/models/User");
const TimedAction_1 = require("#core/models/TimedAction");
const Scavenge_1 = require("#core/models/Scavenge");
const Event_1 = require("#core/models/Event");
const Language_1 = require("#core/models/Language");
const Classes_1 = require("#core/types/Classes");
const Ids_1 = require("#core/types/Ids");
const LocationRobberyStrategy_1 = require("#core/models/strategies/robbery/LocationRobberyStrategy");
const { storage } = vitest_1.vi.hoisted(() => ({ storage: { path: "" } }));
vitest_1.vi.mock("#core/database/Database", async () => {
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
(0, vitest_1.beforeEach)(async () => {
    vitest_1.vi.restoreAllMocks();
    for (const model of [Users_1.Users, UserItems_1.UserItems, TimedActions_1.TimedActions, RobHistories_1.RobHistories, Notifications_1.Notifications])
        await model.sync({ force: true });
    const now = new Date();
    await Database_1.sequelize.getQueryInterface().bulkInsert(Users_1.Users.getTableName(), [{
            id: "player", money: 1_000, class: Classes_1.ClassId.Entrepreneur,
            scavengingId: null, robbingLocationId: null, createdAt: now, updatedAt: now,
        }]);
    vitest_1.vi.spyOn(Event_1.Event, "GetActiveFromType").mockResolvedValue(1);
    vitest_1.vi.spyOn(Event_1.Event, "GetActiveBonusFromType").mockResolvedValue(0);
    vitest_1.vi.spyOn(User_1.User.prototype, "GetInfo").mockImplementation(async function () {
        const row = await UserRepository_1.UserRepository.FindById(this.Id);
        if (!row)
            return null;
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
(0, vitest_1.afterEach)(() => {
    TimedAction_1.TimedAction.Stop();
    vitest_1.vi.restoreAllMocks();
});
(0, vitest_1.afterAll)(async () => {
    await Database_1.sequelize.close();
    await (0, promises_1.unlink)(storage.path);
});
async function start(kind) {
    await TimedActionRepository_1.TimedActionRepository.Start("player", kind, 0, -1);
}
(0, vitest_1.describe)("Durable action persistence", () => {
    (0, vitest_1.it)("keeps the active marker visible until rewards and result commit together", async () => {
        await start("scavenge");
        let release;
        let staged;
        const stagedPromise = new Promise(resolve => {
            staged = resolve;
        });
        const releasePromise = new Promise(resolve => {
            release = resolve;
        });
        const completion = TimedActionRepository_1.TimedActionRepository.Run("player", "scavenge", 0, async () => {
            await UserRepository_1.UserRepository.Update("player", { money: 1_100 });
            staged();
            await releasePromise;
            return { success: true };
        });
        await stagedPromise;
        try {
            (0, vitest_1.expect)((await UserRepository_1.UserRepository.FindById("player"))?.scavengingId).toBe(0);
            (0, vitest_1.expect)((await UserRepository_1.UserRepository.FindById("player"))?.money).toBe(1_000);
            (0, vitest_1.expect)((await TimedAction_1.TimedAction.GetStatus("player", "scavenge"))?.result).toBeNull();
        }
        finally {
            release();
            await completion;
        }
        (0, vitest_1.expect)((await UserRepository_1.UserRepository.FindById("player"))?.scavengingId).toBeNull();
        (0, vitest_1.expect)((await UserRepository_1.UserRepository.FindById("player"))?.money).toBe(1_100);
        (0, vitest_1.expect)((await TimedAction_1.TimedAction.GetStatus("player", "scavenge"))?.result).not.toBeNull();
    });
    (0, vitest_1.it)("rolls back item rewards and keeps the action pending when saving the result fails", async () => {
        await start("scavenge");
        vitest_1.vi.spyOn(TimedActions_1.TimedActions.prototype, "update").mockRejectedValueOnce(new Error("result write failed"));
        await (0, vitest_1.expect)(TimedActionRepository_1.TimedActionRepository.Run("player", "scavenge", 0, async () => {
            await UserItemRepository_1.UserItemRepository.Upsert({ userId: "player", itemId: Ids_1.ItemId.Knife, quantity: 1, skin: Ids_1.BundleId.Default });
            await UserRepository_1.UserRepository.Update("player", { scavengeCount: 1 });
            return { success: true };
        })).rejects.toThrow("result write failed");
        (0, vitest_1.expect)(await UserItems_1.UserItems.count()).toBe(0);
        (0, vitest_1.expect)((await UserRepository_1.UserRepository.FindById("player"))?.scavengeCount).toBe(0);
        (0, vitest_1.expect)((await UserRepository_1.UserRepository.FindById("player"))?.scavengingId).toBe(0);
        (0, vitest_1.expect)((await TimedAction_1.TimedAction.GetStatus("player", "scavenge"))?.result).toBeNull();
    });
    vitest_1.it.each(["scavenge", "robbery"])("commits %s only once across concurrent database transactions", async (kind) => {
        await start(kind);
        const resolve = vitest_1.vi.fn(async () => {
            const user = await UserRepository_1.UserRepository.FindById("player");
            await UserRepository_1.UserRepository.Update("player", { money: user.money + 100 });
            return { success: true, amount: 100 };
        });
        const results = await Promise.all([
            TimedActionRepository_1.TimedActionRepository.Run("player", kind, 0, resolve),
            TimedActionRepository_1.TimedActionRepository.Run("player", kind, 0, resolve),
        ]);
        (0, vitest_1.expect)(resolve).toHaveBeenCalledOnce();
        (0, vitest_1.expect)(results[0]).toEqual(results[1]);
        (0, vitest_1.expect)((await UserRepository_1.UserRepository.FindById("player"))?.money).toBe(1_100);
    });
    (0, vitest_1.it)("does not restart an existing deadline on reconnection or duplicate start", async () => {
        await TimedActionRepository_1.TimedActionRepository.Start("player", "robbery", 0, 60_000);
        const initial = await TimedAction_1.TimedAction.GetStatus("player", "robbery");
        await (0, vitest_1.expect)(TimedActionRepository_1.TimedActionRepository.Start("player", "robbery", 0, 60_000)).rejects.toThrow("another action");
        await (0, vitest_1.expect)(TimedActionRepository_1.TimedActionRepository.Run("player", "robbery", 0, async () => true)).rejects.toThrow("not due");
        (0, vitest_1.expect)(await TimedAction_1.TimedAction.GetStatus("player", "robbery")).toEqual(initial);
    });
    (0, vitest_1.it)("recovers legacy active markers without replacing already persisted attempts", async () => {
        await UserRepository_1.UserRepository.Update("player", { scavengingId: Ids_1.ScavengeId.Dump });
        await TimedActionRepository_1.TimedActionRepository.AdoptLegacyActions();
        const initial = await TimedAction_1.TimedAction.GetStatus("player", "scavenge");
        await TimedActionRepository_1.TimedActionRepository.AdoptLegacyActions();
        (0, vitest_1.expect)(initial?.referenceId).toBe(Ids_1.ScavengeId.Dump);
        (0, vitest_1.expect)(await TimedAction_1.TimedAction.GetStatus("player", "scavenge")).toEqual(initial);
    });
    (0, vitest_1.it)("does not let a delayed caller resolve a newer attempt at the same location", async () => {
        const originalId = await TimedActionRepository_1.TimedActionRepository.Start("player", "robbery", 0, -1);
        await TimedActionRepository_1.TimedActionRepository.Run("player", "robbery", 0, async () => ({ success: true }), originalId);
        await start("robbery");
        const resolve = vitest_1.vi.fn(async () => ({ success: false }));
        await (0, vitest_1.expect)(TimedActionRepository_1.TimedActionRepository.Run("player", "robbery", 0, resolve, originalId)).rejects.toThrow("Missing");
        (0, vitest_1.expect)(resolve).not.toHaveBeenCalled();
        (0, vitest_1.expect)((await TimedAction_1.TimedAction.GetStatus("player", "robbery"))?.result).toBeNull();
    });
    (0, vitest_1.it)("respects cancelled active markers instead of retrying them forever", async () => {
        await start("scavenge");
        await UserRepository_1.UserRepository.Update("player", { scavengingId: null });
        await TimedAction_1.TimedAction.ProcessPending();
        (0, vitest_1.expect)(await TimedAction_1.TimedAction.GetStatus("player", "scavenge")).toBeNull();
        (0, vitest_1.expect)((await UserRepository_1.UserRepository.FindById("player"))?.scavengeCount).toBe(0);
    });
});
(0, vitest_1.describe)("Recovered action outcomes", () => {
    (0, vitest_1.it)("finishes scavenge without any SSE subscriber and replays its result", async () => {
        await start("scavenge");
        vitest_1.vi.spyOn(Math, "random").mockReturnValue(0);
        await TimedAction_1.TimedAction.Initialize();
        const row = await UserRepository_1.UserRepository.FindById("player");
        (0, vitest_1.expect)(row?.scavengingId).toBeNull();
        (0, vitest_1.expect)(row?.scavengeCount).toBe(1);
        (0, vitest_1.expect)(row?.money).toBeGreaterThan(1_000);
        const status = await TimedAction_1.TimedAction.GetStatus("player", "scavenge");
        const user = new User_1.User("player", Language_1.Language.English);
        const replay = await new Scavenge_1.Scavenge(user, Ids_1.ScavengeId.Dump).EndScavenge();
        (0, vitest_1.expect)(replay).toEqual(TimedAction_1.TimedAction.DecodeScavengeResult(status.result));
        (0, vitest_1.expect)(user.Money).toBe(row?.money);
        (0, vitest_1.expect)(user.Scavenge.IsScavengingId).toBeNull();
        (0, vitest_1.expect)((await UserRepository_1.UserRepository.FindById("player"))?.scavengeCount).toBe(1);
    });
    (0, vitest_1.it)("retries scavenge save failures without losing the active marker or doubling rewards", async () => {
        await start("scavenge");
        vitest_1.vi.spyOn(Math, "random").mockReturnValue(0);
        const update = vitest_1.vi.spyOn(UserRepository_1.UserRepository, "Update").mockRejectedValueOnce(new Error("SQLITE_BUSY"));
        await TimedAction_1.TimedAction.ProcessPending();
        (0, vitest_1.expect)((await UserRepository_1.UserRepository.FindById("player"))?.scavengingId).toBe(0);
        (0, vitest_1.expect)((await UserRepository_1.UserRepository.FindById("player"))?.money).toBe(1_000);
        (0, vitest_1.expect)((await TimedAction_1.TimedAction.GetStatus("player", "scavenge"))?.result).toBeNull();
        update.mockRestore();
        await TimedAction_1.TimedAction.ProcessPending();
        (0, vitest_1.expect)((await UserRepository_1.UserRepository.FindById("player"))?.money).toBe(1_100);
        (0, vitest_1.expect)((await UserRepository_1.UserRepository.FindById("player"))?.scavengeCount).toBe(1);
        (0, vitest_1.expect)((await UserRepository_1.UserRepository.FindById("player"))?.scavengingId).toBeNull();
    });
    vitest_1.it.each([0, 0.999])("retries robbery after a failed save without losing its outcome (random: %s)", async (random) => {
        await start("robbery");
        vitest_1.vi.spyOn(Math, "random").mockReturnValue(random);
        const update = vitest_1.vi.spyOn(UserRepository_1.UserRepository, "Update").mockRejectedValueOnce(new Error("SQLITE_BUSY"));
        await TimedAction_1.TimedAction.ProcessPending();
        (0, vitest_1.expect)((await UserRepository_1.UserRepository.FindById("player"))?.robbingLocationId).toBe(0);
        (0, vitest_1.expect)((await TimedAction_1.TimedAction.GetStatus("player", "robbery"))?.result).toBeNull();
        update.mockRestore();
        await TimedAction_1.TimedAction.ProcessPending();
        const row = await UserRepository_1.UserRepository.FindById("player");
        (0, vitest_1.expect)(row?.robbingLocationId).toBeNull();
        (0, vitest_1.expect)(await RobHistories_1.RobHistories.count()).toBe(1);
        if (random === 0)
            (0, vitest_1.expect)(row?.money).toBeGreaterThan(1_000);
        else
            (0, vitest_1.expect)(row?.prisonTime.getTime()).toBeGreaterThan(Date.now());
        (0, vitest_1.expect)((await TimedAction_1.TimedAction.GetStatus("player", "robbery"))?.result).not.toBeNull();
    });
    (0, vitest_1.it)("preserves pending robbery when the Discord interaction releases its locks", async () => {
        await start("robbery");
        await new LocationRobberyStrategy_1.LocationRobberyStrategy(new User_1.User("player"), Ids_1.LocationId.SmallBank).ReleaseLocks();
        (0, vitest_1.expect)((await UserRepository_1.UserRepository.FindById("player"))?.robbingLocationId).toBe(0);
    });
});
//# sourceMappingURL=TimedActions.test.js.map