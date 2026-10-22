import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { Op, Transaction } from "sequelize";
import { sequelize } from "#core/database/Database";
import { TimedActions } from "#core/database/TimedActions";
import { Users } from "#core/database/Users";

export type TimedActionKind = "scavenge" | "robbery";
export const actionTransaction = new AsyncLocalStorage<Transaction>();

export class TimedActionRepository {
	static async Start(userId: string, kind: TimedActionKind, referenceId: number, durationMs: number) {
		return await sequelize.transaction({ type: Transaction.TYPES.IMMEDIATE }, async transaction => {
			const field = kind === "scavenge" ? "scavengingId" : "robbingLocationId";
			const [changed] = await Users.update({ [field]: referenceId }, {
				where: { id: userId, scavengingId: null, robbingLocationId: null },
				transaction,
			});
			if (!changed) throw new Error(`Cannot start ${kind} for user ${userId}: another action is active.`);
			await TimedActions.destroy({ where: { userId, kind }, transaction });
			const id = randomUUID();
			await TimedActions.create({
				id, userId, kind, referenceId,
				dueAt: new Date(Date.now() + durationMs), result: null,
			}, { transaction });
			return id;
		});
	}

	static async Get(userId: string, kind: TimedActionKind) {
		return await TimedActions.findOne({ where: { userId, kind }, transaction: actionTransaction.getStore() });
	}

	static async Run<T>(userId: string, kind: TimedActionKind, referenceId: number, resolve: () => Promise<T>, attemptId?: string): Promise<T> {
		return await sequelize.transaction({ type: Transaction.TYPES.IMMEDIATE }, async transaction => {
			return await actionTransaction.run(transaction, async () => {
				const action = await TimedActionRepository.Get(userId, kind);
				if (!action || action.referenceId !== referenceId || (attemptId && action.id !== attemptId)) {
					throw new Error(`Missing ${kind} attempt for user ${userId}.`);
				}
				if (action.result !== null) return TimedActionRepository.Decode<T>(action.result);
				if (action.dueAt.getTime() > Date.now()) throw new Error(`${kind} attempt is not due yet.`);
				const result = await resolve();
				const field = kind === "scavenge" ? "scavengingId" : "robbingLocationId";
				const [changed] = await Users.update({ [field]: null }, {
					where: { id: userId, [field]: referenceId }, transaction,
				});
				if (!changed) throw new Error(`${kind} marker changed for user ${userId}.`);
				await action.update({ result: JSON.stringify(result) }, { transaction });
				return result;
			});
		});
	}

	static Decode<T>(json: string): T {
		return JSON.parse(json, (key, value) =>
			typeof value === "string" && (key.endsWith("Time") || key === "cooldownEndsAt")
				? new Date(value) : value);
	}

	static async FindDue() {
		return await TimedActions.findAll({ where: { result: null, dueAt: { [Op.lte]: new Date() } } });
	}

	static async DiscardCancelled(id: string): Promise<boolean> {
		return await sequelize.transaction({ type: Transaction.TYPES.IMMEDIATE }, async transaction => {
			const action = await TimedActions.findByPk(id, { transaction });
			if (!action || action.result !== null) return false;
			const user = await Users.findByPk(action.userId, { transaction });
			const marker = action.kind === "scavenge" ? user?.scavengingId : user?.robbingLocationId;
			if (marker === action.referenceId) return false;
			await action.destroy({ transaction });
			return true;
		});
	}

	static async AdoptLegacyActions() {
		const users = await Users.findAll({
			attributes: ["id", "scavengingId", "robbingLocationId"],
			where: { [Op.or]: [{ scavengingId: { [Op.ne]: null } }, { robbingLocationId: { [Op.ne]: null } }] },
		});
		for (const user of users) {
			for (const kind of ["scavenge", "robbery"] as const) {
				const referenceId = kind === "scavenge" ? user.scavengingId : user.robbingLocationId;
				if (referenceId === null) continue;
				await TimedActions.findOrCreate({
					where: { userId: user.id, kind },
					defaults: { id: randomUUID(), userId: user.id, kind, referenceId, dueAt: new Date(), result: null },
				});
			}
		}
	}
}
