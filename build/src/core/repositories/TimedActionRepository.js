"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimedActionRepository = exports.actionTransaction = void 0;
const node_async_hooks_1 = require("node:async_hooks");
const node_crypto_1 = require("node:crypto");
const sequelize_1 = require("sequelize");
const Database_1 = require("#core/database/Database");
const TimedActions_1 = require("#core/database/TimedActions");
const Users_1 = require("#core/database/Users");
exports.actionTransaction = new node_async_hooks_1.AsyncLocalStorage();
class TimedActionRepository {
    static async Start(userId, kind, referenceId, durationMs) {
        return await Database_1.sequelize.transaction({ type: sequelize_1.Transaction.TYPES.IMMEDIATE }, async (transaction) => {
            const field = kind === "scavenge" ? "scavengingId" : "robbingLocationId";
            const [changed] = await Users_1.Users.update({ [field]: referenceId }, {
                where: { id: userId, scavengingId: null, robbingLocationId: null },
                transaction,
            });
            if (!changed)
                throw new Error(`Cannot start ${kind} for user ${userId}: another action is active.`);
            await TimedActions_1.TimedActions.destroy({ where: { userId, kind }, transaction });
            const id = (0, node_crypto_1.randomUUID)();
            await TimedActions_1.TimedActions.create({
                id, userId, kind, referenceId,
                dueAt: new Date(Date.now() + durationMs), result: null,
            }, { transaction });
            return id;
        });
    }
    static async Get(userId, kind) {
        return await TimedActions_1.TimedActions.findOne({ where: { userId, kind }, transaction: exports.actionTransaction.getStore() });
    }
    static async Run(userId, kind, referenceId, resolve, attemptId) {
        return await Database_1.sequelize.transaction({ type: sequelize_1.Transaction.TYPES.IMMEDIATE }, async (transaction) => {
            return await exports.actionTransaction.run(transaction, async () => {
                const action = await TimedActionRepository.Get(userId, kind);
                if (!action || action.referenceId !== referenceId || (attemptId && action.id !== attemptId)) {
                    throw new Error(`Missing ${kind} attempt for user ${userId}.`);
                }
                if (action.result !== null)
                    return TimedActionRepository.Decode(action.result);
                if (action.dueAt.getTime() > Date.now())
                    throw new Error(`${kind} attempt is not due yet.`);
                const result = await resolve();
                const field = kind === "scavenge" ? "scavengingId" : "robbingLocationId";
                const [changed] = await Users_1.Users.update({ [field]: null }, {
                    where: { id: userId, [field]: referenceId }, transaction,
                });
                if (!changed)
                    throw new Error(`${kind} marker changed for user ${userId}.`);
                await action.update({ result: JSON.stringify(result) }, { transaction });
                return result;
            });
        });
    }
    static Decode(json) {
        return JSON.parse(json, (key, value) => typeof value === "string" && (key.endsWith("Time") || key === "cooldownEndsAt")
            ? new Date(value) : value);
    }
    static async FindDue() {
        return await TimedActions_1.TimedActions.findAll({ where: { result: null, dueAt: { [sequelize_1.Op.lte]: new Date() } } });
    }
    static async DiscardCancelled(id) {
        return await Database_1.sequelize.transaction({ type: sequelize_1.Transaction.TYPES.IMMEDIATE }, async (transaction) => {
            const action = await TimedActions_1.TimedActions.findByPk(id, { transaction });
            if (!action || action.result !== null)
                return false;
            const user = await Users_1.Users.findByPk(action.userId, { transaction });
            const marker = action.kind === "scavenge" ? user?.scavengingId : user?.robbingLocationId;
            if (marker === action.referenceId)
                return false;
            await action.destroy({ transaction });
            return true;
        });
    }
    static async AdoptLegacyActions() {
        const users = await Users_1.Users.findAll({
            attributes: ["id", "scavengingId", "robbingLocationId"],
            where: { [sequelize_1.Op.or]: [{ scavengingId: { [sequelize_1.Op.ne]: null } }, { robbingLocationId: { [sequelize_1.Op.ne]: null } }] },
        });
        for (const user of users) {
            for (const kind of ["scavenge", "robbery"]) {
                const referenceId = kind === "scavenge" ? user.scavengingId : user.robbingLocationId;
                if (referenceId === null)
                    continue;
                await TimedActions_1.TimedActions.findOrCreate({
                    where: { userId: user.id, kind },
                    defaults: { id: (0, node_crypto_1.randomUUID)(), userId: user.id, kind, referenceId, dueAt: new Date(), result: null },
                });
            }
        }
    }
}
exports.TimedActionRepository = TimedActionRepository;
//# sourceMappingURL=TimedActionRepository.js.map