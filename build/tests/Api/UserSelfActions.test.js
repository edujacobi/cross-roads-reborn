"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const resolvers_1 = require("#api/graphql/resolvers");
const Notification_1 = require("#core/models/Notification");
const User_1 = require("#core/models/User");
const UserRepository_1 = require("#core/repositories/UserRepository");
const Classes_1 = require("#core/types/Classes");
const player = {
    userId: "123456",
    username: "Player",
    avatar: null,
    role: "PLAYER",
    situationId: User_1.SituationId.Idling,
    gangId: 1,
};
(0, vitest_1.describe)("Player self-service actions", () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.spyOn(User_1.User.prototype, "GetInfo").mockImplementation(async function () {
            return this;
        });
    });
    (0, vitest_1.afterEach)(() => vitest_1.vi.restoreAllMocks());
    (0, vitest_1.it)("claims the daily reward only for the authenticated player", async () => {
        const receiveDaily = vitest_1.vi.spyOn(User_1.User.prototype, "ReceiveDaily").mockResolvedValue({
            money: 300,
            bonusItems: [],
        });
        vitest_1.vi.spyOn(User_1.User.prototype, "CanReceiveDaily").mockReturnValue(true);
        await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.claimDailyReward(null, {}, { user: player })).resolves.toMatchObject({ success: true, message: vitest_1.expect.stringContaining("Cr$ 300") });
        (0, vitest_1.expect)(receiveDaily).toHaveBeenCalledWith({ isBooster: false });
    });
    (0, vitest_1.it)("does not claim the daily reward during cooldown", async () => {
        const receiveDaily = vitest_1.vi.spyOn(User_1.User.prototype, "ReceiveDaily");
        vitest_1.vi.spyOn(User_1.User.prototype, "CanReceiveDaily").mockReturnValue(false);
        await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.claimDailyReward(null, {}, { user: player })).resolves.toMatchObject({ success: false });
        (0, vitest_1.expect)(receiveDaily).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)("charges the authenticated player's nickname change cost", async () => {
        const search = vitest_1.vi.spyOn(UserRepository_1.UserRepository, "SearchByNameOrId").mockResolvedValue(null);
        const setNickname = vitest_1.vi.spyOn(User_1.User.prototype, "SetNickname").mockResolvedValue(true);
        vitest_1.vi.spyOn(User_1.User.prototype, "GetNicknameChangeCost").mockReturnValue(75_000);
        vitest_1.vi.spyOn(User_1.User.prototype, "GetInfo").mockImplementation(async function () {
            this.Nickname = "Old Name";
            this.Money = 100_000;
            return this;
        });
        await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.changeOwnNickname(null, { nickname: "New Name" }, { user: player })).resolves.toMatchObject({ success: true });
        (0, vitest_1.expect)(search).toHaveBeenCalledWith("New Name");
        (0, vitest_1.expect)(setNickname).toHaveBeenCalledWith("New Name", 75_000);
    });
    (0, vitest_1.it)("rejects invalid nicknames before loading or changing the player", async () => {
        const getInfo = vitest_1.vi.spyOn(User_1.User.prototype, "GetInfo");
        await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.changeOwnNickname(null, { nickname: "Invalid  Name!" }, { user: player })).resolves.toMatchObject({ success: false });
        (0, vitest_1.expect)(getInfo).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)("allows only the classes available through the setclass command", async () => {
        const setClass = vitest_1.vi.spyOn(User_1.User.prototype, "SetClass").mockResolvedValue(true);
        vitest_1.vi.spyOn(User_1.User.prototype, "GetClassChangeCost").mockReturnValue(50_000);
        vitest_1.vi.spyOn(User_1.User.prototype, "GetInfo").mockImplementation(async function () {
            this.Money = 100_000;
            this.Class = Classes_1.ClassId.None;
            return this;
        });
        await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.changeOwnClass(null, { classId: Classes_1.ClassId.Thief }, { user: player })).resolves.toMatchObject({ success: true });
        (0, vitest_1.expect)(setClass).toHaveBeenCalledWith(Classes_1.ClassId.Thief, 50_000);
        const getInfo = vitest_1.vi.spyOn(User_1.User.prototype, "GetInfo");
        getInfo.mockClear();
        await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.changeOwnClass(null, { classId: Classes_1.ClassId.Assassin }, { user: player })).resolves.toMatchObject({ success: false });
        (0, vitest_1.expect)(getInfo).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)("rejects self-service mutations when unauthenticated", async () => {
        await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.changeOwnClass(null, { classId: Classes_1.ClassId.Thief }, { user: null })).rejects.toThrow("Autenticação necessária para realizar esta ação.");
    });
    (0, vitest_1.it)("gifts VIP using only the authenticated player's special coins", async () => {
        vitest_1.vi.spyOn(User_1.User.prototype, "GetInfo").mockImplementation(async function () {
            this.SpecialCoin = this.Id === player.userId ? 1_190 : 0;
            this.Nickname = "Recipient";
            return this;
        });
        const gift = vitest_1.vi.spyOn(UserRepository_1.UserRepository, "GiftVipForDays").mockResolvedValue(true);
        const notifyRecipient = vitest_1.vi.spyOn(Notification_1.Notification, "VipGift").mockResolvedValue();
        await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.giftVip(null, { receiverId: "recipient", days: 7 }, { user: player })).resolves.toMatchObject({ success: true, message: "Você presenteou Recipient com 7 dias de VIP!" });
        (0, vitest_1.expect)(gift).toHaveBeenCalledWith(player.userId, "recipient", 7, 1_190);
        (0, vitest_1.expect)(notifyRecipient).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ Id: "recipient" }), vitest_1.expect.objectContaining({ Id: player.userId }), 7);
    });
    vitest_1.it.each([6, 0, -7, 7.5, Number.MAX_SAFE_INTEGER])("rejects invalid VIP gift duration %s", async (days) => {
        const gift = vitest_1.vi.spyOn(UserRepository_1.UserRepository, "GiftVipForDays");
        await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.giftVip(null, { receiverId: "recipient", days }, { user: player })).resolves.toMatchObject({ success: false });
        (0, vitest_1.expect)(gift).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)("does not gift VIP when only the recipient has enough coins", async () => {
        vitest_1.vi.spyOn(User_1.User.prototype, "GetInfo").mockImplementation(async function () {
            this.SpecialCoin = this.Id === player.userId ? 1_189 : 10_000;
            return this;
        });
        const gift = vitest_1.vi.spyOn(UserRepository_1.UserRepository, "GiftVipForDays");
        await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.giftVip(null, { receiverId: "recipient", days: 7 }, { user: player })).resolves.toMatchObject({ success: false, message: "Saldo insuficiente de Moedas Especiais." });
        (0, vitest_1.expect)(gift).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)("rejects VIP gifts to yourself, missing players, or eternal VIPs", async () => {
        const gift = vitest_1.vi.spyOn(UserRepository_1.UserRepository, "GiftVipForDays");
        await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.giftVip(null, { receiverId: player.userId, days: 7 }, { user: player })).resolves.toMatchObject({ success: false });
        vitest_1.vi.spyOn(User_1.User.prototype, "GetInfo").mockResolvedValue(null);
        await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.giftVip(null, { receiverId: "recipient", days: 7 }, { user: player })).resolves.toMatchObject({ success: false, message: "Jogador não encontrado." });
        vitest_1.vi.spyOn(User_1.User.prototype, "GetInfo").mockImplementation(async function () {
            this.SpecialCoin = 1_190;
            this.VipEternal = this.Id === "recipient";
            return this;
        });
        await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.giftVip(null, { receiverId: "recipient", days: 7 }, { user: player })).resolves.toMatchObject({ success: false, message: "Este jogador já possui VIP Eterno." });
        (0, vitest_1.expect)(gift).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)("requires authentication to gift VIP", async () => {
        await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.giftVip(null, { receiverId: "recipient", days: 7 }, { user: null })).rejects.toThrow("Autenticação necessária para realizar esta ação.");
    });
});
//# sourceMappingURL=UserSelfActions.test.js.map