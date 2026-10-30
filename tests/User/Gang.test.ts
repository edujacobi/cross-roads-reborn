import { describe, it, expect, vi } from "vitest";
import { Gang, GangPermission } from "#core/models/Gang";
import { GangMemberRepository } from "#core/repositories/GangMemberRepository";
import { GangJoinRequestsRepository } from "#core/repositories/GangJoinRequestsRepository";
import { GangRepository } from "#core/repositories/GangRepository";
import { GangJoinRequests } from "#core/database/GangJoinRequests";
import { User } from "#core/models/User";
import { WebPush } from "#core/models/WebPush";
import { GangBaseId } from "#core/types/GangBases";
import { GangRecruitmentType, GangJoinRequestStatus } from "#core/types/GangRecruitment";

// Mock the database models used by Gang
vi.mock("#core/database/GangMembers", () => ({
	GangMembers: {
		findAll: vi.fn(() => Promise.resolve([
			{ userId: "user_leader", roleId: 1, depositTime: new Date(), depositAmount: 100 },
			{ userId: "user_high_permission", roleId: 2, depositTime: new Date(), depositAmount: 200 },
			{ userId: "user_mid_permission", roleId: 3, depositTime: new Date(), depositAmount: 300 },
		])),
		create: vi.fn((values: object) => Promise.resolve(values)),
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

describe("Gang Model - Joining", () => {
	it("rejects an application when another pending request wins the database race", async () => {
		const gang = new Gang();
		gang.Id = 1;
		gang.LeaderId = "leader";
		gang.RecruitmentType = GangRecruitmentType.Approval;
		const applicant = new User("applicant");
		applicant.Money = gang.GetJoinCost();

		vi.spyOn(GangMemberRepository, "FindByUserId").mockResolvedValue(null);
		vi.spyOn(GangJoinRequestsRepository, "FindActiveByUser").mockResolvedValue(null);
		vi.spyOn(GangJoinRequestsRepository, "CreateRequest").mockResolvedValue(null);
		const send = vi.spyOn(WebPush, "Send").mockResolvedValue();

		try {
			await expect(gang.ApplyToGang(applicant)).resolves.toEqual({
				success: false,
				reason: "alreadyHasPendingRequest",
			});
			expect(send).not.toHaveBeenCalled();
		}
		finally {
			vi.restoreAllMocks();
		}
	});

	it("rejects an application when the applicant cannot afford the join cost", async () => {
		const gang = new Gang();
		gang.Id = 1;
		gang.Level = 2;
		gang.RecruitmentType = GangRecruitmentType.Approval;
		const applicant = new User("applicant");
		applicant.Money = gang.GetJoinCost() - 1;

		vi.spyOn(GangMemberRepository, "FindByUserId").mockResolvedValue(null);
		const createRequest = vi.spyOn(GangJoinRequestsRepository, "CreateRequest");

		try {
			await expect(gang.ApplyToGang(applicant)).resolves.toEqual({ success: false, reason: "notEnoughMoney" });
			expect(createRequest).not.toHaveBeenCalled();
		}
		finally {
			vi.restoreAllMocks();
		}
	});

	it("does not resolve a request another action already changed", async () => {
		const gang = new Gang();
		gang.Id = 1;
		gang.LeaderId = "leader";
		const request = GangJoinRequests.build({
			id: 1,
			gangId: gang.Id,
			userId: "applicant",
			status: GangJoinRequestStatus.Pending,
		});
		vi.spyOn(GangJoinRequestsRepository, "FindById").mockResolvedValue(request);
		const updateStatus = vi.spyOn(GangJoinRequestsRepository, "UpdateStatusIfCurrent").mockResolvedValue(false);
		const send = vi.spyOn(WebPush, "Send").mockResolvedValue();

		try {
			await expect(gang.ResolveJoinRequest(new User("leader"), 1, false)).resolves.toEqual({
				success: false,
				reason: "requestNotFound",
			});
			expect(updateStatus).toHaveBeenCalledWith(
				1,
				GangJoinRequestStatus.Pending,
				GangJoinRequestStatus.Rejected,
			);
			expect(send).not.toHaveBeenCalled();
		}
		finally {
			vi.restoreAllMocks();
		}
	});

	it("does not treat request ID zero as a request to cancel every pending request", async () => {
		const findRequest = vi.spyOn(GangJoinRequestsRepository, "FindById").mockResolvedValue(null);
		const cancelAll = vi.spyOn(GangJoinRequestsRepository, "CancelUserPendingRequests").mockResolvedValue(0);

		try {
			await expect(Gang.CancelJoinRequest("applicant", 0)).resolves.toEqual({
				success: false,
				reason: "requestNotFound",
			});
			expect(findRequest).toHaveBeenCalledWith(0);
			expect(cancelAll).not.toHaveBeenCalled();
		}
		finally {
			vi.restoreAllMocks();
		}
	});

	it("notifies the leader and members with invite permission about an application", async () => {
		const gang = new Gang();
		gang.Id = 1;
		gang.Name = "Gang";
		gang.LeaderId = "leader";
		gang.RecruitmentType = GangRecruitmentType.Approval;
		gang.Roles = [
			{ Id: 1, Name: "Recruiter", Permissions: [GangPermission.Invite] },
			{ Id: 2, Name: "Member", Permissions: [] },
		];
		gang.Members = [
			{ UserId: "leader", RoleId: 1 },
			{ UserId: "recruiter", RoleId: 1 },
			{ UserId: "member", RoleId: 2 },
			{ UserId: "unknown-role", RoleId: 3 },
		].map(member => ({
			...member,
			Nickname: member.UserId,
			PermissionCount: 0,
			RoleName: "",
			Deposit: { Time: new Date(), Amount: 0 },
		}));
		const applicant = new User("applicant");
		applicant.Nickname = "Applicant";
		applicant.Money = gang.GetJoinCost();

		vi.spyOn(GangMemberRepository, "FindByUserId").mockResolvedValue(null);
		vi.spyOn(GangJoinRequestsRepository, "FindActiveByUser").mockResolvedValue(null);
		vi.spyOn(GangJoinRequestsRepository, "CreateRequest").mockResolvedValue(
			GangJoinRequests.build({ gangId: 1, userId: applicant.Id, status: GangJoinRequestStatus.Pending }),
		);
		const send = vi.spyOn(WebPush, "Send").mockResolvedValue();

		try {
			await expect(gang.ApplyToGang(applicant)).resolves.toEqual({ success: true });
			expect(send).toHaveBeenCalledTimes(2);
			expect(send).toHaveBeenCalledWith("leader", expect.any(String));
			expect(send).toHaveBeenCalledWith("recruiter", expect.any(String));
		}
		finally {
			vi.restoreAllMocks();
		}
	});

	it("charges the base join cost multiplied by gang level", async () => {
		const gang = new Gang();
		gang.Id = 1;
		gang.Level = 4;
		gang.Roles = [{ Id: 2, Name: "Member", Permissions: [] }];
		const user = new User("new-member");
		user.Money = Gang.JOIN_COST * gang.Level;

		const findMembership = vi.spyOn(GangMemberRepository, "FindByUserId").mockResolvedValue(null);
		const updateGang = vi.spyOn(gang, "Update").mockResolvedValue(true);
		const updateUser = vi.spyOn(user, "Update").mockResolvedValue(true);
		const loadMembers = vi.spyOn(gang, "LoadMembers").mockResolvedValue();
		const cancelRequests = vi.spyOn(GangJoinRequestsRepository, "CancelUserPendingRequests").mockResolvedValue(0);

		try {
			await expect(gang.AcceptInvite(user)).resolves.toBe(true);

			expect(user.Money).toBe(0);
			expect(gang.Money).toBe(Gang.JOIN_COST * gang.Level);
			expect(updateUser).toHaveBeenCalledExactlyOnceWith({ money: 0 });
			expect(updateGang).toHaveBeenCalledExactlyOnceWith();
			expect(cancelRequests).toHaveBeenCalledExactlyOnceWith(user.Id);
		}
		finally {
			findMembership.mockRestore();
			updateGang.mockRestore();
			updateUser.mockRestore();
			loadMembers.mockRestore();
			cancelRequests.mockRestore();
		}
	});
});

describe("Gang Model - Member Capacity", () => {
	it("adds a member slot for gangs with a base", () => {
		const gang = new Gang();
		gang.Level = 10;

		expect(gang.GetMaxMembers()).toBe(19);

		gang.BaseId = GangBaseId.Airport;
		expect(gang.GetMaxMembers()).toBe(20);
	});
});

describe("Gang Model - Recruitment Settings", () => {
	it("persists the recruitment type when editing a gang", async () => {
		const gang = new Gang();
		gang.Id = 1;
		gang.RecruitmentType = GangRecruitmentType.Disabled;
		const updateGang = vi.spyOn(GangRepository, "Update").mockResolvedValue([1]);

		try {
			await expect(
				gang.Edit(null, null, null, null, null, GangRecruitmentType.Open),
			).resolves.toBe(true);
			expect(gang.RecruitmentType).toBe(GangRecruitmentType.Open);
			expect(updateGang).toHaveBeenCalledWith(
				gang.Id,
				expect.objectContaining({ recruitmentType: GangRecruitmentType.Open }),
			);
		}
		finally {
			updateGang.mockRestore();
		}
	});
});

describe("Gang Model - Leadership Transfer", () => {
	const createGang = () => {
		const gang = new Gang();
		gang.Id = 1;
		gang.LeaderId = "old-leader";
		gang.Roles = [
			{ Id: 1, Name: "Leader", Permissions: [] },
			{ Id: 2, Name: "Member", Permissions: [] },
		];
		gang.Members = ["old-leader", "new-leader"].map((UserId, index) => ({
			UserId,
			Nickname: UserId,
			PermissionCount: index === 0 ? 5 : 0,
			RoleId: index === 0 ? 1 : 2,
			RoleName: index === 0 ? "Leader" : "Member",
			Deposit: { Time: new Date(), Amount: 0 },
		}));
		return gang;
	};

	it("assigns the default Member role to the old leader before promoting the target", async () => {
		const gang = createGang();
		const updateRole = vi.spyOn(GangMemberRepository, "UpdateRole")
			.mockResolvedValueOnce(1)
			.mockResolvedValueOnce(1);
		vi.spyOn(gang, "Update").mockResolvedValue(true);
		vi.spyOn(gang, "LoadMembers").mockResolvedValue();
		vi.spyOn(gang, "ComunicateMember").mockResolvedValue(undefined);

		try {
			const result = await gang.TransferLeadership(
				new User("old-leader"),
				new User("new-leader"),
			);

			expect(result).toBe(true);
			expect(updateRole).toHaveBeenNthCalledWith(1, "old-leader", 1, 2);
			expect(updateRole).toHaveBeenNthCalledWith(2, "new-leader", 1, 1);
			expect(gang.LeaderId).toBe("new-leader");
		}
		finally {
			vi.restoreAllMocks();
		}
	});

	it("does not promote the target when the old leader's membership was not updated", async () => {
		const gang = createGang();

		const updateRole = vi.spyOn(GangMemberRepository, "UpdateRole")
			.mockResolvedValueOnce(0);

		try {
			const result = await gang.TransferLeadership(
				new User("old-leader"),
				new User("new-leader"),
			);

			expect(result).toBe(false);
			expect(gang.LeaderId).toBe("old-leader");
			expect(updateRole).toHaveBeenCalledExactlyOnceWith("old-leader", 1, 2);
		}
		finally {
			updateRole.mockRestore();
		}
	});
});

describe("Gang Model - Role Changes", () => {
	const createGang = () => {
		const gang = new Gang();
		gang.Id = 1;
		gang.LeaderId = "leader";
		gang.Roles = [
			{ Id: 1, Name: "Leader", Permissions: [] },
			{ Id: 2, Name: "Promoter", Permissions: [GangPermission.Promote] },
			{ Id: 3, Name: "Member", Permissions: [] },
		];
		gang.Members = [
			{
				UserId: "leader", Nickname: "Leader", PermissionCount: 0, RoleId: 1, RoleName: "Leader",
				Deposit: { Time: new Date(), Amount: 0 },
			},
			{
				UserId: "promoter", Nickname: "Promoter", PermissionCount: 1, RoleId: 2, RoleName: "Promoter",
				Deposit: { Time: new Date(), Amount: 0 },
			},
			{
				UserId: "target", Nickname: "Target", PermissionCount: 0, RoleId: 3, RoleName: "Member",
				Deposit: { Time: new Date(), Amount: 0 },
			},
		];
		return gang;
	};

	it("does not allow a promoter to change their own role", async () => {
		const gang = createGang();
		const updateRole = vi.spyOn(GangMemberRepository, "UpdateRole");

		try {
			await expect(gang.ChangeRole("promoter", "promoter", 3)).resolves.toBe(false);
			expect(updateRole).not.toHaveBeenCalled();
		}
		finally {
			updateRole.mockRestore();
		}
	});

	it("does not allow a promoter to assign the leader role", async () => {
		const gang = createGang();
		const updateRole = vi.spyOn(GangMemberRepository, "UpdateRole");

		try {
			await expect(gang.ChangeRole("promoter", "target", 1)).resolves.toBe(false);
			expect(updateRole).not.toHaveBeenCalled();
		}
		finally {
			updateRole.mockRestore();
		}
	});
});

describe("Gang Model - Import Resolution", () => {
	it("reloads current gang data and only persists import state", async () => {
		const gang = new Gang();
		gang.Id = 1;
		gang.ImportArrivesAt = new Date();
		gang.Money = 100;
		gang.Experience = 10;
		gang.Level = 1;

		const latestGang = new Gang();
		latestGang.Id = gang.Id;
		latestGang.ImportArrivesAt = new Date();
		latestGang.Money = 900;
		latestGang.Experience = 400;
		latestGang.Level = 10;

		const getById = vi.spyOn(Gang, "GetById").mockResolvedValue(latestGang);
		const updateGang = vi.spyOn(GangRepository, "Update").mockResolvedValue([1]);
		const random = vi.spyOn(Math, "random").mockReturnValue(0.5);

		try {
			await gang.ResolveImport();

			expect(getById).toHaveBeenCalledExactlyOnceWith(gang.Id);
			expect(gang.Money).toBe(latestGang.Money);
			expect(gang.Experience).toBe(latestGang.Experience);
			expect(gang.Level).toBe(latestGang.Level);
			expect(gang.LastImportSuccess).toBeNull();
			expect(updateGang).toHaveBeenCalledExactlyOnceWith(gang.Id, {
				shipmentArrivesAt: null,
				updatedAt: expect.any(Date),
			});
		}
		finally {
			getById.mockRestore();
			updateGang.mockRestore();
			random.mockRestore();
		}
	});

	it("persists the success timestamp without writing stale gang data", async () => {
		const gang = new Gang();
		gang.Id = 1;
		gang.ImportArrivesAt = new Date();

		const latestGang = new Gang();
		latestGang.Id = gang.Id;
		latestGang.ImportArrivesAt = new Date();

		const getById = vi.spyOn(Gang, "GetById").mockResolvedValue(latestGang);
		const updateGang = vi.spyOn(GangRepository, "Update").mockResolvedValue([1]);
		const random = vi.spyOn(Math, "random").mockReturnValue(0);

		try {
			await gang.ResolveImport();

			expect(gang.LastImportSuccess).toBeInstanceOf(Date);
			expect(updateGang).toHaveBeenCalledExactlyOnceWith(gang.Id, {
				shipmentArrivesAt: null,
				lastShipmentSuccess: gang.LastImportSuccess,
				updatedAt: expect.any(Date),
			});
		}
		finally {
			getById.mockRestore();
			updateGang.mockRestore();
			random.mockRestore();
		}
	});
});
