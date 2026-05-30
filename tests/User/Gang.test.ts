import { describe, it, expect, vi } from "vitest";
import { Gang } from "#core/models/Gang";

// Mock the database models used by Gang
vi.mock("#core/database/GangMembers", () => ({
	GangMembers: {
		findAll: vi.fn(() => Promise.resolve([
			{ userId: "user_leader", roleId: 1, depositTime: new Date(), depositAmount: 100 },
			{ userId: "user_high_permission", roleId: 2, depositTime: new Date(), depositAmount: 200 },
			{ userId: "user_mid_permission", roleId: 3, depositTime: new Date(), depositAmount: 300 },
		])),
	},
}));

vi.mock("#core/database/Users", () => ({
	Users: {
		findByPk: vi.fn((id: string) => {
			if (id === "user_leader") {
				return Promise.resolve({ id: "user_leader", nickname: "LeaderUser" });
			}
			if (id === "user_high_permission") {
				return Promise.resolve({ id: "user_high_permission", nickname: "HighPermUser" });
			}
			if (id === "user_mid_permission") {
				return Promise.resolve({ id: "user_mid_permission", nickname: "MidPermUser" });
			}
			return Promise.resolve(null);
		}),
	},
}));

vi.mock("#core/database/GangRoles", () => ({
	GangRoles: {
		findByPk: vi.fn((roleId: number) => {
			if (roleId === 1) {
				// Leader with 0 permissions (for test purposes to verify Leader is still first)
				return Promise.resolve({
					id: 1,
					name: "Leader",
					canInvite: false,
					canKick: false,
					canPromote: false,
					canEditGang: false,
				});
			}
			if (roleId === 2) {
				// Member with 4 permissions
				return Promise.resolve({
					id: 2,
					name: "Co-Leader",
					canInvite: true,
					canKick: true,
					canPromote: true,
					canEditGang: true,
				});
			}
			if (roleId === 3) {
				// Member with 2 permissions
				return Promise.resolve({
					id: 3,
					name: "Officer",
					canInvite: true,
					canKick: true,
					canPromote: false,
					canEditGang: false,
				});
			}
			return Promise.resolve(null);
		}),
	},
}));

vi.mock("#core/database/Gangs", () => ({
	Gangs: {},
}));

describe("Gang Model - Member Sorting", () => {
	it("should sort the Leader first, then others by permission count descending", async () => {
		const gang = new Gang();
		gang.Id = 1;
		gang.LeaderId = "user_leader";

		await gang.LoadMembers();

		expect(gang.Members.length).toBe(3);

		// The leader should be first, even though they have 0 permissions compared to others
		expect(gang.Members[0].UserId).toBe("user_leader");
		expect(gang.Members[0].PermissionCount).toBe(0);

		// The second should be HighPermUser (4 permissions)
		expect(gang.Members[1].UserId).toBe("user_high_permission");
		expect(gang.Members[1].PermissionCount).toBe(4);

		// The third should be MidPermUser (2 permissions)
		expect(gang.Members[2].UserId).toBe("user_mid_permission");
		expect(gang.Members[2].PermissionCount).toBe(2);
	});
});
