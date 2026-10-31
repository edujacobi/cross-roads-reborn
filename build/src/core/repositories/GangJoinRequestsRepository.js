"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GangJoinRequestsRepository = void 0;
const GangJoinRequests_1 = require("#core/database/GangJoinRequests");
const Gangs_1 = require("#core/database/Gangs");
const Users_1 = require("#core/database/Users");
const GangRecruitment_1 = require("#core/types/GangRecruitment");
const sequelize_1 = require("sequelize");
class GangJoinRequestsRepository {
    static async FindActiveByUser(userId) {
        const request = await GangJoinRequests_1.GangJoinRequests.findOne({
            where: { userId, status: GangRecruitment_1.GangJoinRequestStatus.Pending },
            order: [["createdAt", "DESC"]],
        });
        if (!request)
            return null;
        const [gang, user] = await Promise.all([
            Gangs_1.Gangs.findByPk(request.gangId),
            Users_1.Users.findByPk(request.userId),
        ]);
        return {
            id: request.id,
            gangId: request.gangId,
            gangName: gang?.name ?? "Gangue Desconhecida",
            gangAcronym: gang?.acronym ?? "???",
            userId: request.userId,
            userName: user?.nickname ?? "Usuário Desconhecido",
            message: request.message,
            status: request.status,
            createdAt: request.createdAt,
        };
    }
    static async FindHistoryByUser(userId, limit = 20) {
        const requests = await GangJoinRequests_1.GangJoinRequests.findAll({
            where: { userId },
            order: [["createdAt", "DESC"]],
            limit,
        });
        const gangIds = [...new Set(requests.map((r) => r.gangId))];
        const [gangs, user] = await Promise.all([
            Gangs_1.Gangs.findAll({ where: { id: gangIds } }),
            Users_1.Users.findByPk(userId),
        ]);
        const gangMap = new Map(gangs.map((g) => [g.id, g]));
        return requests.map((r) => {
            const gang = gangMap.get(r.gangId);
            return {
                id: r.id,
                gangId: r.gangId,
                gangName: gang?.name ?? "Gangue Desconhecida",
                gangAcronym: gang?.acronym ?? "???",
                gangImage: gang?.image ?? null,
                gangColor: gang?.color,
                userId: r.userId,
                userName: user?.nickname ?? "Usuário Desconhecido",
                message: r.message,
                status: r.status,
                createdAt: r.createdAt,
            };
        });
    }
    static async FindPendingByGang(gangId) {
        const requests = await GangJoinRequests_1.GangJoinRequests.findAll({
            where: { gangId, status: GangRecruitment_1.GangJoinRequestStatus.Pending },
            order: [["createdAt", "DESC"]],
        });
        const userIds = [...new Set(requests.map((r) => r.userId))];
        const [gang, users] = await Promise.all([
            Gangs_1.Gangs.findByPk(gangId),
            Users_1.Users.findAll({ where: { id: userIds } }),
        ]);
        const userMap = new Map(users.map((u) => [u.id, u]));
        return requests.map((r) => {
            const user = userMap.get(r.userId);
            return {
                id: r.id,
                gangId: r.gangId,
                gangName: gang?.name ?? "Gangue Desconhecida",
                gangAcronym: gang?.acronym ?? "???",
                userId: r.userId,
                userName: user?.nickname ?? "Usuário Desconhecido",
                userAvatarDecoration: user?.avatarDecoration ?? 0,
                message: r.message,
                status: r.status,
                createdAt: r.createdAt,
            };
        });
    }
    static async FindById(id) {
        return await GangJoinRequests_1.GangJoinRequests.findByPk(id);
    }
    static async CreateRequest(gangId, userId, message) {
        try {
            return await GangJoinRequests_1.GangJoinRequests.create({
                gangId,
                userId,
                message: message?.trim() ? message.trim().slice(0, 280) : null,
                status: GangRecruitment_1.GangJoinRequestStatus.Pending,
            });
        }
        catch (error) {
            if (error instanceof sequelize_1.UniqueConstraintError)
                return null;
            throw error;
        }
    }
    static async UpdateStatusIfCurrent(id, currentStatus, status) {
        const [affected] = await GangJoinRequests_1.GangJoinRequests.update({ status }, { where: { id, status: currentStatus } });
        return affected > 0;
    }
    static async CancelUserPendingRequests(userId) {
        const [affected] = await GangJoinRequests_1.GangJoinRequests.update({ status: GangRecruitment_1.GangJoinRequestStatus.Cancelled }, { where: { userId, status: GangRecruitment_1.GangJoinRequestStatus.Pending } });
        return affected;
    }
}
exports.GangJoinRequestsRepository = GangJoinRequestsRepository;
//# sourceMappingURL=GangJoinRequestsRepository.js.map