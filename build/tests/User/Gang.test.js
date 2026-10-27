"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const Gang_1 = require("#core/models/Gang");
const GangMemberRepository_1 = require("#core/repositories/GangMemberRepository");
const GangRepository_1 = require("#core/repositories/GangRepository");
const User_1 = require("#core/models/User");
const GangBases_1 = require("#core/types/GangBases");
// Mock the database models used by Gang
vitest_1.vi.mock("#core/database/GangMembers", () => ({
    GangMembers: {
        findAll: vitest_1.vi.fn(() => Promise.resolve([
            { userId: "user_leader", roleId: 1, depositTime: new Date(), depositAmount: 100 },
            { userId: "user_high_permission", roleId: 2, depositTime: new Date(), depositAmount: 200 },
            { userId: "user_mid_permission", roleId: 3, depositTime: new Date(), depositAmount: 300 },
        ])),
        create: vitest_1.vi.fn((values) => Promise.resolve(values)),
    },
}));
vitest_1.vi.mock("#core/database/Users", () => ({
    Users: {
        findByPk: vitest_1.vi.fn((id) => {
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
vitest_1.vi.mock("#core/database/GangRoles", () => ({
    GangRoles: {
        findByPk: vitest_1.vi.fn((roleId) => {
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
vitest_1.vi.mock("#core/database/Gangs", () => ({
    Gangs: {},
}));
(0, vitest_1.describe)("Gang Model - Member Sorting", () => {
    (0, vitest_1.it)("should sort the Leader first, then others by permission count descending", async () => {
        const gang = new Gang_1.Gang();
        gang.Id = 1;
        gang.LeaderId = "user_leader";
        await gang.LoadMembers();
        (0, vitest_1.expect)(gang.Members.length).toBe(3);
        // The leader should be first, even though they have 0 permissions compared to others
        (0, vitest_1.expect)(gang.Members[0].UserId).toBe("user_leader");
        (0, vitest_1.expect)(gang.Members[0].PermissionCount).toBe(0);
        // The second should be HighPermUser (4 permissions)
        (0, vitest_1.expect)(gang.Members[1].UserId).toBe("user_high_permission");
        (0, vitest_1.expect)(gang.Members[1].PermissionCount).toBe(4);
        // The third should be MidPermUser (2 permissions)
        (0, vitest_1.expect)(gang.Members[2].UserId).toBe("user_mid_permission");
        (0, vitest_1.expect)(gang.Members[2].PermissionCount).toBe(2);
    });
});
(0, vitest_1.describe)("Gang Model - Joining", () => {
    (0, vitest_1.it)("charges the base join cost multiplied by gang level", async () => {
        const gang = new Gang_1.Gang();
        gang.Id = 1;
        gang.Level = 4;
        gang.Roles = [{ Id: 2, Name: "Member", Permissions: [] }];
        const user = new User_1.User("new-member");
        user.Money = Gang_1.Gang.JOIN_COST * gang.Level;
        const findMembership = vitest_1.vi.spyOn(GangMemberRepository_1.GangMemberRepository, "FindByUserId").mockResolvedValue(null);
        const updateGang = vitest_1.vi.spyOn(gang, "Update").mockResolvedValue(true);
        const updateUser = vitest_1.vi.spyOn(user, "Update").mockResolvedValue(true);
        const loadMembers = vitest_1.vi.spyOn(gang, "LoadMembers").mockResolvedValue();
        try {
            await (0, vitest_1.expect)(gang.AcceptInvite(user)).resolves.toBe(true);
            (0, vitest_1.expect)(user.Money).toBe(0);
            (0, vitest_1.expect)(gang.Money).toBe(Gang_1.Gang.JOIN_COST * gang.Level);
            (0, vitest_1.expect)(updateUser).toHaveBeenCalledExactlyOnceWith({ money: 0 });
            (0, vitest_1.expect)(updateGang).toHaveBeenCalledExactlyOnceWith();
        }
        finally {
            findMembership.mockRestore();
            updateGang.mockRestore();
            updateUser.mockRestore();
            loadMembers.mockRestore();
        }
    });
});
(0, vitest_1.describe)("Gang Model - Member Capacity", () => {
    (0, vitest_1.it)("adds a member slot for gangs with a base", () => {
        const gang = new Gang_1.Gang();
        gang.Level = 10;
        (0, vitest_1.expect)(gang.GetMaxMembers()).toBe(19);
        gang.BaseId = GangBases_1.GangBaseId.Airport;
        (0, vitest_1.expect)(gang.GetMaxMembers()).toBe(20);
    });
});
(0, vitest_1.describe)("Gang Model - Leadership Transfer", () => {
    const createGang = () => {
        const gang = new Gang_1.Gang();
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
    (0, vitest_1.it)("assigns the default Member role to the old leader before promoting the target", async () => {
        const gang = createGang();
        const updateRole = vitest_1.vi.spyOn(GangMemberRepository_1.GangMemberRepository, "UpdateRole")
            .mockResolvedValueOnce(1)
            .mockResolvedValueOnce(1);
        vitest_1.vi.spyOn(gang, "Update").mockResolvedValue(true);
        vitest_1.vi.spyOn(gang, "LoadMembers").mockResolvedValue();
        vitest_1.vi.spyOn(gang, "ComunicateMember").mockResolvedValue(undefined);
        try {
            const result = await gang.TransferLeadership(new User_1.User("old-leader"), new User_1.User("new-leader"));
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(updateRole).toHaveBeenNthCalledWith(1, "old-leader", 1, 2);
            (0, vitest_1.expect)(updateRole).toHaveBeenNthCalledWith(2, "new-leader", 1, 1);
            (0, vitest_1.expect)(gang.LeaderId).toBe("new-leader");
        }
        finally {
            vitest_1.vi.restoreAllMocks();
        }
    });
    (0, vitest_1.it)("does not promote the target when the old leader's membership was not updated", async () => {
        const gang = createGang();
        const updateRole = vitest_1.vi.spyOn(GangMemberRepository_1.GangMemberRepository, "UpdateRole")
            .mockResolvedValueOnce(0);
        try {
            const result = await gang.TransferLeadership(new User_1.User("old-leader"), new User_1.User("new-leader"));
            (0, vitest_1.expect)(result).toBe(false);
            (0, vitest_1.expect)(gang.LeaderId).toBe("old-leader");
            (0, vitest_1.expect)(updateRole).toHaveBeenCalledExactlyOnceWith("old-leader", 1, 2);
        }
        finally {
            updateRole.mockRestore();
        }
    });
});
(0, vitest_1.describe)("Gang Model - Role Changes", () => {
    const createGang = () => {
        const gang = new Gang_1.Gang();
        gang.Id = 1;
        gang.LeaderId = "leader";
        gang.Roles = [
            { Id: 1, Name: "Leader", Permissions: [] },
            { Id: 2, Name: "Promoter", Permissions: [Gang_1.GangPermission.Promote] },
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
    (0, vitest_1.it)("does not allow a promoter to change their own role", async () => {
        const gang = createGang();
        const updateRole = vitest_1.vi.spyOn(GangMemberRepository_1.GangMemberRepository, "UpdateRole");
        try {
            await (0, vitest_1.expect)(gang.ChangeRole("promoter", "promoter", 3)).resolves.toBe(false);
            (0, vitest_1.expect)(updateRole).not.toHaveBeenCalled();
        }
        finally {
            updateRole.mockRestore();
        }
    });
    (0, vitest_1.it)("does not allow a promoter to assign the leader role", async () => {
        const gang = createGang();
        const updateRole = vitest_1.vi.spyOn(GangMemberRepository_1.GangMemberRepository, "UpdateRole");
        try {
            await (0, vitest_1.expect)(gang.ChangeRole("promoter", "target", 1)).resolves.toBe(false);
            (0, vitest_1.expect)(updateRole).not.toHaveBeenCalled();
        }
        finally {
            updateRole.mockRestore();
        }
    });
});
(0, vitest_1.describe)("Gang Model - Import Resolution", () => {
    (0, vitest_1.it)("reloads current gang data and only persists import state", async () => {
        const gang = new Gang_1.Gang();
        gang.Id = 1;
        gang.ImportArrivesAt = new Date();
        gang.Money = 100;
        gang.Experience = 10;
        gang.Level = 1;
        const latestGang = new Gang_1.Gang();
        latestGang.Id = gang.Id;
        latestGang.ImportArrivesAt = new Date();
        latestGang.Money = 900;
        latestGang.Experience = 400;
        latestGang.Level = 10;
        const getById = vitest_1.vi.spyOn(Gang_1.Gang, "GetById").mockResolvedValue(latestGang);
        const updateGang = vitest_1.vi.spyOn(GangRepository_1.GangRepository, "Update").mockResolvedValue([1]);
        const random = vitest_1.vi.spyOn(Math, "random").mockReturnValue(0.5);
        try {
            await gang.ResolveImport();
            (0, vitest_1.expect)(getById).toHaveBeenCalledExactlyOnceWith(gang.Id);
            (0, vitest_1.expect)(gang.Money).toBe(latestGang.Money);
            (0, vitest_1.expect)(gang.Experience).toBe(latestGang.Experience);
            (0, vitest_1.expect)(gang.Level).toBe(latestGang.Level);
            (0, vitest_1.expect)(gang.LastImportSuccess).toBeNull();
            (0, vitest_1.expect)(updateGang).toHaveBeenCalledExactlyOnceWith(gang.Id, {
                shipmentArrivesAt: null,
                updatedAt: vitest_1.expect.any(Date),
            });
        }
        finally {
            getById.mockRestore();
            updateGang.mockRestore();
            random.mockRestore();
        }
    });
    (0, vitest_1.it)("persists the success timestamp without writing stale gang data", async () => {
        const gang = new Gang_1.Gang();
        gang.Id = 1;
        gang.ImportArrivesAt = new Date();
        const latestGang = new Gang_1.Gang();
        latestGang.Id = gang.Id;
        latestGang.ImportArrivesAt = new Date();
        const getById = vitest_1.vi.spyOn(Gang_1.Gang, "GetById").mockResolvedValue(latestGang);
        const updateGang = vitest_1.vi.spyOn(GangRepository_1.GangRepository, "Update").mockResolvedValue([1]);
        const random = vitest_1.vi.spyOn(Math, "random").mockReturnValue(0);
        try {
            await gang.ResolveImport();
            (0, vitest_1.expect)(gang.LastImportSuccess).toBeInstanceOf(Date);
            (0, vitest_1.expect)(updateGang).toHaveBeenCalledExactlyOnceWith(gang.Id, {
                shipmentArrivesAt: null,
                lastShipmentSuccess: gang.LastImportSuccess,
                updatedAt: vitest_1.expect.any(Date),
            });
        }
        finally {
            getById.mockRestore();
            updateGang.mockRestore();
            random.mockRestore();
        }
    });
});
//# sourceMappingURL=Gang.test.js.map