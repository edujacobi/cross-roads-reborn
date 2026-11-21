"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const promises_1 = require("node:fs/promises");
const Database_1 = require("#core/database/Database");
const Users_1 = require("#core/database/Users");
const UserItems_1 = require("#core/database/UserItems");
const Gangs_1 = __importDefault(require("#core/database/Gangs"));
const UserRepository_1 = require("#core/repositories/UserRepository");
const SeasonRepository_1 = require("#core/repositories/SeasonRepository");
const Ids_1 = require("#core/types/Ids");
const Classes_1 = require("#core/types/Classes");
const { storage } = vitest_1.vi.hoisted(() => ({ storage: { path: "" } }));
vitest_1.vi.mock("#core/database/Database", async () => {
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
(0, vitest_1.beforeEach)(async () => {
    for (const model of [Users_1.Users, UserItems_1.UserItems, Gangs_1.default]) {
        await model.sync({ force: true });
    }
    const now = new Date();
    await Database_1.sequelize.getQueryInterface().bulkInsert(Users_1.Users.getTableName(), [
        {
            id: "recent",
            nickname: "Recently Active",
            money: 1_000,
            class: Classes_1.ClassId.Entrepreneur,
            createdAt: now,
            updatedAt: now,
        },
        {
            id: "inactive",
            nickname: "Inactive",
            money: 5_000,
            class: Classes_1.ClassId.Entrepreneur,
            createdAt: now,
            updatedAt: now,
        },
    ]);
    await UserItems_1.UserItems.bulkCreate([
        {
            userId: "recent",
            itemId: Ids_1.ItemId.Knife,
            remainingTime: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
            skin: Ids_1.BundleId.Default,
        },
        {
            userId: "inactive",
            itemId: Ids_1.ItemId.Knife,
            remainingTime: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
            skin: Ids_1.BundleId.Default,
        },
        {
            userId: "inactive",
            itemId: Ids_1.ItemId.Grenade,
            remainingTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            quantity: 1,
            skin: Ids_1.BundleId.Default,
        },
    ]);
});
(0, vitest_1.afterAll)(async () => {
    await Database_1.sequelize.close();
    await (0, promises_1.unlink)(storage.path);
});
(0, vitest_1.describe)("User rankings", () => {
    (0, vitest_1.it)("excludes inactive users before pagination and from the total", async () => {
        const users = await UserRepository_1.UserRepository.FindTopUsers("money", 1, 0);
        (0, vitest_1.expect)(users.map(user => user.id)).toEqual(["recent"]);
        await (0, vitest_1.expect)(UserRepository_1.UserRepository.CountTopUsers("money")).resolves.toBe(1);
    });
    (0, vitest_1.it)("excludes inactive users from end-of-season rankings", async () => {
        const [topMoney] = await SeasonRepository_1.SeasonRepository.GetEndSeasonRankingData();
        (0, vitest_1.expect)(topMoney.map(user => user.id)).toEqual(["recent"]);
    });
});
//# sourceMappingURL=Rankings.test.js.map