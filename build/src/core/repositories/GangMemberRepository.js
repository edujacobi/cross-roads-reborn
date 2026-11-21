"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GangMemberRepository = void 0;
const GangMembers_1 = require("#core/database/GangMembers");
const sequelize_1 = require("sequelize");
class GangMemberRepository {
    /**
     * Finds one gang membership matching the userId.
     */
    static async FindByUserId(userId) {
        return await GangMembers_1.GangMembers.findOne({
            where: { userId },
        });
    }
    static async FindAllByUserIds(userIds) {
        return await GangMembers_1.GangMembers.findAll({
            attributes: ["userId", "gangId"],
            where: { userId: { [sequelize_1.Op.in]: userIds } },
        });
    }
    /**
     * Finds all members of a gang.
     */
    static async FindAllByGang(gangId) {
        return await GangMembers_1.GangMembers.findAll({
            where: { gangId },
        });
    }
    /**
     * Adds a user to a gang.
     */
    static async Create(values) {
        return await GangMembers_1.GangMembers.create(values);
    }
    /**
     * Updates a gang member record's role.
     */
    static async UpdateRole(userId, gangId, roleId) {
        const [updatedCount] = await GangMembers_1.GangMembers.update({ roleId }, { where: { userId, gangId } });
        return updatedCount;
    }
    /**
     * Updates a gang member record's deposit information.
     */
    static async UpdateDeposit(userId, gangId, depositAmount, depositTime) {
        await GangMembers_1.GangMembers.update({ depositAmount, depositTime }, { where: { userId, gangId } });
    }
    /**
     * Removes a member from a gang.
     */
    static async RemoveFromGang(userId, gangId) {
        return await GangMembers_1.GangMembers.destroy({
            where: { userId, gangId },
        });
    }
    /**
     * Count of all gang members.
     */
    static async Count() {
        return await GangMembers_1.GangMembers.count();
    }
    /**
     * Removes all members of a gang.
     */
    static async RemoveAllByGangId(gangId) {
        return await GangMembers_1.GangMembers.destroy({
            where: { gangId },
        });
    }
    /**
     * Reassigns roles from an old role ID to a new role ID in a gang.
     */
    static async ReassignRole(gangId, oldRoleId, newRoleId) {
        await GangMembers_1.GangMembers.update({ roleId: newRoleId }, { where: { gangId, roleId: oldRoleId } });
    }
}
exports.GangMemberRepository = GangMemberRepository;
//# sourceMappingURL=GangMemberRepository.js.map