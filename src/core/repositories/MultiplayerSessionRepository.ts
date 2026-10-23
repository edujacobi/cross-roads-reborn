import { Op } from "sequelize";
import { sequelize } from "#core/database/Database";
import { MultiplayerSessions } from "#core/database/MultiplayerSessions";
import { Users } from "#core/database/Users";

export type MultiplayerSessionKind =
	| "russianRoulette"
	| "beatUp"
	| "userRobbery"
	| "investmentRobbery"
	| "gangHeist";

export type MultiplayerSessionStatus = "active" | "completed" | "aborted";

export interface MultiplayerSessionRecord {
	id: string;
	kind: MultiplayerSessionKind;
	ownerId: string;
	targetId: string | null;
	gangId: number | null;
	participantIds: string[];
	phase: string;
	status: MultiplayerSessionStatus;
	expiresAt: Date | null;
	result: unknown;
	createdAt: Date;
}

export interface NewMultiplayerSession {
	id: string;
	kind: MultiplayerSessionKind;
	ownerId: string;
	targetId?: string | null;
	gangId?: number | null;
	participantIds: string[];
	phase: string;
	expiresAt?: Date | null;
}

export class MultiplayerSessionRepository {
	static async PruneFinished(olderThan: Date): Promise<void> {
		await MultiplayerSessions.destroy({
			where: {
				status: { [Op.in]: ["completed", "aborted"] },
				createdAt: { [Op.lt]: olderThan },
			},
		});
	}

	static async ReleaseLocks(session: MultiplayerSessionRecord): Promise<void> {
		const participantIds = Array.from(new Set([session.ownerId, ...session.participantIds]));
		await sequelize.transaction(async transaction => {
			if (session.kind === "beatUp" && session.targetId) {
				await Users.update(
					{ beatingUserId: null },
					{ where: { id: session.ownerId, beatingUserId: session.targetId }, transaction },
				);
				await Users.update(
					{ beingBeatUpByUserId: null },
					{ where: { id: session.targetId, beingBeatUpByUserId: session.ownerId }, transaction },
				);
			}
			else if (session.kind === "userRobbery" && session.targetId) {
				await Users.update(
					{ robbingUserId: null },
					{ where: { id: session.ownerId, robbingUserId: session.targetId }, transaction },
				);
				await Users.update(
					{ beingRobbedByUserId: null },
					{ where: { id: session.targetId, beingRobbedByUserId: session.ownerId }, transaction },
				);
			}
			else if (session.kind === "russianRoulette" && participantIds.length) {
				await Users.update(
					{ casinoIsInGame: false },
					{ where: { id: { [Op.in]: participantIds }, casinoIsInGame: true }, transaction },
				);
			}
			else if (session.kind === "investmentRobbery") {
				if (participantIds.length && session.targetId) {
					await Users.update(
						{ robbingUserId: null, robberyParticipatingInGangAction: false },
						{
							where: {
								id: { [Op.in]: participantIds },
								robbingUserId: session.targetId,
								robberyParticipatingInGangAction: true,
							},
							transaction,
						},
					);
				}
				if (session.targetId) {
					await Users.update(
						{ robberyInvestmentDefending: false },
						{ where: { id: session.targetId, robberyInvestmentDefending: true }, transaction },
					);
				}
			}
			else if (session.kind === "gangHeist" && participantIds.length) {
				await Users.update(
					{ robberyParticipatingInGangAction: false },
					{ where: { id: { [Op.in]: participantIds }, robberyParticipatingInGangAction: true }, transaction },
				);
			}
		});
	}

	static async Create(session: NewMultiplayerSession): Promise<void> {
		await MultiplayerSessions.create({
			...session,
			targetId: session.targetId ?? null,
			gangId: session.gangId ?? null,
			participantIds: JSON.stringify(session.participantIds),
			status: "active",
			expiresAt: session.expiresAt ?? null,
			result: null,
		});
	}

	static async Update(
		id: string,
		values: {
			participantIds?: string[];
			phase?: string;
			expiresAt?: Date | null;
			result?: unknown;
		},
	): Promise<void> {
		const { participantIds, result, ...otherValues } = values;
		const [updated] = await MultiplayerSessions.update(
			{
				...otherValues,
				...(participantIds && { participantIds: JSON.stringify(participantIds) }),
				...(result !== undefined && { result: result === null ? null : JSON.stringify(result) }),
			},
			{ where: { id, status: "active" } },
		);
		if (!updated) throw new Error(`Active multiplayer session ${id} was not found.`);
	}

	static async Finish(id: string, status: Exclude<MultiplayerSessionStatus, "active">, result?: unknown): Promise<void> {
		const [updated] = await MultiplayerSessions.update(
			{
				status,
				phase: status,
				expiresAt: null,
				result: result === undefined ? null : JSON.stringify(result),
			},
			{ where: { id, status: "active" } },
		);
		if (!updated) throw new Error(`Active multiplayer session ${id} was not found.`);
	}

	static async FindActive(): Promise<MultiplayerSessionRecord[]> {
		const sessions = await MultiplayerSessions.findAll({ where: { status: "active" } });
		return sessions.map(session => ({
			id: session.id,
			kind: session.kind as MultiplayerSessionKind,
			ownerId: session.ownerId,
			targetId: session.targetId,
			gangId: session.gangId,
			participantIds: JSON.parse(session.participantIds) as string[],
			phase: session.phase,
			status: session.status,
			expiresAt: session.expiresAt,
			result: session.result === null ? null : JSON.parse(session.result),
			createdAt: session.createdAt,
		}));
	}

}
