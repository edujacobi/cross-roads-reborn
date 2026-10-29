import { GangJoinRequests } from "#core/database/GangJoinRequests";
import { Gangs } from "#core/database/Gangs";
import { Users } from "#core/database/Users";
import { GangJoinRequestStatus } from "#core/types/GangRecruitment";
import type { GangColorId } from "#core/types/GangColors";
import { UniqueConstraintError } from "sequelize";

export interface GangJoinRequestWithDetails {
	id: number;
	gangId: number;
	gangName: string;
	gangAcronym: string;
	gangImage?: string | null;
	gangColor?: GangColorId;
	userId: string;
	userName: string;
	userAvatarDecoration?: number;
	message: string | null;
	status: GangJoinRequestStatus;
	createdAt: Date;
}

export class GangJoinRequestsRepository {
	static async FindActiveByUser(
		userId: string,
	): Promise<GangJoinRequestWithDetails | null> {
		const request = await GangJoinRequests.findOne({
			where: { userId, status: GangJoinRequestStatus.Pending },
			order: [["createdAt", "DESC"]],
		});
		if (!request) return null;

		const [gang, user] = await Promise.all([
			Gangs.findByPk(request.gangId),
			Users.findByPk(request.userId),
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

	static async FindHistoryByUser(
		userId: string,
		limit = 20,
	): Promise<GangJoinRequestWithDetails[]> {
		const requests = await GangJoinRequests.findAll({
			where: { userId },
			order: [["createdAt", "DESC"]],
			limit,
		});

		const gangIds = [...new Set(requests.map((r) => r.gangId))];
		const [gangs, user] = await Promise.all([
			Gangs.findAll({ where: { id: gangIds } }),
			Users.findByPk(userId),
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

	static async FindPendingByGang(
		gangId: number,
	): Promise<GangJoinRequestWithDetails[]> {
		const requests = await GangJoinRequests.findAll({
			where: { gangId, status: GangJoinRequestStatus.Pending },
			order: [["createdAt", "DESC"]],
		});

		const userIds = [...new Set(requests.map((r) => r.userId))];
		const [gang, users] = await Promise.all([
			Gangs.findByPk(gangId),
			Users.findAll({ where: { id: userIds } }),
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

	static async FindById(id: number): Promise<GangJoinRequests | null> {
		return await GangJoinRequests.findByPk(id);
	}

	static async CreateRequest(
		gangId: number,
		userId: string,
		message?: string | null,
	): Promise<GangJoinRequests | null> {
		try {
			return await GangJoinRequests.create({
				gangId,
				userId,
				message: message?.trim() ? message.trim().slice(0, 280) : null,
				status: GangJoinRequestStatus.Pending,
			});
		}
		catch (error) {
			if (error instanceof UniqueConstraintError) return null;
			throw error;
		}
	}

	static async UpdateStatusIfCurrent(
		id: number,
		currentStatus: GangJoinRequestStatus,
		status: GangJoinRequestStatus,
	): Promise<boolean> {
		const [affected] = await GangJoinRequests.update(
			{ status },
			{ where: { id, status: currentStatus } },
		);
		return affected > 0;
	}

	static async CancelUserPendingRequests(userId: string): Promise<number> {
		const [affected] = await GangJoinRequests.update(
			{ status: GangJoinRequestStatus.Cancelled },
			{ where: { userId, status: GangJoinRequestStatus.Pending } },
		);
		return affected;
	}
}
