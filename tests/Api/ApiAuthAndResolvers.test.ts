import { describe, expect, it, vi, beforeEach } from "vitest";
import { signAuthToken, verifyAuthToken } from "#api/auth/jwt";
import type { AuthUser } from "#api/types";
import { resolvers } from "#api/graphql/resolvers";

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

		it("should reject mutations when user is MODERATOR (read-only)", async () => {
			await expect(
				resolvers.Mutation.cureUser(null, { userId: "target123" }, { user: modUser }),
			).rejects.toThrow("Forbidden: Moderators have read-only access.");
		});

		it("should reject setMoney when user is MODERATOR", async () => {
			await expect(
				resolvers.Mutation.setMoney(null, { userId: "target123", amount: 1000, mode: "ADD" }, { user: modUser }),
			).rejects.toThrow("Forbidden: Moderators have read-only access.");
		});
	});
});
