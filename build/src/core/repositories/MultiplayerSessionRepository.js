"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiplayerSessionRepository = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = require("#core/database/Database");
const MultiplayerSessions_1 = require("#core/database/MultiplayerSessions");
const Users_1 = require("#core/database/Users");
class MultiplayerSessionRepository {
    static async PruneFinished(olderThan) {
        await MultiplayerSessions_1.MultiplayerSessions.destroy({
            where: {
                status: { [sequelize_1.Op.in]: ["completed", "aborted"] },
                createdAt: { [sequelize_1.Op.lt]: olderThan },
            },
        });
    }
    static async ReleaseLocks(session) {
        const participantIds = Array.from(new Set([session.ownerId, ...session.participantIds]));
        await Database_1.sequelize.transaction(async (transaction) => {
            if (session.kind === "beatUp" && session.targetId) {
                await Users_1.Users.update({ beatingUserId: null }, { where: { id: session.ownerId, beatingUserId: session.targetId }, transaction });
                await Users_1.Users.update({ beingBeatUpByUserId: null }, { where: { id: session.targetId, beingBeatUpByUserId: session.ownerId }, transaction });
            }
            else if (session.kind === "userRobbery" && session.targetId) {
                await Users_1.Users.update({ robbingUserId: null }, { where: { id: session.ownerId, robbingUserId: session.targetId }, transaction });
                await Users_1.Users.update({ beingRobbedByUserId: null }, { where: { id: session.targetId, beingRobbedByUserId: session.ownerId }, transaction });
            }
            else if (session.kind === "russianRoulette" && participantIds.length) {
                await Users_1.Users.update({ casinoIsInGame: false }, { where: { id: { [sequelize_1.Op.in]: participantIds }, casinoIsInGame: true }, transaction });
            }
            else if (session.kind === "investmentRobbery") {
                if (participantIds.length && session.targetId) {
                    await Users_1.Users.update({ robbingUserId: null, robberyParticipatingInGangAction: false }, {
                        where: {
                            id: { [sequelize_1.Op.in]: participantIds },
                            robbingUserId: session.targetId,
                            robberyParticipatingInGangAction: true,
                        },
                        transaction,
                    });
                }
                if (session.targetId) {
                    await Users_1.Users.update({ robberyInvestmentDefending: false }, { where: { id: session.targetId, robberyInvestmentDefending: true }, transaction });
                }
            }
            else if (session.kind === "gangHeist" && participantIds.length) {
                await Users_1.Users.update({ robberyParticipatingInGangAction: false }, { where: { id: { [sequelize_1.Op.in]: participantIds }, robberyParticipatingInGangAction: true }, transaction });
            }
        });
    }
    static async Create(session) {
        await MultiplayerSessions_1.MultiplayerSessions.create({
            ...session,
            targetId: session.targetId ?? null,
            gangId: session.gangId ?? null,
            participantIds: JSON.stringify(session.participantIds),
            status: "active",
            expiresAt: session.expiresAt ?? null,
            result: null,
        });
    }
    static async Update(id, values) {
        const { participantIds, result, ...otherValues } = values;
        const [updated] = await MultiplayerSessions_1.MultiplayerSessions.update({
            ...otherValues,
            ...(participantIds && { participantIds: JSON.stringify(participantIds) }),
            ...(result !== undefined && { result: result === null ? null : JSON.stringify(result) }),
        }, { where: { id, status: "active" } });
        if (!updated)
            throw new Error(`Active multiplayer session ${id} was not found.`);
    }
    static async Finish(id, status, result) {
        const [updated] = await MultiplayerSessions_1.MultiplayerSessions.update({
            status,
            phase: status,
            expiresAt: null,
            result: result === undefined ? null : JSON.stringify(result),
        }, { where: { id, status: "active" } });
        if (!updated)
            throw new Error(`Active multiplayer session ${id} was not found.`);
    }
    static async FindActive() {
        const sessions = await MultiplayerSessions_1.MultiplayerSessions.findAll({ where: { status: "active" } });
        return sessions.map(session => ({
            id: session.id,
            kind: session.kind,
            ownerId: session.ownerId,
            targetId: session.targetId,
            gangId: session.gangId,
            participantIds: JSON.parse(session.participantIds),
            phase: session.phase,
            status: session.status,
            expiresAt: session.expiresAt,
            result: session.result === null ? null : JSON.parse(session.result),
            createdAt: session.createdAt,
        }));
    }
}
exports.MultiplayerSessionRepository = MultiplayerSessionRepository;
//# sourceMappingURL=MultiplayerSessionRepository.js.map