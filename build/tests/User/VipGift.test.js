"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const date_fns_1 = require("date-fns");
const Database_1 = require("#core/database/Database");
const Users_1 = require("#core/database/Users");
const UserRepository_1 = require("#core/repositories/UserRepository");
const Ids_1 = require("#core/types/Ids");
vitest_1.vi.mock("#core/database/Database", async () => {
    const { Sequelize } = await import("sequelize");
    return { sequelize: new Sequelize({ dialect: "sqlite", storage: ":memory:", logging: false }) };
});
(0, vitest_1.describe)("VIP gift persistence", () => {
    (0, vitest_1.beforeEach)(async () => {
        vitest_1.vi.restoreAllMocks();
        await Users_1.Users.sync({ force: true });
        const now = new Date();
        await Database_1.sequelize.getQueryInterface().bulkInsert(Users_1.Users.getTableName(), [
            { id: "giver", specialCoin: 1_190, createdAt: now, updatedAt: now },
            { id: "recipient", specialCoin: 0, createdAt: now, updatedAt: now },
        ]);
    });
    (0, vitest_1.afterAll)(async () => {
        await Database_1.sequelize.close();
    });
    (0, vitest_1.it)("charges the giver and extends existing VIP without replacing a custom decoration", async () => {
        const vipTime = (0, date_fns_1.addDays)(new Date(), 10);
        await UserRepository_1.UserRepository.Update("recipient", { vipTime, avatarDecoration: Ids_1.AvatarDecorationId.Purple });
        await (0, vitest_1.expect)(UserRepository_1.UserRepository.GiftVipForDays("giver", "recipient", 7, 1_190)).resolves.toBe(true);
        const giver = await UserRepository_1.UserRepository.FindById("giver");
        const receiver = await UserRepository_1.UserRepository.FindById("recipient");
        (0, vitest_1.expect)(giver?.specialCoin).toBe(0);
        (0, vitest_1.expect)(giver?.vipTime).toBeNull();
        (0, vitest_1.expect)(receiver?.specialCoin).toBe(0);
        (0, vitest_1.expect)(receiver?.vipTime).toEqual((0, date_fns_1.addDays)(vipTime, 7));
        (0, vitest_1.expect)(receiver?.avatarDecoration).toBe(Ids_1.AvatarDecorationId.Purple);
        await (0, vitest_1.expect)(UserRepository_1.UserRepository.GiftVipForDays("giver", "recipient", 7, 1_190)).resolves.toBe(false);
        (0, vitest_1.expect)((await UserRepository_1.UserRepository.FindById("recipient"))?.vipTime).toEqual((0, date_fns_1.addDays)(vipTime, 7));
    });
    (0, vitest_1.it)("starts VIP from now when expired and grants the default VIP decoration", async () => {
        await UserRepository_1.UserRepository.Update("recipient", { vipTime: (0, date_fns_1.addDays)(new Date(), -10) });
        const before = (0, date_fns_1.addDays)(new Date(), 7);
        await UserRepository_1.UserRepository.GiftVipForDays("giver", "recipient", 7, 1_190);
        const receiver = await UserRepository_1.UserRepository.FindById("recipient");
        (0, vitest_1.expect)(receiver?.vipTime?.getTime()).toBeGreaterThanOrEqual(before.getTime());
        (0, vitest_1.expect)(receiver?.vipTime?.getTime()).toBeLessThanOrEqual((0, date_fns_1.addDays)(new Date(), 7).getTime());
        (0, vitest_1.expect)(receiver?.avatarDecoration).toBe(Ids_1.AvatarDecorationId.VIP);
    });
    (0, vitest_1.it)("does not charge for a missing or eternal VIP recipient", async () => {
        await (0, vitest_1.expect)(UserRepository_1.UserRepository.GiftVipForDays("giver", "missing", 7, 1_190)).resolves.toBe(false);
        await UserRepository_1.UserRepository.Update("recipient", { vipEternal: true });
        await (0, vitest_1.expect)(UserRepository_1.UserRepository.GiftVipForDays("giver", "recipient", 7, 1_190)).resolves.toBe(false);
        (0, vitest_1.expect)((await UserRepository_1.UserRepository.FindById("giver"))?.specialCoin).toBe(1_190);
    });
    (0, vitest_1.it)("rolls back the charge if granting VIP fails", async () => {
        vitest_1.vi.spyOn(Users_1.Users.prototype, "update").mockRejectedValueOnce(new Error("VIP update failed"));
        await (0, vitest_1.expect)(UserRepository_1.UserRepository.GiftVipForDays("giver", "recipient", 7, 1_190)).rejects.toThrow("VIP update failed");
        (0, vitest_1.expect)((await UserRepository_1.UserRepository.FindById("giver"))?.specialCoin).toBe(1_190);
        (0, vitest_1.expect)((await UserRepository_1.UserRepository.FindById("recipient"))?.vipTime).toBeNull();
    });
});
//# sourceMappingURL=VipGift.test.js.map