import { afterEach, describe, expect, it, vi } from "vitest";
import { resolvers } from "#api/graphql/resolvers";
import { AdminAuditLog } from "#core/models/AdminAuditLog";
import { UserRepository } from "#core/repositories/UserRepository";
import { AdminAuditActionId, AdminAuditSettingId } from "#core/types/AdminAuditLog";

const { mockClient } = vi.hoisted(() => ({
	mockClient: {
		guilds: {
			cache: {
				get: vi.fn(() => undefined),
			},
			fetch: vi.fn().mockResolvedValue({
				members: {
					fetch: vi.fn(async ({ user }: { user: string }) => ({
						displayName: `Current ${user}`,
						displayAvatarURL: () => `https://cdn.example/${user}.png`,
					})),
				},
			}),
		},
		users: {
			fetch: vi.fn(async (userId: string) => ({
				globalName: `Global ${userId}`,
				username: userId,
				displayAvatarURL: () => `https://cdn.example/${userId}.png`,
			})),
		},
	},
}));

vi.mock("#bot/client", () => ({
	getClient: () => mockClient,
}));

describe("Admin audit log resolver", () => {
	afterEach(() => vi.restoreAllMocks());

	it("resolves current admin and target names from their IDs", async () => {
		vi.stubEnv("SERVER_ID", "guild123");
		vi.spyOn(AdminAuditLog, "GetPage").mockResolvedValue({
			total: 1,
			entries: [{
				id: 1,
				adminId: "111",
				adminIpAddress: "203.0.113.5",
				adminDeviceType: "Desktop",
				adminOperatingSystem: "Windows",
				adminBrowser: "Edge",
				actionId: AdminAuditActionId.SetMoney,
				targetUserId: "222",
				targetSettingId: null,
				previousValue: "1",
				newValue: "2",
				createdAt: new Date("2026-01-01T00:00:00.000Z"),
			}],
		});
		vi.spyOn(UserRepository, "FindById").mockResolvedValue({ id: "222", nickname: "Current game nickname" } as never);

		const result = await resolvers.Query.adminAuditLogs(null, {}, {
			user: { userId: "111", username: "Old name", avatar: null, role: "DEVELOPER" },
		});

		expect(result.entries[0]).toMatchObject({
			adminName: "Current 111",
			adminAvatarUrl: "https://cdn.example/111.png",
			targetUserName: "Current game nickname",
			targetUserAvatarUrl: "https://cdn.example/222.png",
			actionId: AdminAuditActionId.SetMoney,
			targetSettingId: null,
		});
		expect(result.entries[0]).not.toHaveProperty("adminName", "Old name");
	});

	it("returns setting target IDs without requesting a game user", async () => {
		vi.spyOn(AdminAuditLog, "GetPage").mockResolvedValue({
			total: 1,
			entries: [{
				id: 2,
				adminId: "111",
				adminIpAddress: null,
				adminDeviceType: null,
				adminOperatingSystem: null,
				adminBrowser: null,
				actionId: AdminAuditActionId.SetMainHeistAllowed,
				targetUserId: null,
				targetSettingId: AdminAuditSettingId.MainHeist,
				previousValue: "true",
				newValue: "false",
				createdAt: new Date("2026-01-01T00:00:00.000Z"),
			}],
		});
		const findUser = vi.spyOn(UserRepository, "FindById");

		const result = await resolvers.Query.adminAuditLogs(null, {}, {
			user: { userId: "111", username: "Old name", avatar: null, role: "DEVELOPER" },
		});

		expect(result.entries[0]).toMatchObject({
			targetUserName: null,
			targetSettingId: AdminAuditSettingId.MainHeist,
		});
		expect(findUser).not.toHaveBeenCalled();
	});

	it("passes the selected action ID to the paginated query", async () => {
		const getPage = vi.spyOn(AdminAuditLog, "GetPage").mockResolvedValue({ entries: [], total: 0 });

		await resolvers.Query.adminAuditLogs(null, { actionId: AdminAuditActionId.SetMoney }, {
			user: { userId: "111", username: "Developer", avatar: null, role: "DEVELOPER" },
		});

		expect(getPage).toHaveBeenCalledWith(25, 0, AdminAuditActionId.SetMoney);
	});

	it("allows moderators to read audit logs without request metadata", async () => {
		vi.spyOn(AdminAuditLog, "GetPage").mockResolvedValue({
			total: 1,
			entries: [{
				id: 3,
				adminId: "111",
				adminIpAddress: "203.0.113.5",
				adminDeviceType: "Desktop",
				adminOperatingSystem: "Windows",
				adminBrowser: "Edge",
				actionId: AdminAuditActionId.SetMoney,
				targetUserId: null,
				targetSettingId: null,
				previousValue: "1",
				newValue: "2",
				createdAt: new Date("2026-01-01T00:00:00.000Z"),
			}],
		});

		const result = await resolvers.Query.adminAuditLogs(null, {}, {
			user: { userId: "333", username: "Moderator", avatar: null, role: "MODERATOR" },
		});

		expect(result.entries[0]).toMatchObject({
			adminIpAddress: null,
			adminDeviceType: null,
			adminOperatingSystem: null,
			adminBrowser: null,
		});
	});

	afterEach(() => vi.unstubAllEnvs());
});
