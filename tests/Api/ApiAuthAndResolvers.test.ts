import { afterEach, describe, expect, it, vi } from "vitest";
import { signAuthToken, verifyAuthToken } from "#api/auth/jwt";
import type { AuthUser } from "#api/types";
import { resolvers } from "#api/graphql/resolvers";
import { Dashboard } from "#core/models/Dashboard";
import { Event, EventType } from "#core/models/Event";
import { User } from "#core/models/User";
import { Vault } from "#core/models/Vault";
import { UserRepository } from "#core/repositories/UserRepository";
import { UserItemRepository } from "#core/repositories/UserItemRepository";
import { ItemId } from "#core/types/Ids";

describe("API Auth and Resolvers", () => {
	const devUser: AuthUser = {
		userId: "123456",
		username: "DevTester",
		avatar: null,
		role: "DEVELOPER",
	};

	const modUser: AuthUser = {
		userId: "654321",
		username: "ModTester",
		avatar: null,
		role: "MODERATOR",
	};

	const helperUser: AuthUser = {
		userId: "789012",
		username: "HelperTester",
		avatar: null,
		role: "HELPER",
	};

	afterEach(() => vi.restoreAllMocks());

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

		it("should return null for an invalid token", () => {
			const decoded = verifyAuthToken("invalid.token.here");
			expect(decoded).toBeNull();
		});
	});

	describe("RBAC Permissions on GraphQL Resolvers", () => {
		it("should reject queries when unauthenticated", async () => {
			await expect(resolvers.Query.dashboardStats(null, {}, { user: null })).rejects.toThrow(
				"Authentication required to perform this action.",
			);
		});

		it("should reject mutations when unauthenticated", async () => {
			await expect(
				resolvers.Mutation.cureUser(null, { userId: "target123" }, { user: null }),
			).rejects.toThrow("Authentication required to perform this action.");
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
			).resolves.toMatchObject({ success: false, message: "User not found." });
		});

		it("should reject mutations when user is HELPER (read-only)", async () => {
			await expect(
				resolvers.Mutation.cureUser(null, { userId: "target123" }, { user: helperUser }),
			).rejects.toThrow("Forbidden: This role has read-only access.");
		});

		it("should allow developers to delete users", async () => {
			const deleteUser = vi.spyOn(UserRepository, "DeleteUser").mockResolvedValue(true);

			await expect(
				resolvers.Mutation.deleteUser(null, { userId: "target123" }, { user: devUser }),
			).resolves.toMatchObject({
				success: true,
				message: "User and all related data deleted.",
			});
			expect(deleteUser).toHaveBeenCalledWith("target123");
		});

		it("should reject user deletion from moderators", async () => {
			const deleteUser = vi.spyOn(UserRepository, "DeleteUser");

			await expect(
				resolvers.Mutation.deleteUser(null, { userId: "target123" }, { user: modUser }),
			).rejects.toThrow("Forbidden: Developer access required.");
			expect(deleteUser).not.toHaveBeenCalled();
		});

		it("should reject setMoney when user is HELPER", async () => {
			await expect(
				resolvers.Mutation.setMoney(null, { userId: "target123", amount: 1000, mode: "ADD" }, { user: helperUser }),
			).rejects.toThrow("Forbidden: This role has read-only access.");
		});

		it("should reject non-integer and unsafe setMoney amounts", async () => {
			const getInfo = vi.spyOn(User.prototype, "GetInfo");

			for (const amount of [1000.5, Number.MAX_SAFE_INTEGER + 1]) {
				await expect(
					resolvers.Mutation.setMoney(null, { userId: "target123", amount, mode: "ADD" }, { user: modUser }),
				).resolves.toMatchObject({
					success: false,
					message: "Money amount must be a safe integer.",
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
					message: "Special coin amount must be a safe integer.",
				});
			}

			expect(getInfo).not.toHaveBeenCalled();
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
			).rejects.toThrow("Forbidden: This role has read-only access.");

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
			).resolves.toEqual({ success: false, message: "Invalid event data." });

			expect(createEvent).not.toHaveBeenCalled();
		});
	});
});
