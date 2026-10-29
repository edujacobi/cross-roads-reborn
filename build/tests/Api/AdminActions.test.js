"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const resolvers_1 = require("#api/graphql/resolvers");
const AdminAuditLog_1 = require("#core/models/AdminAuditLog");
const User_1 = require("#core/models/User");
const UserBadge_1 = require("#core/models/UserBadge");
const UserRepository_1 = require("#core/repositories/UserRepository");
const UserItemRepository_1 = require("#core/repositories/UserItemRepository");
const AdminAuditLog_2 = require("#core/types/AdminAuditLog");
const Badges_1 = require("#core/types/Badges");
const Classes_1 = require("#core/types/Classes");
const Ids_1 = require("#core/types/Ids");
vitest_1.vi.mock("#bot/client", () => ({
    getClient: () => ({
        users: {
            fetch: vitest_1.vi.fn().mockResolvedValue({ avatarURL: () => null }),
        },
        userLastCommand: new Map(),
    }),
}));
const moderator = {
    userId: "654321",
    username: "ModTester",
    avatar: null,
    role: "MODERATOR",
    situationId: User_1.SituationId.Idling,
};
const developer = {
    ...moderator,
    role: "DEVELOPER",
};
(0, vitest_1.describe)("Admin action mutations", () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.spyOn(AdminAuditLog_1.AdminAuditLog, "Record").mockResolvedValue();
        vitest_1.vi.spyOn(User_1.User.prototype, "GetInfo").mockImplementation(async function () {
            return this;
        });
        vitest_1.vi.spyOn(User_1.User.prototype, "GetGang").mockResolvedValue(null);
        vitest_1.vi.spyOn(UserBadge_1.UserBadge, "GetList").mockResolvedValue([]);
    });
    (0, vitest_1.afterEach)(() => vitest_1.vi.restoreAllMocks());
    (0, vitest_1.it)("records the admin and the previous and new money values", async () => {
        vitest_1.vi.spyOn(User_1.User.prototype, "Update").mockResolvedValue(true);
        await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.setMoney(null, {
            userId: "target123",
            amount: 250,
            mode: "SET",
        }, { user: moderator })).resolves.toMatchObject({ success: true });
        (0, vitest_1.expect)(AdminAuditLog_1.AdminAuditLog.Record).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            userId: moderator.userId,
            auditRequestInfo: { ipAddress: null, userAgent: null },
        }), AdminAuditLog_2.AdminAuditActionId.SetMoney, { userId: "target123" }, 0, 250, { ipAddress: null, userAgent: null });
    });
    (0, vitest_1.it)("sets a user's item quantity", async () => {
        const findItem = vitest_1.vi.spyOn(UserItemRepository_1.UserItemRepository, "FindByUserAndItem").mockResolvedValue(null);
        const createItem = vitest_1.vi.spyOn(UserItemRepository_1.UserItemRepository, "Create").mockResolvedValue(null);
        await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.setItem(null, {
            userId: "target123",
            itemId: Ids_1.ItemId.Grenade,
            mode: "SET",
            hoursOrQuantity: 5,
        }, { user: moderator })).resolves.toMatchObject({ success: true });
        (0, vitest_1.expect)(findItem).toHaveBeenCalledWith("target123", Ids_1.ItemId.Grenade);
        (0, vitest_1.expect)(createItem).toHaveBeenCalledWith({
            userId: "target123",
            itemId: Ids_1.ItemId.Grenade,
            quantity: 5,
            skin: Ids_1.BundleId.Default,
        });
    });
    (0, vitest_1.it)("adds a consumable quantity to an existing item", async () => {
        const existingItem = { quantity: 4, remainingTime: new Date() };
        vitest_1.vi.spyOn(UserItemRepository_1.UserItemRepository, "FindByUserAndItem").mockResolvedValue(existingItem);
        const updateItem = vitest_1.vi.spyOn(UserItemRepository_1.UserItemRepository, "UpdateDurationOrQuantity").mockResolvedValue();
        await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.setItem(null, {
            userId: "target123",
            itemId: Ids_1.ItemId.Grenade,
            mode: "ADD",
            hoursOrQuantity: 3,
        }, { user: moderator })).resolves.toMatchObject({ success: true });
        (0, vitest_1.expect)(updateItem).toHaveBeenCalledWith("target123", Ids_1.ItemId.Grenade, { quantity: 7 });
    });
    (0, vitest_1.it)("rejects fractional consumable quantities", async () => {
        const getInfo = vitest_1.vi.spyOn(User_1.User.prototype, "GetInfo");
        const findItem = vitest_1.vi.spyOn(UserItemRepository_1.UserItemRepository, "FindByUserAndItem");
        await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.setItem(null, {
            userId: "target123",
            itemId: Ids_1.ItemId.Grenade,
            mode: "ADD",
            hoursOrQuantity: 1.5,
        }, { user: moderator })).resolves.toEqual({
            success: false,
            message: "A quantidade do consumível deve ser um número inteiro não negativo.",
            user: null,
        });
        (0, vitest_1.expect)(getInfo).not.toHaveBeenCalled();
        (0, vitest_1.expect)(findItem).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)("adds special coins to a user", async () => {
        const addSpecialCoin = vitest_1.vi.spyOn(User_1.User.prototype, "AddSpecialCoin").mockResolvedValue();
        await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.addSpecialCoins(null, { userId: "target123", amount: 12 }, { user: moderator })).resolves.toMatchObject({ success: true });
        (0, vitest_1.expect)(addSpecialCoin).toHaveBeenCalledWith(12);
    });
    (0, vitest_1.it)("removes special coins when given a negative amount", async () => {
        const addSpecialCoin = vitest_1.vi.spyOn(User_1.User.prototype, "AddSpecialCoin").mockResolvedValue();
        await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.addSpecialCoins(null, { userId: "target123", amount: -12 }, { user: moderator })).resolves.toMatchObject({ success: true });
        (0, vitest_1.expect)(addSpecialCoin).toHaveBeenCalledWith(-12);
    });
    (0, vitest_1.it)("changes a user's class", async () => {
        const setClass = vitest_1.vi.spyOn(User_1.User.prototype, "SetClass").mockResolvedValue(true);
        await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.setClass(null, { userId: "target123", classId: Classes_1.ClassId.Assassin }, { user: moderator })).resolves.toMatchObject({ success: true });
        (0, vitest_1.expect)(setClass).toHaveBeenCalledWith(Classes_1.ClassId.Assassin);
    });
    (0, vitest_1.it)("changes a user's nickname", async () => {
        const setNickname = vitest_1.vi.spyOn(User_1.User.prototype, "SetNickname").mockResolvedValue(true);
        await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.setNickname(null, { userId: "target123", nickname: "NewNickname" }, { user: moderator })).resolves.toMatchObject({ success: true });
        (0, vitest_1.expect)(setNickname).toHaveBeenCalledWith("NewNickname");
    });
    (0, vitest_1.it)("adds VIP time to a user", async () => {
        const addVip = vitest_1.vi.spyOn(User_1.User.prototype, "AddVip").mockResolvedValue();
        const setEternalVip = vitest_1.vi.spyOn(User_1.User.prototype, "SetEternalVip").mockResolvedValue();
        await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.setVip(null, { userId: "target123", days: 30, eternal: false }, { user: moderator })).resolves.toMatchObject({ success: true });
        (0, vitest_1.expect)(addVip).toHaveBeenCalledWith(30, true);
        (0, vitest_1.expect)(setEternalVip).toHaveBeenCalledWith(false);
    });
    (0, vitest_1.it)("removes VIP time when given negative days", async () => {
        const addVip = vitest_1.vi.spyOn(User_1.User.prototype, "AddVip").mockResolvedValue();
        vitest_1.vi.spyOn(User_1.User.prototype, "SetEternalVip").mockResolvedValue();
        await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.setVip(null, { userId: "target123", days: -30, eternal: false }, { user: moderator })).resolves.toMatchObject({ success: true });
        (0, vitest_1.expect)(addVip).toHaveBeenCalledWith(-30, true);
    });
    (0, vitest_1.it)("sets eternal VIP without applying a timed duration", async () => {
        const addVip = vitest_1.vi.spyOn(User_1.User.prototype, "AddVip").mockResolvedValue();
        const setEternalVip = vitest_1.vi.spyOn(User_1.User.prototype, "SetEternalVip").mockResolvedValue();
        await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.setVip(null, { userId: "target123", days: 30, eternal: true }, { user: moderator })).resolves.toMatchObject({ success: true, message: vitest_1.expect.stringContaining("VIP eterno") });
        (0, vitest_1.expect)(setEternalVip).toHaveBeenCalledWith(true);
        (0, vitest_1.expect)(addVip).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)("keeps the default avatar decoration when removing eternal VIP", async () => {
        vitest_1.vi.spyOn(User_1.User.prototype, "GetInfo").mockImplementation(async function () {
            this.VipEternal = true;
            return this;
        });
        vitest_1.vi.spyOn(User_1.User.prototype, "SetEternalVip").mockResolvedValue();
        const addVip = vitest_1.vi.spyOn(User_1.User.prototype, "AddVip").mockResolvedValue();
        await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.setVip(null, { userId: "target123", days: 30, eternal: false }, { user: moderator })).resolves.toMatchObject({ success: true });
        (0, vitest_1.expect)(addVip).toHaveBeenCalledWith(30, false);
    });
    (0, vitest_1.it)("applies a timed death to a user", async () => {
        const deadUntil = new Date("2026-10-01T00:00:00.000Z");
        const kill = vitest_1.vi.spyOn(User_1.User.prototype, "Kill").mockResolvedValue(deadUntil);
        await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.killUser(null, { userId: "target123", days: 2 }, { user: moderator })).resolves.toMatchObject({ success: true, message: vitest_1.expect.stringContaining(deadUntil.toISOString()) });
        (0, vitest_1.expect)(kill).toHaveBeenCalledWith(2);
    });
    (0, vitest_1.it)("adds a badge to a user", async () => {
        const createBadge = vitest_1.vi.spyOn(UserBadge_1.UserBadge, "Create").mockResolvedValue(true);
        await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.addBadge(null, { userId: "target123", badgeId: Badges_1.BadgeId.Helper }, { user: moderator })).resolves.toMatchObject({ success: true });
        (0, vitest_1.expect)(createBadge).toHaveBeenCalledWith("target123", Badges_1.BadgeId.Helper);
    });
    (0, vitest_1.it)("removes a badge from a user", async () => {
        const deleteBadge = vitest_1.vi.spyOn(UserBadge_1.UserBadge, "Delete").mockResolvedValue(true);
        await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.removeBadge(null, { userId: "target123", badgeId: Badges_1.BadgeId.Helper }, { user: moderator })).resolves.toMatchObject({ success: true });
        (0, vitest_1.expect)(deleteBadge).toHaveBeenCalledWith("target123", Badges_1.BadgeId.Helper);
    });
    (0, vitest_1.it)("allows only Developers to swap users", async () => {
        const findById = vitest_1.vi.spyOn(UserRepository_1.UserRepository, "FindById");
        const swapUsers = vitest_1.vi.spyOn(UserRepository_1.UserRepository, "SwapUsers");
        await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.swapUsers(null, {
            firstUserId: "first123",
            secondUserId: "second123",
        }, { user: moderator })).rejects.toThrow("Acesso negado: É necessário acesso de desenvolvedor.");
        (0, vitest_1.expect)(findById).not.toHaveBeenCalled();
        (0, vitest_1.expect)(swapUsers).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)("swaps two existing users through the repository", async () => {
        const firstUser = { id: "first123", nickname: "First" };
        const secondUser = { id: "second123", nickname: "Second" };
        const findById = vitest_1.vi.spyOn(UserRepository_1.UserRepository, "FindById")
            .mockResolvedValueOnce(firstUser)
            .mockResolvedValueOnce(secondUser);
        const swapUsers = vitest_1.vi.spyOn(UserRepository_1.UserRepository, "SwapUsers").mockResolvedValue(["users", "items"]);
        await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.swapUsers(null, {
            firstUserId: firstUser.id,
            secondUserId: secondUser.id,
        }, { user: developer })).resolves.toMatchObject({
            success: true,
            message: vitest_1.expect.stringContaining("First e Second foram trocados"),
        });
        (0, vitest_1.expect)(findById).toHaveBeenCalledTimes(2);
        (0, vitest_1.expect)(swapUsers).toHaveBeenCalledWith(firstUser.id, secondUser.id, vitest_1.expect.stringMatching(/^TEMP_[a-f0-9]{12}$/));
    });
    (0, vitest_1.it)("rejects swapping a user with itself", async () => {
        const findById = vitest_1.vi.spyOn(UserRepository_1.UserRepository, "FindById");
        const swapUsers = vitest_1.vi.spyOn(UserRepository_1.UserRepository, "SwapUsers");
        await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.swapUsers(null, {
            firstUserId: "same123",
            secondUserId: "same123",
        }, { user: developer })).resolves.toMatchObject({ success: false, message: "Escolha dois usuários diferentes." });
        (0, vitest_1.expect)(findById).not.toHaveBeenCalled();
        (0, vitest_1.expect)(swapUsers).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=AdminActions.test.js.map