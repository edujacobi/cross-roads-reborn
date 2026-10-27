"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jwt_1 = require("#api/auth/jwt");
const resolvers_1 = require("#api/graphql/resolvers");
const AdminAuditLog_1 = require("#core/models/AdminAuditLog");
const Dashboard_1 = require("#core/models/Dashboard");
const Event_1 = require("#core/models/Event");
const User_1 = require("#core/models/User");
const MultiplayerSession_1 = require("#core/models/MultiplayerSession");
const UserAvatarDecoration_1 = require("#core/models/UserAvatarDecoration");
const UserBackgroundDecoration_1 = require("#core/models/UserBackgroundDecoration");
const UserBundle_1 = require("#core/models/UserBundle");
const Vault_1 = require("#core/models/Vault");
const UserRepository_1 = require("#core/repositories/UserRepository");
const UserItemRepository_1 = require("#core/repositories/UserItemRepository");
const Ids_1 = require("#core/types/Ids");
(0, vitest_1.describe)("API Auth and Resolvers", () => {
    const devUser = {
        userId: "123456",
        username: "DevTester",
        avatar: null,
        role: "DEVELOPER",
        situationId: User_1.SituationId.Idling,
    };
    const modUser = {
        userId: "654321",
        username: "ModTester",
        avatar: null,
        role: "MODERATOR",
        situationId: User_1.SituationId.Idling,
    };
    const helperUser = {
        userId: "789012",
        username: "HelperTester",
        avatar: null,
        role: "HELPER",
        situationId: User_1.SituationId.Idling,
    };
    const playerUser = {
        userId: "456789",
        username: "PlayerTester",
        avatar: null,
        role: "PLAYER",
        situationId: User_1.SituationId.Idling,
    };
    (0, vitest_1.afterEach)(() => vitest_1.vi.restoreAllMocks());
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.spyOn(AdminAuditLog_1.AdminAuditLog, "Record").mockResolvedValue();
    });
    (0, vitest_1.describe)("JWT Signing and Verification", () => {
        (0, vitest_1.it)("should correctly sign and verify a token for a developer", () => {
            const token = (0, jwt_1.signAuthToken)(devUser);
            (0, vitest_1.expect)(token).toBeDefined();
            const decoded = (0, jwt_1.verifyAuthToken)(token);
            (0, vitest_1.expect)(decoded).not.toBeNull();
            (0, vitest_1.expect)(decoded?.userId).toBe(devUser.userId);
            (0, vitest_1.expect)(decoded?.role).toBe("DEVELOPER");
        });
        (0, vitest_1.it)("should correctly sign and verify a token for a moderator", () => {
            const token = (0, jwt_1.signAuthToken)(modUser);
            const decoded = (0, jwt_1.verifyAuthToken)(token);
            (0, vitest_1.expect)(decoded).not.toBeNull();
            (0, vitest_1.expect)(decoded?.userId).toBe(modUser.userId);
            (0, vitest_1.expect)(decoded?.role).toBe("MODERATOR");
        });
        (0, vitest_1.it)("should correctly sign and verify a token for a helper", () => {
            const token = (0, jwt_1.signAuthToken)(helperUser);
            const decoded = (0, jwt_1.verifyAuthToken)(token);
            (0, vitest_1.expect)(decoded).not.toBeNull();
            (0, vitest_1.expect)(decoded?.userId).toBe(helperUser.userId);
            (0, vitest_1.expect)(decoded?.role).toBe("HELPER");
        });
        (0, vitest_1.it)("should correctly sign and verify a token for a player", () => {
            const token = (0, jwt_1.signAuthToken)(playerUser);
            const decoded = (0, jwt_1.verifyAuthToken)(token);
            (0, vitest_1.expect)(decoded).not.toBeNull();
            (0, vitest_1.expect)(decoded?.userId).toBe(playerUser.userId);
            (0, vitest_1.expect)(decoded?.role).toBe("PLAYER");
        });
        (0, vitest_1.it)("should return null for an invalid token", () => {
            const decoded = (0, jwt_1.verifyAuthToken)("invalid.token.here");
            (0, vitest_1.expect)(decoded).toBeNull();
        });
    });
    (0, vitest_1.describe)("RBAC Permissions on GraphQL Resolvers", () => {
        (0, vitest_1.it)("should reject queries when unauthenticated", async () => {
            await (0, vitest_1.expect)(resolvers_1.resolvers.Query.dashboardStats(null, {}, { user: null })).rejects.toThrow("Autenticação necessária para realizar esta ação.");
        });
        (0, vitest_1.it)("should reject admin queries from players", async () => {
            await (0, vitest_1.expect)(resolvers_1.resolvers.Query.dashboardStats(null, {}, { user: playerUser })).rejects.toThrow("Acesso negado: É necessário acesso de administrador.");
        });
        (0, vitest_1.it)("should reject VIP filtering from players", async () => {
            await (0, vitest_1.expect)(resolvers_1.resolvers.Query.users(null, { vipOnly: true }, { user: playerUser })).rejects.toThrow("Acesso negado: Filtragem VIP é restrita a administradores.");
        });
        (0, vitest_1.it)("allows Developers and moderators to read audit logs, but rejects helpers", async () => {
            const getPage = vitest_1.vi.spyOn(AdminAuditLog_1.AdminAuditLog, "GetPage").mockResolvedValue({ entries: [], total: 0 });
            await (0, vitest_1.expect)(resolvers_1.resolvers.Query.adminAuditLogs(null, {}, { user: helperUser })).rejects.toThrow("Forbidden: Audit log access required.");
            await (0, vitest_1.expect)(resolvers_1.resolvers.Query.adminAuditLogs(null, { limit: 250, offset: -5 }, { user: devUser })).resolves.toEqual({ entries: [], total: 0 });
            (0, vitest_1.expect)(getPage).toHaveBeenCalledWith(100, 0, undefined);
            await (0, vitest_1.expect)(resolvers_1.resolvers.Query.adminAuditLogs(null, {}, { user: modUser })).resolves.toMatchObject({ entries: [], total: 0 });
        });
        (0, vitest_1.it)("should reject mutations when unauthenticated", async () => {
            await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.cureUser(null, { userId: "target123" }, { user: null })).rejects.toThrow("Autenticação necessária para realizar esta ação.");
        });
        (0, vitest_1.it)("should return the specific Russian Roulette creation error", async () => {
            const message = "Você está trabalhando e não pode apostar.";
            vitest_1.vi.spyOn(User_1.User.prototype, "GetInfo").mockResolvedValue(new User_1.User(playerUser.userId));
            vitest_1.vi.spyOn(MultiplayerSession_1.MultiplayerSession, "StartRussianRoulette").mockResolvedValue({ success: false, message });
            await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.startRussianRoulette(null, { bet: 5_000 }, { user: playerUser })).resolves.toEqual({ success: false, message, session: null });
        });
        (0, vitest_1.it)("should return the specific multiplayer session join error", async () => {
            const message = "Você precisa aguardar para participar desta sala.";
            vitest_1.vi.spyOn(User_1.User.prototype, "GetInfo").mockResolvedValue(new User_1.User(playerUser.userId));
            vitest_1.vi.spyOn(MultiplayerSession_1.MultiplayerSession, "Join").mockResolvedValue({ success: false, message });
            await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.joinMultiplayerSession(null, { sessionId: "roulette-room" }, { user: playerUser })).resolves.toEqual({ success: false, message, session: null });
        });
        (0, vitest_1.it)("should allow dashboard queries when user is HELPER", async () => {
            vitest_1.vi.spyOn(Dashboard_1.Dashboard, "GetCurrentStats").mockResolvedValue({
                date: new Date(),
                totalPlayers: 0,
                allUsers: 0,
                classCounts: [],
                totalGangs: 0,
                prisonCount: 0,
                hospitalCount: 0,
                jobCount: 0,
                scavengeCount: 0,
                casinoCount: 0,
                robberyCount: 0,
                beatUpCount: 0,
                idleCount: 0,
                englishCount: 0,
                portugueseCount: 0,
                spanishCount: 0,
            });
            vitest_1.vi.spyOn(Vault_1.Vault, "GetBalances").mockResolvedValue({ bank: 0, casino: 0 });
            await (0, vitest_1.expect)(resolvers_1.resolvers.Query.dashboardStats(null, {}, { user: helperUser })).resolves.toMatchObject({
                totalPlayers: 0,
                classCounts: [],
                bankVaultValue: 0,
                casinoVaultValue: 0,
            });
        });
        (0, vitest_1.it)("should return item user counts for dashboard", async () => {
            const countUsersWithItem = vitest_1.vi.spyOn(UserItemRepository_1.UserItemRepository, "CountUsersWithItem").mockResolvedValue(7);
            await (0, vitest_1.expect)(resolvers_1.resolvers.Query.dashboardItemPopularity(null, {}, { user: helperUser })).resolves.toContainEqual({
                itemId: Ids_1.ItemId.Knife,
                name: "Faca",
                userCount: 7,
            });
            (0, vitest_1.expect)(countUsersWithItem).toHaveBeenCalledWith(Ids_1.ItemId.Knife);
        });
        (0, vitest_1.it)("should allow mutations when user is MODERATOR", async () => {
            vitest_1.vi.spyOn(User_1.User.prototype, "GetInfo").mockResolvedValue(null);
            await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.cureUser(null, { userId: "target123" }, { user: modUser })).resolves.toMatchObject({ success: false, message: "Usuário não encontrado." });
        });
        (0, vitest_1.it)("should reject mutations when user is HELPER (read-only)", async () => {
            await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.cureUser(null, { userId: "target123" }, { user: helperUser })).rejects.toThrow("Acesso negado: Este papel tem acesso somente leitura.");
        });
        (0, vitest_1.it)("should allow developers to delete users", async () => {
            const deleteUser = vitest_1.vi.spyOn(UserRepository_1.UserRepository, "DeleteUser").mockResolvedValue(true);
            await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.deleteUser(null, { userId: "target123" }, { user: devUser })).resolves.toMatchObject({
                success: true,
                message: "Usuário e todos os dados relacionados foram excluídos.",
            });
            (0, vitest_1.expect)(deleteUser).toHaveBeenCalledWith("target123");
        });
        (0, vitest_1.it)("should reject user deletion from moderators", async () => {
            const deleteUser = vitest_1.vi.spyOn(UserRepository_1.UserRepository, "DeleteUser");
            await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.deleteUser(null, { userId: "target123" }, { user: modUser })).rejects.toThrow("Acesso negado: É necessário acesso de desenvolvedor.");
            (0, vitest_1.expect)(deleteUser).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)("should reject setMoney when user is HELPER", async () => {
            await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.setMoney(null, {
                userId: "target123",
                amount: 1000,
                mode: "ADD",
            }, { user: helperUser })).rejects.toThrow("Acesso negado: Este papel tem acesso somente leitura.");
        });
        (0, vitest_1.it)("should reject non-integer and unsafe setMoney amounts", async () => {
            const getInfo = vitest_1.vi.spyOn(User_1.User.prototype, "GetInfo");
            for (const amount of [1000.5, Number.MAX_SAFE_INTEGER + 1]) {
                await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.setMoney(null, { userId: "target123", amount, mode: "ADD" }, { user: modUser })).resolves.toMatchObject({
                    success: false,
                    message: "O valor do dinheiro deve ser um número inteiro válido.",
                });
            }
            (0, vitest_1.expect)(getInfo).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)("should reject non-integer and unsafe special coin amounts", async () => {
            const getInfo = vitest_1.vi.spyOn(User_1.User.prototype, "GetInfo");
            for (const amount of [1000.5, Number.MAX_SAFE_INTEGER + 1]) {
                await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.addSpecialCoins(null, { userId: "target123", amount }, { user: modUser })).resolves.toMatchObject({
                    success: false,
                    message: "O valor de moedas especiais deve ser um número inteiro válido.",
                });
            }
            (0, vitest_1.expect)(getInfo).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)("requires authentication for the special shop, decorations, and skins", async () => {
            await (0, vitest_1.expect)(resolvers_1.resolvers.Query.specialShop(null, {}, { user: null })).rejects.toThrow("Autenticação necessária para realizar esta ação.");
            await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.buySpecialShopVip(null, { days: 7 }, { user: null })).rejects.toThrow("Autenticação necessária para realizar esta ação.");
            await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.setOwnDecoration(null, {
                type: "AVATAR",
                decorationId: Ids_1.AvatarDecorationId.Purple,
            }, { user: null })).rejects.toThrow("Autenticação necessária para realizar esta ação.");
            await (0, vitest_1.expect)(resolvers_1.resolvers.Query.myDecorations(null, {}, { user: null })).rejects.toThrow("Autenticação necessária para realizar esta ação.");
            await (0, vitest_1.expect)(resolvers_1.resolvers.Query.mySkinBundles(null, {}, { user: null })).rejects.toThrow("Autenticação necessária para realizar esta ação.");
            await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.setOwnBundleSkin(null, {
                bundleId: Ids_1.BundleId.Brazilian,
            }, { user: null })).rejects.toThrow("Autenticação necessária para realizar esta ação.");
            await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.setOwnItemSkin(null, {
                itemId: Ids_1.ItemId.Pistol,
                bundleId: Ids_1.BundleId.Brazilian,
            }, { user: null })).rejects.toThrow("Autenticação necessária para realizar esta ação.");
        });
        (0, vitest_1.it)("lists owned skin bundles with the special shop previews", async () => {
            const defaultBundle = new UserBundle_1.UserBundle();
            defaultBundle.Description = "Padrão";
            const ownedBundle = new UserBundle_1.UserBundle();
            ownedBundle.BundleId = Ids_1.BundleId.Brazilian;
            ownedBundle.Description = "Brasileiro";
            vitest_1.vi.spyOn(UserBundle_1.UserBundle, "GetList").mockResolvedValue([defaultBundle, ownedBundle]);
            const bundles = await resolvers_1.resolvers.Query.mySkinBundles(null, {}, { user: playerUser });
            (0, vitest_1.expect)(bundles).toHaveLength(2);
            (0, vitest_1.expect)(bundles).toContainEqual(vitest_1.expect.objectContaining({
                id: Ids_1.BundleId.Brazilian,
                name: "Brasileiro",
                skins: vitest_1.expect.arrayContaining([
                    vitest_1.expect.objectContaining({
                        itemId: Ids_1.ItemId.Pistol,
                        imagePath: "/images/items/1_Pistol_Brazilian.png",
                    }),
                ]),
            }));
        });
        (0, vitest_1.it)("lists owned decorations with their profile preview classes", async () => {
            vitest_1.vi.spyOn(User_1.User.prototype, "GetInfo").mockImplementation(async function () {
                return this;
            });
            const avatar = new UserAvatarDecoration_1.UserAvatarDecoration();
            avatar.AvatarDecorationId = Ids_1.AvatarDecorationId.Purple;
            const background = new UserBackgroundDecoration_1.UserBackgroundDecoration();
            background.BackgroundDecorationId = Ids_1.BackgroundDecorationId.Sunset;
            vitest_1.vi.spyOn(UserAvatarDecoration_1.UserAvatarDecoration, "GetList").mockResolvedValue([avatar]);
            vitest_1.vi.spyOn(UserBackgroundDecoration_1.UserBackgroundDecoration, "GetList").mockResolvedValue([background]);
            await (0, vitest_1.expect)(resolvers_1.resolvers.Query.myDecorations(null, {}, { user: playerUser })).resolves.toEqual({
                avatarDecorations: [{ id: Ids_1.AvatarDecorationId.Purple, name: "Púrpura", className: "purple" }],
                backgroundDecorations: [{ id: Ids_1.BackgroundDecorationId.Sunset, name: "Pôr do sol", className: "sunset" }],
            });
        });
        (0, vitest_1.it)("returns products from the canonical shop catalogs", async () => {
            vitest_1.vi.spyOn(User_1.User.prototype, "GetInfo").mockImplementation(async function () {
                return this;
            });
            vitest_1.vi.spyOn(UserBundle_1.UserBundle, "GetList").mockResolvedValue([]);
            vitest_1.vi.spyOn(UserAvatarDecoration_1.UserAvatarDecoration, "GetList").mockResolvedValue([]);
            vitest_1.vi.spyOn(UserBackgroundDecoration_1.UserBackgroundDecoration, "GetList").mockResolvedValue([]);
            const catalog = await resolvers_1.resolvers.Query.specialShop(null, {}, { user: playerUser });
            (0, vitest_1.expect)(catalog.vipPricePerDay).toBe(170);
            (0, vitest_1.expect)(catalog.vipMinimumDays).toBe(7);
            (0, vitest_1.expect)(catalog.skinBundles).toContainEqual(vitest_1.expect.objectContaining({
                id: Ids_1.BundleId.Brazilian,
                name: "Brasileiro",
                price: 2_000,
                owned: false,
                skins: vitest_1.expect.arrayContaining([
                    vitest_1.expect.objectContaining({
                        itemId: Ids_1.ItemId.Pistol,
                        imagePath: "/images/items/1_Pistol_Brazilian.png",
                    }),
                ]),
            }));
            (0, vitest_1.expect)(catalog.avatarDecorations).toContainEqual(vitest_1.expect.objectContaining({
                id: Ids_1.AvatarDecorationId.Purple,
                name: "Púrpura",
                price: 1_000,
            }));
        });
        (0, vitest_1.it)("does not buy VIP when the player cannot afford the selected duration", async () => {
            vitest_1.vi.spyOn(User_1.User.prototype, "GetInfo").mockImplementation(async function () {
                this.SpecialCoin = 1_189;
                return this;
            });
            const buyVip = vitest_1.vi.spyOn(User_1.User.prototype, "BuyVipForDays").mockResolvedValue(true);
            await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.buySpecialShopVip(null, { days: 7 }, { user: playerUser })).resolves.toMatchObject({
                success: false,
                message: "Saldo insuficiente de Moedas Especiais.",
            });
            (0, vitest_1.expect)(buyVip).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)("requires at least seven whole days when buying VIP", async () => {
            vitest_1.vi.spyOn(User_1.User.prototype, "GetInfo").mockImplementation(async function () {
                this.SpecialCoin = 10_000;
                return this;
            });
            const buyVip = vitest_1.vi.spyOn(User_1.User.prototype, "BuyVipForDays").mockResolvedValue(true);
            await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.buySpecialShopVip(null, { days: 6 }, { user: playerUser })).resolves.toMatchObject({
                success: false,
                message: "O VIP deve ser comprado por pelo menos 7 dias.",
            });
            (0, vitest_1.expect)(buyVip).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)("charges 170 special coins per VIP day", async () => {
            vitest_1.vi.spyOn(User_1.User.prototype, "GetInfo").mockImplementation(async function () {
                this.SpecialCoin = 1_190;
                return this;
            });
            const buyVip = vitest_1.vi.spyOn(User_1.User.prototype, "BuyVipForDays").mockResolvedValue(true);
            await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.buySpecialShopVip(null, { days: 7 }, { user: playerUser })).resolves.toMatchObject({
                success: true,
                message: "Você comprou 7 dias de VIP!",
            });
            (0, vitest_1.expect)(buyVip).toHaveBeenCalledWith(7);
        });
        (0, vitest_1.it)("deducts the day-based VIP price and adds the selected time", async () => {
            const player = new User_1.User(playerUser.userId);
            player.SpecialCoin = 1_190;
            const update = vitest_1.vi.spyOn(User_1.User.prototype, "Update").mockResolvedValue(true);
            const addVip = vitest_1.vi.spyOn(User_1.User.prototype, "AddVip").mockResolvedValue();
            await (0, vitest_1.expect)(player.BuyVipForDays(7)).resolves.toBe(true);
            (0, vitest_1.expect)(player.SpecialCoin).toBe(0);
            (0, vitest_1.expect)(update).toHaveBeenCalledWith({ specialCoin: 0 });
            (0, vitest_1.expect)(addVip).toHaveBeenCalledWith(7);
        });
        (0, vitest_1.it)("buys an available avatar decoration and charges through the user model", async () => {
            vitest_1.vi.spyOn(User_1.User.prototype, "GetInfo").mockImplementation(async function () {
                this.SpecialCoin = 1_000;
                return this;
            });
            vitest_1.vi.spyOn(UserAvatarDecoration_1.UserAvatarDecoration, "HasAvatarDecoration").mockResolvedValue(false);
            const buyAvatarDecoration = vitest_1.vi.spyOn(User_1.User.prototype, "BuyAvatarDecoration").mockResolvedValue(true);
            await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.buySpecialShopItem(null, {
                type: "AVATAR_DECORATION",
                itemId: Ids_1.AvatarDecorationId.Purple,
            }, { user: playerUser })).resolves.toMatchObject({
                success: true,
                message: "Você comprou Púrpura!",
            });
            (0, vitest_1.expect)(buyAvatarDecoration).toHaveBeenCalledWith(Ids_1.AvatarDecorationId.Purple);
        });
        (0, vitest_1.it)("only equips decorations that the current user owns", async () => {
            vitest_1.vi.spyOn(User_1.User.prototype, "GetInfo").mockImplementation(async function () {
                return this;
            });
            const ownedDecoration = new UserAvatarDecoration_1.UserAvatarDecoration();
            ownedDecoration.AvatarDecorationId = Ids_1.AvatarDecorationId.Purple;
            vitest_1.vi.spyOn(UserAvatarDecoration_1.UserAvatarDecoration, "GetList").mockResolvedValue([ownedDecoration]);
            const setAvatarDecoration = vitest_1.vi.spyOn(User_1.User.prototype, "SetAvatarDecoration").mockResolvedValue(true);
            await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.setOwnDecoration(null, {
                type: "AVATAR",
                decorationId: Ids_1.AvatarDecorationId.Purple,
            }, { user: playerUser })).resolves.toMatchObject({
                success: true,
                message: "Decoração de avatar atualizada.",
            });
            await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.setOwnDecoration(null, {
                type: "AVATAR",
                decorationId: Ids_1.AvatarDecorationId.Sunset,
            }, { user: playerUser })).resolves.toMatchObject({
                success: false,
                message: "Você não possui esta decoração de avatar.",
            });
            (0, vitest_1.expect)(setAvatarDecoration).toHaveBeenCalledTimes(1);
            const ownedBackground = new UserBackgroundDecoration_1.UserBackgroundDecoration();
            ownedBackground.BackgroundDecorationId = Ids_1.BackgroundDecorationId.Sunset;
            vitest_1.vi.spyOn(UserBackgroundDecoration_1.UserBackgroundDecoration, "GetList").mockResolvedValue([ownedBackground]);
            const setBackgroundDecoration = vitest_1.vi.spyOn(User_1.User.prototype, "SetBackgroundDecoration").mockResolvedValue(true);
            await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.setOwnDecoration(null, {
                type: "BACKGROUND",
                decorationId: Ids_1.BackgroundDecorationId.Sunset,
            }, { user: playerUser })).resolves.toMatchObject({
                success: true,
                message: "Decoração de fundo atualizada.",
            });
            await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.setOwnDecoration(null, {
                type: "BACKGROUND",
                decorationId: Ids_1.BackgroundDecorationId.Purple,
            }, { user: playerUser })).resolves.toMatchObject({
                success: false,
                message: "Você não possui esta decoração de fundo.",
            });
            (0, vitest_1.expect)(setBackgroundDecoration).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)("applies all skins in a bundle only when the user owns that bundle", async () => {
            vitest_1.vi.spyOn(User_1.User.prototype, "GetInfo").mockImplementation(async function () {
                return this;
            });
            const ownedBundle = new UserBundle_1.UserBundle();
            ownedBundle.BundleId = Ids_1.BundleId.Brazilian;
            vitest_1.vi.spyOn(UserBundle_1.UserBundle, "GetList").mockResolvedValue([ownedBundle]);
            const setBundleSkin = vitest_1.vi.spyOn(User_1.User.prototype, "SetBundleSkin").mockResolvedValue();
            await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.setOwnBundleSkin(null, {
                bundleId: Ids_1.BundleId.Brazilian,
            }, { user: playerUser })).resolves.toMatchObject({
                success: true,
                message: "Pacote de skins aplicado a todos os itens.",
            });
            await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.setOwnBundleSkin(null, {
                bundleId: Ids_1.BundleId.Oxidated,
            }, { user: playerUser })).resolves.toMatchObject({
                success: false,
                message: "Você não possui este pacote de skins.",
            });
            (0, vitest_1.expect)(setBundleSkin).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)("activates a skin only when the current user owns the item and bundle", async () => {
            vitest_1.vi.spyOn(User_1.User.prototype, "GetInfo").mockImplementation(async function () {
                return this;
            });
            const itemRecord = { userId: playerUser.userId, itemId: Ids_1.ItemId.Pistol };
            const findUserItem = vitest_1.vi.spyOn(UserItemRepository_1.UserItemRepository, "FindByUserAndItem").mockResolvedValue(itemRecord);
            const ownedBundle = new UserBundle_1.UserBundle();
            ownedBundle.BundleId = Ids_1.BundleId.Brazilian;
            vitest_1.vi.spyOn(UserBundle_1.UserBundle, "GetList").mockResolvedValue([ownedBundle]);
            const setItemSkin = vitest_1.vi.spyOn(User_1.User.prototype, "SetItemSkin").mockResolvedValue();
            await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.setOwnItemSkin(null, {
                itemId: Ids_1.ItemId.Pistol,
                bundleId: Ids_1.BundleId.Brazilian,
            }, { user: playerUser })).resolves.toMatchObject({
                success: true,
                message: "Skin ativada para este item.",
            });
            await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.setOwnItemSkin(null, {
                itemId: Ids_1.ItemId.Pistol,
                bundleId: Ids_1.BundleId.Oxidated,
            }, { user: playerUser })).resolves.toMatchObject({
                success: false,
                message: "Você não possui esta skin.",
            });
            (0, vitest_1.expect)(setItemSkin).toHaveBeenCalledTimes(1);
            findUserItem.mockResolvedValue(null);
            await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.setOwnItemSkin(null, {
                itemId: Ids_1.ItemId.Knife,
                bundleId: Ids_1.BundleId.Brazilian,
            }, { user: playerUser })).resolves.toMatchObject({
                success: false,
                message: "Você não possui este item.",
            });
            (0, vitest_1.expect)(setItemSkin).toHaveBeenCalledTimes(1);
        });
    });
    (0, vitest_1.describe)("Event management resolvers", () => {
        (0, vitest_1.it)("rejects event writes from HELPER users", async () => {
            const createEvent = vitest_1.vi.spyOn(Event_1.Event, "Create");
            await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.createEvent(null, {
                type: Event_1.EventType.JOB_TIME_MULTIPLIER,
                value: 1.5,
                periodStart: "2027-01-01T00:00:00.000Z",
                periodEnd: "2027-01-02T00:00:00.000Z",
            }, { user: helperUser })).rejects.toThrow("Acesso negado: Este papel tem acesso somente leitura.");
            (0, vitest_1.expect)(createEvent).not.toHaveBeenCalled();
        });
        (0, vitest_1.it)("rejects invalid event data without creating a record", async () => {
            const createEvent = vitest_1.vi.spyOn(Event_1.Event, "Create");
            await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.createEvent(null, {
                type: Event_1.EventType.JOB_TIME_MULTIPLIER,
                value: 1.5,
                periodStart: "2027-01-02T00:00:00.000Z",
                periodEnd: "2027-01-01T00:00:00.000Z",
            }, { user: modUser })).resolves.toEqual({ success: false, message: "Dados do evento inválidos." });
            (0, vitest_1.expect)(createEvent).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=ApiAuthAndResolvers.test.js.map