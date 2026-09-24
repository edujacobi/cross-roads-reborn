import { GraphQLError } from "graphql";
import { Dashboard } from "#core/models/Dashboard";
import { User } from "#core/models/User";
import { UserRepository } from "#core/repositories/UserRepository";
import { ClassList } from "#core/types/Classes";
import { Language } from "#core/models/Language";
import { ItemList } from "#core/types/Items";
import type { AuthUser, GraphQLContext } from "#api/types";
import { formatMoney } from "#bot/utils/ui";

function assertAuthenticated(context: GraphQLContext): AuthUser {
	if (!context.user) {
		throw new GraphQLError("Authentication required to perform this action.", {
			extensions: { code: "UNAUTHORIZED" },
		});
	}
	return context.user;
}

function assertDeveloper(context: GraphQLContext): AuthUser {
	const user = assertAuthenticated(context);
	if (user.role !== "DEVELOPER") {
		throw new GraphQLError("Forbidden: Moderators have read-only access.", {
			extensions: { code: "FORBIDDEN" },
		});
	}
	return user;
}

function mapUserDetail(user: User) {
	const now = new Date();
	const isInHospital = user.Hospital.Time > now;
	const isInPrison = user.Prison.Time > now;
	const isWorking = user.Job.EndsIn > now && user.Job.Id !== null;
	const isScavenging = user.Scavenge.Time > now && user.Scavenge.IsScavengingId !== null;
	const isWanted = user.Wanted.Time > now;

	const items = (user.Items || []).map((item) => {
		const itemDef = ItemList[item.Id];
		return {
			id: item.Id,
			name: itemDef?.Description?.[user.Language] || itemDef?.Description?.[Language.English] || `Item #${item.Id}`,
			type: item.Type,
			quantity: item.Quantity,
			skin: item.SelectedSkin,
			remainingTime: item.RemainingTime ? item.RemainingTime.toISOString() : null,
		};
	});

	const className = ClassList[user.Class]?.Name?.[Language.Portuguese] || "None";

	return {
		id: user.Id,
		nickname: user.Nickname,
		money: user.Money,
		specialCoin: user.SpecialCoin,
		gangId: user.GangId,
		class: user.Class,
		className,
		attack: user.Attributes.Attack,
		defense: user.Attributes.Defense,
		isVip: user.IsVip(),
		vipEternal: user.VipEternal,
		vipTime: user.VipTime ? user.VipTime.toISOString() : null,
		language: user.Language,
		isInHospital,
		hospitalTime: isInHospital ? user.Hospital.Time.toISOString() : null,
		isInPrison,
		prisonTime: isInPrison ? user.Prison.Time.toISOString() : null,
		isWorking,
		jobEndsIn: isWorking ? user.Job.EndsIn.toISOString() : null,
		isScavenging,
		isWanted,
		isInCasino: user.Casino.IsInGame,
		investmentId: user.Investment.Id,
		situationId: user.Situation.Id,
		items,
		dailyStreak: user.Daily.CurrentStreak,
		voteCount: user.Vote.Count,
	};
}

export type ResolverFn = (_: unknown, args: any, context: GraphQLContext) => Promise<any> | any;

export const resolvers: {
	Query: Record<string, ResolverFn>;
	Mutation: Record<string, ResolverFn>;
} = {
	Query: {
		me: (_: unknown, __: unknown, context: GraphQLContext) => {
			return context.user;
		},

		dashboardStats: async (_: unknown, __: unknown, context: GraphQLContext) => {
			assertAuthenticated(context);
			const stats = await Dashboard.GetCurrentStats();
			return {
				...stats,
				date: stats.date.toISOString(),
			};
		},

		dashboardHistory: async (_: unknown, __: unknown, context: GraphQLContext) => {
			assertAuthenticated(context);
			const history = await Dashboard.GetLast30Days();
			return history.map((snapshot) => ({
				id: (snapshot as { id?: number }).id || null,
				date: snapshot.date instanceof Date ? snapshot.date.toISOString() : String(snapshot.date),
				totalPlayers: snapshot.totalPlayers,
				totalGangs: snapshot.totalGangs,
				prisonCount: snapshot.prisonCount,
				hospitalCount: snapshot.hospitalCount,
				jobCount: snapshot.jobCount,
				scavengeCount: snapshot.scavengeCount,
				casinoCount: snapshot.casinoCount,
				robberyCount: snapshot.robberyCount,
				beatUpCount: snapshot.beatUpCount,
				idleCount: snapshot.idleCount,
				englishCount: snapshot.englishCount,
				portugueseCount: snapshot.portugueseCount,
				spanishCount: snapshot.spanishCount,
			}));
		},

		users: async (
			_: unknown,
			args: { search?: string; limit?: number; offset?: number },
			context: GraphQLContext,
		) => {
			assertAuthenticated(context);
			const { users, total } = await UserRepository.SearchUsers({
				search: args.search,
				limit: args.limit,
				offset: args.offset,
			});

			const now = new Date();

			const mappedUsers = users.map((u) => {
				const isVip = u.vipEternal || (u.vipTime ? new Date(u.vipTime) > now : false);
				const isInHospital = u.hospitalTime ? new Date(u.hospitalTime) > now : false;
				const isInPrison = u.prisonTime ? new Date(u.prisonTime) > now : false;
				const isWorking = u.jobTime ? new Date(u.jobTime) > now && u.jobId !== null : false;
				const className = ClassList[u.class]?.Name?.[Language.Portuguese] || "None";

				return {
					id: u.id,
					nickname: u.nickname,
					money: u.money,
					specialCoin: u.specialCoin,
					class: u.class,
					className,
					isVip,
					vipEternal: u.vipEternal,
					isInHospital,
					isInPrison,
					isWorking,
				};
			});

			return {
				users: mappedUsers,
				total,
			};
		},

		user: async (_: unknown, args: { id: string }, context: GraphQLContext) => {
			assertAuthenticated(context);
			const user = new User(args.id);
			const found = await user.GetInfo();
			if (!found) {
				return null;
			}
			return mapUserDetail(user);
		},
	},

	Mutation: {
		setMoney: async (
			_: unknown,
			args: { userId: string; amount: number; mode: "ADD" | "SET" },
			context: GraphQLContext,
		) => {
			const admin = assertDeveloper(context);
			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}

			if (args.mode === "ADD") {
				target.Money += args.amount;
			}
			else {
				target.Money = args.amount;
			}

			await target.Update({ money: target.Money });
			await target.GetInfo();

			return {
				success: true,
				message: `Money successfully updated to ${formatMoney(target.Money, Language.English)} for ${target.Nickname}.`,
				user: mapUserDetail(target),
			};
		},

		cureUser: async (_: unknown, args: { userId: string }, context: GraphQLContext) => {
			const admin = assertDeveloper(context);
			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}

			await target.Cure(admin.userId);
			await target.GetInfo();

			return {
				success: true,
				message: `User ${target.Nickname} has been cured from the hospital.`,
				user: mapUserDetail(target),
			};
		},

		freeUser: async (_: unknown, args: { userId: string }, context: GraphQLContext) => {
			const admin = assertDeveloper(context);
			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}

			await target.Free(admin.userId);
			await target.GetInfo();

			return {
				success: true,
				message: `User ${target.Nickname} has been freed from prison.`,
				user: mapUserDetail(target),
			};
		},

		resetCooldown: async (
			_: unknown,
			args: { userId: string; cooldown: string },
			context: GraphQLContext,
		) => {
			const admin = assertDeveloper(context);
			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}

			await target.ResetCooldown(args.cooldown, admin.userId);
			await target.GetInfo();

			return {
				success: true,
				message: `Cooldown ${args.cooldown} reset for ${target.Nickname}.`,
				user: mapUserDetail(target),
			};
		},

		removeAction: async (
			_: unknown,
			args: { userId: string; action: string },
			context: GraphQLContext,
		) => {
			const admin = assertDeveloper(context);
			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}

			await target.RemoveAction(args.action, admin.userId);
			await target.GetInfo();

			return {
				success: true,
				message: `Action ${args.action} removed for ${target.Nickname}.`,
				user: mapUserDetail(target),
			};
		},
	},
};
