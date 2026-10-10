import { GraphQLError } from "graphql";
import { User } from "#core/models/User";
import {
	UserRepository,
} from "#core/repositories/UserRepository";
import { GangMemberRepository } from "#core/repositories/GangMemberRepository";
import { GangRepository } from "#core/repositories/GangRepository";
import { AvatarDecorationList } from "#core/types/AvatarDecorations";
import { BackgroundDecorationList } from "#core/types/BackgroundDecorations";
import { Language } from "#core/models/Language";
import { GangColor } from "#core/types/GangColors";
import { RobHistoryRepository } from "#core/repositories/RobHistoryRepository";
import { ClashType } from "#core/types/Robbery";
import { LocationList } from "#core/types/Locations";
import { InvestmentList } from "#core/types/Investments";
import type { InvestmentId } from "#core/types/Investments";
import type { GraphQLContext } from "#api/types";
import { convertHexNumberToString } from "#bot/utils/ui";
import { UserBadge } from "#core/models/UserBadge";
import { getClient } from "#bot/client";
import { assertAuthenticated, mapUserDetail, topUserRankings } from "./helpers";
import type { ResolverFn } from "./helpers";

function formatAvatarDecoration(decorationId: number): string {
	return AvatarDecorationList[decorationId].Description[Language.English]
		.toLowerCase()
		.replaceAll(" ", "_");
}

function formatBackgroundDecoration(decorationId: number): string {
	return BackgroundDecorationList[decorationId].Description[Language.English]
		.toLowerCase()
		.replaceAll(" ", "_");
}

export const userResolvers: {
	Query: Record<string, ResolverFn>;
} = {
	Query: {
		users: async (
			_: unknown,
			args: {
				search?: string;
				limit?: number;
				offset?: number;
				vipOnly?: boolean;
				sortBy?: string;
				sortOrder?: string
			},
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			if (authUser.role === "PLAYER" && args.vipOnly) {
				throw new GraphQLError("Acesso negado: Filtragem VIP é restrita a administradores.", {
					extensions: { code: "FORBIDDEN" },
				});
			}

			const { users, total } = await UserRepository.SearchUsers({
				search: args.search,
				limit: args.limit,
				offset: args.offset,
				vipOnly: args.vipOnly,
				sortBy: args.sortBy,
				sortOrder: args.sortOrder,
			});

			const client = getClient();

			const mappedUsers = users.map(async (u) => {
				const user = await new User(u.id).GetSimpleInfo(u);

				if (!user) {
					return;
				}

				const [, isDev, isMod, isHelper] = await Promise.all([
					user.GetSituation(),
					UserBadge.IsDeveloper(user.Id),
					UserBadge.IsModerator(user.Id),
					UserBadge.IsHelper(user.Id),
				]);

				let avatarUrl: string | null;

				try {
					avatarUrl = (await client.users.fetch(user.Id)).avatarURL();
				}
				catch {
					avatarUrl = null;
				}

				return {
					id: user.Id,
					nickname: user.Nickname,
					avatarUrl,
					avatarDecoration: formatAvatarDecoration(user.AvatarDecoration.Id),
					backgroundDecoration: formatBackgroundDecoration(user.BackgroundDecoration.Id),
					class: user.Class,
					isVip: authUser.role !== "PLAYER" && user.IsVip(),
					vipEternal: authUser.role !== "PLAYER" && user.VipEternal,
					vipTime: authUser.role === "PLAYER" ? null : user.VipTime?.toISOString() ?? null,
					situationId: authUser.role === "PLAYER" ? 0 : user.Situation.Id,
					createdAt: authUser.role === "PLAYER" ? "" : user.CreatedAt.toISOString(),
					updatedAt: authUser.role === "PLAYER" ? "" : user.UpdatedAt.toISOString(),
					isDeveloper: authUser.role !== "PLAYER" && isDev,
					isModerator: authUser.role !== "PLAYER" && isMod,
					isHelper: authUser.role !== "PLAYER" && isHelper,
				};
			});

			return {
				users: mappedUsers,
				total,
			};
		},

		topUsers: async (
			_: unknown,
			args: { ranking: keyof typeof topUserRankings; limit?: number; offset?: number },
			context: GraphQLContext,
		) => {
			assertAuthenticated(context);
			const ranking = topUserRankings[args.ranking];
			const limit = args.limit ?? 15;
			const offset = args.offset ?? 0;
			if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0) {
				throw new GraphQLError("Paginação de ranking inválida.", {
					extensions: { code: "BAD_USER_INPUT" },
				});
			}

			const [users, total] = await Promise.all([
				UserRepository.FindTopUsers(ranking.orderField, limit, offset),
				UserRepository.CountTopUsers(ranking.orderField),
			]);
			const memberships = await GangMemberRepository.FindAllByUserIds(users.map(user => user.id));
			const gangs = await GangRepository.FindAllByIds([...new Set(memberships.map(member => member.gangId))]);
			const gangNames = new Map(gangs.map(gang => [gang.id, gang.name]));
			const gangAcronyms = new Map(gangs.map(gang => [gang.id, gang.acronym]));
			const gangColors = new Map(
				gangs.map(gang => [gang.id, convertHexNumberToString(GangColor[gang.color].Color)]),
			);
			const gangByUserId = new Map(memberships.map(member => [member.userId, gangNames.get(member.gangId) ?? null]));
			const gangAcronymByUserId = new Map(memberships.map(member => [member.userId, gangAcronyms.get(member.gangId) ?? null]));
			const gangColorByUserId = new Map(
				memberships.map(member => [member.userId, gangColors.get(member.gangId) ?? null]),
			);
			const client = getClient();
			const entries = await Promise.all(users.map(async (user) => {
				let avatarUrl: string | null = null;
				try {
					avatarUrl = (await client.users.fetch(user.id)).avatarURL();
				}
				catch {
					avatarUrl = null;
				}

				return {
					id: user.id,
					nickname: user.nickname || "(Sem Nick)",
					avatarUrl,
					avatarDecoration: formatAvatarDecoration(user.avatarDecoration),
					backgroundDecoration: formatBackgroundDecoration(user.backgroundDecoration),
					gangName: gangByUserId.get(user.id) ?? null,
					gangAcronym: gangAcronymByUserId.get(user.id) ?? null,
					gangColor: gangColorByUserId.get(user.id) ?? null,
					value: Number(user[ranking.orderField]),
					count: ranking.countField ? Number(user[ranking.countField]) : null,
				};
			}));

			return { entries, total };
		},

		user: async (_: unknown, args: { id: string }, context: GraphQLContext) => {
			const authUser = assertAuthenticated(context);
			const user = new User(args.id);
			const found = await user.GetInfo(undefined, Language.Portuguese);
			if (!found) {
				return null;
			}
			const detail = await mapUserDetail(user);
			if (authUser.role !== "PLAYER" || authUser.userId === user.Id) {
				return detail;
			}

			return {
				...detail,
				specialCoin: null,
				automaticGrenade: null,
				investment: detail.investment
					? { ...detail.investment, nextPaymentValue: null }
					: null,
				language: "",
				isInHospital: false,
				hospitalTime: null,
				isInPrison: false,
				prisonTime: null,
				isWorking: false,
				jobEndsIn: null,
				isScavenging: false,
				isWanted: false,
				wantedTime: null,
				isRobbing: false,
				isBeingRobbed: false,
				isBeating: false,
				isBeingBeated: false,
				isInCasino: false,
				isDefendingInvestment: false,
				isInGangAction: false,
				isDead: false,
				deadUntil: null,
				voteCount: 0,
				createdAt: "",
				updatedAt: "",
			};
		},

		userHistory: async (
			_: unknown,
			args: { userId: string; limit?: number; offset?: number },
			context: GraphQLContext,
		) => {
			assertAuthenticated(context);
			const limit = Math.min(Math.max(Math.trunc(args.limit ?? 10), 1), 50);
			const offset = Math.max(Math.trunc(args.offset ?? 0), 0);

			const [records, total] = await Promise.all([
				RobHistoryRepository.GetList(args.userId, limit, offset),
				RobHistoryRepository.Count(args.userId),
			]);

			const userIds = new Set<string>();
			for (const rec of records) {
				if (rec.attackerId) userIds.add(rec.attackerId);
				if (rec.defenderId) userIds.add(rec.defenderId);
			}

			const users = await Promise.all(
				Array.from(userIds).map(async (id) => [
					id,
					await UserRepository.FindById(id, ["id", "class", "nickname"]),
				] as const),
			);
			const userById = new Map(users);

			const client = getClient();

			const entries = Promise.all(records.map(async (rob) => {
				const attackerUser = rob.attackerId ? userById.get(rob.attackerId) : null;
				const defenderUser = rob.defenderId ? userById.get(rob.defenderId) : null;

				const [attackAvatarUrl, defendAvatarUrl] = await Promise.all([
					client.users.fetch(rob.attackerId)
						.then(user => user.avatarURL())
						.catch(() => null),
					rob.defenderId
						? client.users.fetch(rob.defenderId)
							.then(user => user.avatarURL())
							.catch(() => null)
						: null,
				]);

				let locationName: string | null = null;

				if (rob.type === ClashType.Location && rob.locationId != null) {
					const loc = LocationList[rob.locationId];
					if (loc) {
						locationName = loc.Name[Language.Portuguese];
					}
				}
				else if (rob.type === ClashType.Investment && rob.locationId != null) {
					const investment = InvestmentList[rob.locationId as InvestmentId];
					if (investment) {
						locationName = investment.Name[Language.Portuguese];
					}
				}

				return {
					id: String(rob.id),
					attackerId: rob.attackerId,
					defenderId: rob.defenderId ?? null,
					attacker: attackerUser
						? {
							id: attackerUser.id,
							nickname: attackerUser.nickname || "(Sem Nick)",
							avatarUrl: attackAvatarUrl,
						}
						: null,
					defender: defenderUser
						? {
							id: defenderUser.id,
							nickname: defenderUser.nickname || "(Sem Nick)",
							avatarUrl: defendAvatarUrl,
						}
						: null,
					locationId: rob.locationId ?? null,
					locationName,
					type: rob.type,
					success: Boolean(rob.success),
					money: Number(rob.money),
					createdAt: rob.createdAt instanceof Date ? rob.createdAt.toISOString() : String(rob.createdAt),
				};
			}));

			return {
				entries,
				total,
			};
		},

		hospitalizedUsers: async (
			_: unknown,
			args: { search?: string; limit?: number; offset?: number; sortBy?: string; sortOrder?: string },
			context: GraphQLContext,
		) => {
			assertAuthenticated(context);
			const { users, total } = await UserRepository.FindHospitalized({
				search: args.search,
				limit: args.limit,
				offset: args.offset,
				sortBy: args.sortBy,
				sortOrder: args.sortOrder,
			});

			const client = getClient();

			const entries = users.map(async (user) => {
				let avatarUrl: string | null = null;
				try {
					avatarUrl = (await client.users.fetch(user.id)).avatarURL();
				}
				catch {
					avatarUrl = null;
				}

				return {
					id: user.id,
					nickname: user.nickname || "(Sem Nick)",
					avatarUrl: avatarUrl,
					avatarDecoration: formatAvatarDecoration(user.avatarDecoration),
					class: user.class,
					hospitalTime: user.hospitalTime instanceof Date ? user.hospitalTime.toISOString() : String(user.hospitalTime),
					hospitalCount: Number(user.hospitalCount),
				};
			});

			return { entries, total };
		},

		prisoners: async (
			_: unknown,
			args: { search?: string; limit?: number; offset?: number; sortBy?: string; sortOrder?: string },
			context: GraphQLContext,
		) => {
			assertAuthenticated(context);
			const { users, total } = await UserRepository.FindPrisoners({
				search: args.search,
				limit: args.limit,
				offset: args.offset,
				sortBy: args.sortBy,
				sortOrder: args.sortOrder,
			});

			const client = getClient();

			const entries = users.map(async (user) => {
				let avatarUrl: string | null = null;
				try {
					avatarUrl = (await client.users.fetch(user.id)).avatarURL();
				}
				catch {
					avatarUrl = null;
				}

				return {
					id: user.id,
					nickname: user.nickname || "(Sem Nick)",
					avatarUrl: avatarUrl,
					avatarDecoration: formatAvatarDecoration(user.avatarDecoration),
					class: user.class,
					prisonTime: user.prisonTime instanceof Date ? user.prisonTime.toISOString() : String(user.prisonTime),
					robberyFailureCount: Number(user.robberyFailureCount),
					escapeCount: Number(user.escapeCount),
				};
			});

			return { entries, total };
		},
	},
};