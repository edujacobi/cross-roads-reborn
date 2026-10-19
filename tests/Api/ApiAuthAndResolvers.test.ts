import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signAuthToken, verifyAuthToken } from "#api/auth/jwt";
import type { AuthUser } from "#api/types";
import { resolvers } from "#api/graphql/resolvers";
import { AdminAuditLog } from "#core/models/AdminAuditLog";
import { Dashboard } from "#core/models/Dashboard";
import { Event, EventType } from "#core/models/Event";
import { SituationId, User } from "#core/models/User";
import { UserAvatarDecoration } from "#core/models/UserAvatarDecoration";
import { UserBackgroundDecoration } from "#core/models/UserBackgroundDecoration";
import { UserBundle } from "#core/models/UserBundle";
import { Vault } from "#core/models/Vault";
import { UserRepository } from "#core/repositories/UserRepository";
import { UserItemRepository } from "#core/repositories/UserItemRepository";
import { AvatarDecorationId, BackgroundDecorationId, BundleId, ItemId } from "#core/types/Ids";

describe("API Auth and Resolvers", () => {
	const devUser: AuthUser = {
		userId: "123456",
		username: "DevTester",
		avatar: null,
		role: "DEVELOPER",
		situationId: SituationId.Idling,
	};

	const modUser: AuthUser = {
		userId: "654321",
		username: "ModTester",
		avatar: null,
		role: "MODERATOR",
		situationId: SituationId.Idling,
	};

	const helperUser: AuthUser = {
		userId: "789012",
		username: "HelperTester",
		avatar: null,
		role: "HELPER",
		situationId: SituationId.Idling,
	};

	const playerUser: AuthUser = {
		userId: "456789",
		username: "PlayerTester",
		avatar: null,
		role: "PLAYER",
		situationId: SituationId.Idling,
	};

	afterEach(() => vi.restoreAllMocks());
	beforeEach(() => {
		vi.spyOn(AdminAuditLog, "Record").mockResolvedValue();
	});

	describe("JWT Signing and Verification", () => {
		it("should correctly sign and verify a token for a developer", () => {
			const token = signAuthToken(devUser);
			expect(token).toBeDefined();

			const decoded = verifyAuthToken(token);
			expect(decoded).not.toBeNull();
			expect(decoded?.userId).toBe(devUser.userId);
			expect(decoded?.role).toBe("DEVELOPER");
		});

		it("should correctly sign and verify a token for a moderator", () => {
			const token = signAuthToken(modUser);
			const decoded = verifyAuthToken(token);
			expect(decoded).not.toBeNull();
			expect(decoded?.userId).toBe(modUser.userId);
			expect(decoded?.role).toBe("MODERATOR");
		});

		it("should correctly sign and verify a token for a helper", () => {
			const token = signAuthToken(helperUser);
			const decoded = verifyAuthToken(token);
			expect(decoded).not.toBeNull();
			expect(decoded?.userId).toBe(helperUser.userId);
			expect(decoded?.role).toBe("HELPER");
		});

		it("should correctly sign and verify a token for a player", () => {
			const token = signAuthToken(playerUser);
			const decoded = verifyAuthToken(token);
			expect(decoded).not.toBeNull();
			expect(decoded?.userId).toBe(playerUser.userId);
			expect(decoded?.role).toBe("PLAYER");
		});

		it("should return null for an invalid token", () => {
			const decoded = verifyAuthToken("invalid.token.here");
			expect(decoded).toBeNull();
		});
	});

	describe("RBAC Permissions on GraphQL Resolvers", () => {
		it("should reject queries when unauthenticated", async () => {
			await expect(resolvers.Query.dashboardStats(null, {}, { user: null })).rejects.toThrow(
				"Autenticação necessária para realizar esta ação.",
			);
		});

		it("should reject admin queries from players", async () => {
			await expect(
				resolvers.Query.dashboardStats(null, {}, { user: playerUser }),
			).rejects.toThrow("Acesso negado: É necessário acesso de administrador.");
		});

		it("should reject VIP filtering from players", async () => {
			await expect(
				resolvers.Query.users(null, { vipOnly: true }, { user: playerUser }),
			).rejects.toThrow("Acesso negado: Filtragem VIP é restrita a administradores.");
		});

		it("allows Developers and moderators to read audit logs, but rejects helpers", async () => {
			const getPage = vi.spyOn(AdminAuditLog, "GetPage").mockResolvedValue({ entries: [], total: 0 });

			await expect(
				resolvers.Query.adminAuditLogs(null, {}, { user: helperUser }),
			).rejects.toThrow("Forbidden: Audit log access required.");

			await expect(
				resolvers.Query.adminAuditLogs(null, { limit: 250, offset: -5 }, { user: devUser }),
			).resolves.toEqual({ entries: [], total: 0 });
			expect(getPage).toHaveBeenCalledWith(100, 0, undefined);

			await expect(
				resolvers.Query.adminAuditLogs(null, {}, { user: modUser }),
			).resolves.toMatchObject({ entries: [], total: 0 });
		});

		it("should reject mutations when unauthenticated", async () => {
			await expect(
				resolvers.Mutation.cureUser(null, { userId: "target123" }, { user: null }),
			).rejects.toThrow("Autenticação necessária para realizar esta ação.");
		});

		it("should allow dashboard queries when user is HELPER", async () => {
			vi.spyOn(Dashboard, "GetCurrentStats").mockResolvedValue({
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
			vi.spyOn(Vault, "GetBalances").mockResolvedValue({ bank: 0, casino: 0 });

			await expect(
				resolvers.Query.dashboardStats(null, {}, { user: helperUser }),
			).resolves.toMatchObject({
				totalPlayers: 0,
				classCounts: [],
				bankVaultValue: 0,
				casinoVaultValue: 0,
			});
		});

		it("should return item user counts for dashboard", async () => {
			const countUsersWithItem = vi.spyOn(UserItemRepository, "CountUsersWithItem").mockResolvedValue(7);

			await expect(
				resolvers.Query.dashboardItemPopularity(null, {}, { user: helperUser }),
			).resolves.toContainEqual({
				itemId: ItemId.Knife,
				name: "Faca",
				userCount: 7,
			});
			expect(countUsersWithItem).toHaveBeenCalledWith(ItemId.Knife);
		});

		it("should allow mutations when user is MODERATOR", async () => {
			vi.spyOn(User.prototype, "GetInfo").mockResolvedValue(null);
			await expect(
				resolvers.Mutation.cureUser(null, { userId: "target123" }, { user: modUser }),
			).resolves.toMatchObject({ success: false, message: "Usuário não encontrado." });
		});

		it("should reject mutations when user is HELPER (read-only)", async () => {
			await expect(
				resolvers.Mutation.cureUser(null, { userId: "target123" }, { user: helperUser }),
			).rejects.toThrow("Acesso negado: Este papel tem acesso somente leitura.");
		});

		it("should allow developers to delete users", async () => {
			const deleteUser = vi.spyOn(UserRepository, "DeleteUser").mockResolvedValue(true);

			await expect(
				resolvers.Mutation.deleteUser(null, { userId: "target123" }, { user: devUser }),
			).resolves.toMatchObject({
				success: true,
				message: "Usuário e todos os dados relacionados foram excluídos.",
			});
			expect(deleteUser).toHaveBeenCalledWith("target123");
		});

		it("should reject user deletion from moderators", async () => {
			const deleteUser = vi.spyOn(UserRepository, "DeleteUser");

			await expect(
				resolvers.Mutation.deleteUser(null, { userId: "target123" }, { user: modUser }),
			).rejects.toThrow("Acesso negado: É necessário acesso de desenvolvedor.");
			expect(deleteUser).not.toHaveBeenCalled();
		});

		it("should reject setMoney when user is HELPER", async () => {
			await expect(
				resolvers.Mutation.setMoney(null, {
					userId: "target123",
					amount: 1000,
					mode: "ADD",
				}, { user: helperUser }),
			).rejects.toThrow("Acesso negado: Este papel tem acesso somente leitura.");
		});

		it("should reject non-integer and unsafe setMoney amounts", async () => {
			const getInfo = vi.spyOn(User.prototype, "GetInfo");

			for (const amount of [1000.5, Number.MAX_SAFE_INTEGER + 1]) {
				await expect(
					resolvers.Mutation.setMoney(null, { userId: "target123", amount, mode: "ADD" }, { user: modUser }),
				).resolves.toMatchObject({
					success: false,
					message: "O valor do dinheiro deve ser um número inteiro válido.",
				});
			}

			expect(getInfo).not.toHaveBeenCalled();
		});

		it("should reject non-integer and unsafe special coin amounts", async () => {
			const getInfo = vi.spyOn(User.prototype, "GetInfo");

			for (const amount of [1000.5, Number.MAX_SAFE_INTEGER + 1]) {
				await expect(
					resolvers.Mutation.addSpecialCoins(null, { userId: "target123", amount }, { user: modUser }),
				).resolves.toMatchObject({
					success: false,
					message: "O valor de moedas especiais deve ser um número inteiro válido.",
				});
			}

			expect(getInfo).not.toHaveBeenCalled();
		});

		it("requires authentication for the special shop, decorations, and skins", async () => {
			await expect(resolvers.Query.specialShop(null, {}, { user: null })).rejects.toThrow(
				"Autenticação necessária para realizar esta ação.",
			);
			await expect(
				resolvers.Mutation.buySpecialShopVip(null, { days: 7 }, { user: null }),
			).rejects.toThrow("Autenticação necessária para realizar esta ação.");
			await expect(
				resolvers.Mutation.setOwnDecoration(null, {
					type: "AVATAR",
					decorationId: AvatarDecorationId.Purple,
				}, { user: null }),
			).rejects.toThrow("Autenticação necessária para realizar esta ação.");
			await expect(
				resolvers.Query.myDecorations(null, {}, { user: null }),
			).rejects.toThrow("Autenticação necessária para realizar esta ação.");
			await expect(
				resolvers.Query.mySkinBundles(null, {}, { user: null }),
			).rejects.toThrow("Autenticação necessária para realizar esta ação.");
			await expect(
				resolvers.Mutation.setOwnBundleSkin(null, {
					bundleId: BundleId.Brazilian,
				}, { user: null }),
			).rejects.toThrow("Autenticação necessária para realizar esta ação.");
			await expect(
				resolvers.Mutation.setOwnItemSkin(null, {
					itemId: ItemId.Pistol,
					bundleId: BundleId.Brazilian,
				}, { user: null }),
			).rejects.toThrow("Autenticação necessária para realizar esta ação.");
		});

		it("lists owned skin bundles with the special shop previews", async () => {
			const defaultBundle = new UserBundle();
			defaultBundle.Description = "Padrão";
			const ownedBundle = new UserBundle();
			ownedBundle.BundleId = BundleId.Brazilian;
			ownedBundle.Description = "Brasileiro";
			vi.spyOn(UserBundle, "GetList").mockResolvedValue([defaultBundle, ownedBundle]);

			const bundles = await resolvers.Query.mySkinBundles(null, {}, { user: playerUser });

			expect(bundles).toHaveLength(2);
			expect(bundles).toContainEqual(expect.objectContaining({
				id: BundleId.Brazilian,
				name: "Brasileiro",
				skins: expect.arrayContaining([
					expect.objectContaining({
						itemId: ItemId.Pistol,
						imagePath: "/images/items/1_Pistol_Brazilian.png",
					}),
				]),
			}));
		});

		it("lists owned decorations with their profile preview classes", async () => {
			vi.spyOn(User.prototype, "GetInfo").mockImplementation(async function(this: User) {
				return this;
			});
			const avatar = new UserAvatarDecoration();
			avatar.AvatarDecorationId = AvatarDecorationId.Purple;
			const background = new UserBackgroundDecoration();
			background.BackgroundDecorationId = BackgroundDecorationId.Sunset;
			vi.spyOn(UserAvatarDecoration, "GetList").mockResolvedValue([avatar]);
			vi.spyOn(UserBackgroundDecoration, "GetList").mockResolvedValue([background]);

			await expect(
				resolvers.Query.myDecorations(null, {}, { user: playerUser }),
			).resolves.toEqual({
				avatarDecorations: [{ id: AvatarDecorationId.Purple, name: "Púrpura", className: "purple" }],
				backgroundDecorations: [{ id: BackgroundDecorationId.Sunset, name: "Pôr do sol", className: "sunset" }],
			});
		});

		it("returns products from the canonical shop catalogs", async () => {
			vi.spyOn(User.prototype, "GetInfo").mockImplementation(async function(this: User) {
				return this;
			});
			vi.spyOn(UserBundle, "GetList").mockResolvedValue([]);
			vi.spyOn(UserAvatarDecoration, "GetList").mockResolvedValue([]);
			vi.spyOn(UserBackgroundDecoration, "GetList").mockResolvedValue([]);

			const catalog = await resolvers.Query.specialShop(null, {}, { user: playerUser });

			expect(catalog.vipPricePerDay).toBe(170);
			expect(catalog.vipMinimumDays).toBe(7);
			expect(catalog.skinBundles).toContainEqual(expect.objectContaining({
				id: BundleId.Brazilian,
				name: "Brasileiro",
				price: 2_000,
				owned: false,
				skins: expect.arrayContaining([
					expect.objectContaining({
						itemId: ItemId.Pistol,
						imagePath: "/images/items/1_Pistol_Brazilian.png",
					}),
				]),
			}));
			expect(catalog.avatarDecorations).toContainEqual(expect.objectContaining({
				id: AvatarDecorationId.Purple,
				name: "Púrpura",
				price: 1_000,
			}));
		});

		it("does not buy VIP when the player cannot afford the selected duration", async () => {
			vi.spyOn(User.prototype, "GetInfo").mockImplementation(async function(this: User) {
				this.SpecialCoin = 1_189;
				return this;
			});
			const buyVip = vi.spyOn(User.prototype, "BuyVipForDays").mockResolvedValue(true);

			await expect(
				resolvers.Mutation.buySpecialShopVip(null, { days: 7 }, { user: playerUser }),
			).resolves.toMatchObject({
				success: false,
				message: "Saldo insuficiente de Moedas Especiais.",
			});
			expect(buyVip).not.toHaveBeenCalled();
		});

		it("requires at least seven whole days when buying VIP", async () => {
			vi.spyOn(User.prototype, "GetInfo").mockImplementation(async function(this: User) {
				this.SpecialCoin = 10_000;
				return this;
			});
			const buyVip = vi.spyOn(User.prototype, "BuyVipForDays").mockResolvedValue(true);

			await expect(
				resolvers.Mutation.buySpecialShopVip(null, { days: 6 }, { user: playerUser }),
			).resolves.toMatchObject({
				success: false,
				message: "O VIP deve ser comprado por pelo menos 7 dias.",
			});
			expect(buyVip).not.toHaveBeenCalled();
		});

		it("charges 170 special coins per VIP day", async () => {
			vi.spyOn(User.prototype, "GetInfo").mockImplementation(async function(this: User) {
				this.SpecialCoin = 1_190;
				return this;
			});
			const buyVip = vi.spyOn(User.prototype, "BuyVipForDays").mockResolvedValue(true);

			await expect(
				resolvers.Mutation.buySpecialShopVip(null, { days: 7 }, { user: playerUser }),
			).resolves.toMatchObject({
				success: true,
				message: "Você comprou 7 dias de VIP!",
			});
			expect(buyVip).toHaveBeenCalledWith(7);
		});

		it("deducts the day-based VIP price and adds the selected time", async () => {
			const player = new User(playerUser.userId);
			player.SpecialCoin = 1_190;
			const update = vi.spyOn(User.prototype, "Update").mockResolvedValue(true);
			const addVip = vi.spyOn(User.prototype, "AddVip").mockResolvedValue();

			await expect(player.BuyVipForDays(7)).resolves.toBe(true);

			expect(player.SpecialCoin).toBe(0);
			expect(update).toHaveBeenCalledWith({ specialCoin: 0 });
			expect(addVip).toHaveBeenCalledWith(7);
		});

		it("buys an available avatar decoration and charges through the user model", async () => {
			vi.spyOn(User.prototype, "GetInfo").mockImplementation(async function(this: User) {
				this.SpecialCoin = 1_000;
				return this;
			});
			vi.spyOn(UserAvatarDecoration, "HasAvatarDecoration").mockResolvedValue(false);
			const buyAvatarDecoration = vi.spyOn(User.prototype, "BuyAvatarDecoration").mockResolvedValue(true);

			await expect(
				resolvers.Mutation.buySpecialShopItem(null, {
					type: "AVATAR_DECORATION",
					itemId: AvatarDecorationId.Purple,
				}, { user: playerUser }),
			).resolves.toMatchObject({
				success: true,
				message: "Você comprou Púrpura!",
			});
			expect(buyAvatarDecoration).toHaveBeenCalledWith(AvatarDecorationId.Purple);
		});

		it("only equips decorations that the current user owns", async () => {
			vi.spyOn(User.prototype, "GetInfo").mockImplementation(async function(this: User) {
				return this;
			});
			const ownedDecoration = new UserAvatarDecoration();
			ownedDecoration.AvatarDecorationId = AvatarDecorationId.Purple;
			vi.spyOn(UserAvatarDecoration, "GetList").mockResolvedValue([ownedDecoration]);
			const setAvatarDecoration = vi.spyOn(User.prototype, "SetAvatarDecoration").mockResolvedValue(true);

			await expect(
				resolvers.Mutation.setOwnDecoration(null, {
					type: "AVATAR",
					decorationId: AvatarDecorationId.Purple,
				}, { user: playerUser }),
			).resolves.toMatchObject({
				success: true,
				message: "Decoração de avatar atualizada.",
			});
			await expect(
				resolvers.Mutation.setOwnDecoration(null, {
					type: "AVATAR",
					decorationId: AvatarDecorationId.Sunset,
				}, { user: playerUser }),
			).resolves.toMatchObject({
				success: false,
				message: "Você não possui esta decoração de avatar.",
			});
			expect(setAvatarDecoration).toHaveBeenCalledTimes(1);

			const ownedBackground = new UserBackgroundDecoration();
			ownedBackground.BackgroundDecorationId = BackgroundDecorationId.Sunset;
			vi.spyOn(UserBackgroundDecoration, "GetList").mockResolvedValue([ownedBackground]);
			const setBackgroundDecoration = vi.spyOn(User.prototype, "SetBackgroundDecoration").mockResolvedValue(true);

			await expect(
				resolvers.Mutation.setOwnDecoration(null, {
					type: "BACKGROUND",
					decorationId: BackgroundDecorationId.Sunset,
				}, { user: playerUser }),
			).resolves.toMatchObject({
				success: true,
				message: "Decoração de fundo atualizada.",
			});
			await expect(
				resolvers.Mutation.setOwnDecoration(null, {
					type: "BACKGROUND",
					decorationId: BackgroundDecorationId.Purple,
				}, { user: playerUser }),
			).resolves.toMatchObject({
				success: false,
				message: "Você não possui esta decoração de fundo.",
			});
			expect(setBackgroundDecoration).toHaveBeenCalledTimes(1);
		});

		it("applies all skins in a bundle only when the user owns that bundle", async () => {
			vi.spyOn(User.prototype, "GetInfo").mockImplementation(async function(this: User) {
				return this;
			});
			const ownedBundle = new UserBundle();
			ownedBundle.BundleId = BundleId.Brazilian;
			vi.spyOn(UserBundle, "GetList").mockResolvedValue([ownedBundle]);
			const setBundleSkin = vi.spyOn(User.prototype, "SetBundleSkin").mockResolvedValue();

			await expect(
				resolvers.Mutation.setOwnBundleSkin(null, {
					bundleId: BundleId.Brazilian,
				}, { user: playerUser }),
			).resolves.toMatchObject({
				success: true,
				message: "Pacote de skins aplicado a todos os itens.",
			});
			await expect(
				resolvers.Mutation.setOwnBundleSkin(null, {
					bundleId: BundleId.Oxidated,
				}, { user: playerUser }),
			).resolves.toMatchObject({
				success: false,
				message: "Você não possui este pacote de skins.",
			});
			expect(setBundleSkin).toHaveBeenCalledTimes(1);
		});

		it("activates a skin only when the current user owns the item and bundle", async () => {
			vi.spyOn(User.prototype, "GetInfo").mockImplementation(async function(this: User) {
				return this;
			});
			const itemRecord = { userId: playerUser.userId, itemId: ItemId.Pistol };
			const findUserItem = vi.spyOn(UserItemRepository, "FindByUserAndItem").mockResolvedValue(itemRecord as never);
			const ownedBundle = new UserBundle();
			ownedBundle.BundleId = BundleId.Brazilian;
			vi.spyOn(UserBundle, "GetList").mockResolvedValue([ownedBundle]);
			const setItemSkin = vi.spyOn(User.prototype, "SetItemSkin").mockResolvedValue();

			await expect(
				resolvers.Mutation.setOwnItemSkin(null, {
					itemId: ItemId.Pistol,
					bundleId: BundleId.Brazilian,
				}, { user: playerUser }),
			).resolves.toMatchObject({
				success: true,
				message: "Skin ativada para este item.",
			});
			await expect(
				resolvers.Mutation.setOwnItemSkin(null, {
					itemId: ItemId.Pistol,
					bundleId: BundleId.Oxidated,
				}, { user: playerUser }),
			).resolves.toMatchObject({
				success: false,
				message: "Você não possui esta skin.",
			});
			expect(setItemSkin).toHaveBeenCalledTimes(1);

			findUserItem.mockResolvedValue(null);
			await expect(
				resolvers.Mutation.setOwnItemSkin(null, {
					itemId: ItemId.Knife,
					bundleId: BundleId.Brazilian,
				}, { user: playerUser }),
			).resolves.toMatchObject({
				success: false,
				message: "Você não possui este item.",
			});
			expect(setItemSkin).toHaveBeenCalledTimes(1);
		});
	});

	describe("Event management resolvers", () => {
		it("rejects event writes from HELPER users", async () => {
			const createEvent = vi.spyOn(Event, "Create");

			await expect(
				resolvers.Mutation.createEvent(null, {
					type: EventType.JOB_TIME_MULTIPLIER,
					value: 1.5,
					periodStart: "2027-01-01T00:00:00.000Z",
					periodEnd: "2027-01-02T00:00:00.000Z",
				}, { user: helperUser }),
			).rejects.toThrow("Acesso negado: Este papel tem acesso somente leitura.");

			expect(createEvent).not.toHaveBeenCalled();
		});

		it("rejects invalid event data without creating a record", async () => {
			const createEvent = vi.spyOn(Event, "Create");

			await expect(
				resolvers.Mutation.createEvent(null, {
					type: EventType.JOB_TIME_MULTIPLIER,
					value: 1.5,
					periodStart: "2027-01-02T00:00:00.000Z",
					periodEnd: "2027-01-01T00:00:00.000Z",
				}, { user: modUser }),
			).resolves.toEqual({ success: false, message: "Dados do evento inválidos." });

			expect(createEvent).not.toHaveBeenCalled();
		});
	});
});
