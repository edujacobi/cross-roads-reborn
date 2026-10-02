import { GraphQLError } from "graphql";
import { Dashboard } from "#core/models/Dashboard";
import { Season } from "#core/models/Season";
import { Vault } from "#core/models/Vault";
import { User } from "#core/models/User";
import { GangRoleRepository } from "#core/repositories/GangRoleRepository";
import { GangMemberRepository } from "#core/repositories/GangMemberRepository";
import { GangRepository } from "#core/repositories/GangRepository";
import {
	UserRepository,
	type TopUserRankingCountField,
	type TopUserRankingField,
} from "#core/repositories/UserRepository";
import { ClassList } from "#core/types/Classes";
import { AvatarDecorationList } from "#core/types/AvatarDecorations";
import { Language } from "#core/models/Language";
import { ItemList } from "#core/types/Items";
import type { AuthUser, GraphQLContext } from "#api/types";
import { convertHexNumberToString, formatMoney } from "#bot/utils/ui";
import { UserBadge } from "#core/models/UserBadge";
import { UserItemRepository } from "#core/repositories/UserItemRepository";
import { ItemType } from "#core/types/Items";
import { BundleId } from "#core/types/Ids";
import { addHours, subMinutes } from "date-fns";
import { getClient } from "#bot/client";
import { InvestmentList } from "#core/types/Investments";
import { GangColor } from "#core/types/GangColors";
import { randomBytes } from "node:crypto";
import { logger } from "#shared/log";
import { Event, EventType } from "#core/models/Event";
import type { Events } from "#core/database/Events";

function assertAuthenticated(context: GraphQLContext): AuthUser {
	if (!context.user) {
		throw new GraphQLError("Authentication required to perform this action.", {
			extensions: { code: "UNAUTHORIZED" },
		});
	}
	return context.user;
}

function assertCanWrite(context: GraphQLContext): AuthUser {
	const user = assertAuthenticated(context);
	if (user.role !== "DEVELOPER" && user.role !== "MODERATOR") {
		throw new GraphQLError("Forbidden: This role has read-only access.", {
			extensions: { code: "FORBIDDEN" },
		});
	}
	return user;
}

function assertDeveloper(context: GraphQLContext): AuthUser {
	const user = assertAuthenticated(context);
	if (user.role !== "DEVELOPER") {
		throw new GraphQLError("Forbidden: Developer access required.", {
			extensions: { code: "FORBIDDEN" },
		});
	}
	return user;
}

const topUserRankings = {
	MONEY: { orderField: "money", countField: undefined },
	GAMBLERS: { orderField: "casinoWinSum", countField: "casinoWinCount" },
	SPENDERS: { orderField: "shopSpentSum", countField: "shopSpentCount" },
	THIEVES: { orderField: "robberySuccessRobbedSum", countField: "robberySuccessCount" },
	WORKERS: { orderField: "jobReceivedSum", countField: "jobReceivedCount" },
	DRUNKERS: { orderField: "drinkHappyHour", countField: "drunkCount" },
	BEATERS: { orderField: "beatUpSuccessCount", countField: "beatUpBeatedUpCount" },
	SCAVENGERS: { orderField: "scavengeFoundTotal", countField: "scavengeCount" },
	HOSPITAL: { orderField: "hospitalTreatmentSum", countField: "hospitalTreatmentCount" },
	BRIBERS: { orderField: "prisonBriberySum", countField: "prisonBriberyCount" },
	ESCAPERS: { orderField: "escapeCount", countField: "prisonCount" },
	INVESTORS: { orderField: "investmentTotalProfit", countField: undefined },
} satisfies Record<
	string,
	{ orderField: TopUserRankingField; countField?: TopUserRankingCountField }
>;

async function mapUserDetail(user: User) {
	const now = new Date();
	const isInHospital = user.Hospital.Time > now;
	const isInPrison = user.Prison.Time > now;
	const isWorking = user.Job.EndsIn > now && user.Job.Id !== null;
	const isScavenging = user.Scavenge.Time > now && user.Scavenge.IsScavengingId !== null;
	const isWanted = user.Wanted.Time > now;
	const isDead = user.DeadUntil > now;

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

	const client = getClient();

	// eslint-disable-next-line prefer-const
	let [badges, discordUser, gang] = await Promise.all([
		UserBadge.GetList(user.Id),
		client.users.fetch(user.Id),
		user.GetGang(),
	]);

	if (user.IsVip()) {
		badges = UserBadge.AddVIPBadgeInList(badges, user);
	}

	const badgeList = badges.map(b => {
		return {
			id: b.BadgeId,
			name: b.Name,
			description: b.Description,
		};
	});

	let investment = null;

	if (user.Investment.Id) {
		const investInfo = InvestmentList[user.Investment.Id];
		investment = {
			id: user.Investment.Id,
			name: investInfo.Name[Language.Portuguese],
			expiresAt: user.Investment.ExpiresAt?.toISOString(),
			defense: investInfo.BaseDefense,
			nextPaymentValue: formatMoney(user.Investment.AccumulatedYield, Language.Portuguese),
			henchmanEndsAt: user.Investment.HenchmanEndsAt?.toISOString(),
		};
	}

	let gangInfo = null;

	if (gang) {
		const roleText = gang.Members.find(member => member.UserId === user.Id)!.RoleName;

		gangInfo = {
			id: gang.Id,
			name: gang.Name,
			level: gang.Level,
			role: roleText,
			imageUrl: gang.Image,
			color: convertHexNumberToString(GangColor[gang.Color].Color),
		};
	}

	const lastCommand = client.userLastCommand.get(user.Id) || 0;
	const isOnline = new Date(lastCommand) > subMinutes(new Date(), 15);

	return {
		id: user.Id,
		nickname: user.Nickname,
		online: isOnline,
		money: user.Money,
		avatarUrl: discordUser.avatarURL(),
		avatarDecoration: user.AvatarDecoration.Description[Language.English].toLowerCase().replaceAll(" ", "_"),
		specialCoin: user.SpecialCoin,
		gang: gangInfo,
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
		wantedTime: isWanted ? user.Wanted.Time.toISOString() : null,
		isRobbing: user.Robbery.IsRobbingId !== null || user.Robbery.IsRobbingLocationId !== null,
		isBeingRobbed: user.Robbery.IsBeingRobbedById !== null,
		isBeating: user.BeatUp.IsBeatingId !== null,
		isBeingBeated: user.BeatUp.IsBeingBeatUpById !== null,
		isInCasino: user.Casino.IsInGame,
		isDefendingInvestment: user.IsDefendingInvestment(),
		isInGangAction: user.IsParticipatingInGangAction(),
		isDead,
		deadUntil: isDead ? user.DeadUntil.toISOString() : null,
		investment: investment,
		situationId: user.Situation.Id,
		situationText: user.Situation.ComplexUI,
		items,
		voteCount: user.Vote.Count,
		activityStats: {
			dailyMaxStreak: user.Daily.MaxStreak,
			dailyCurrentStreak: user.Daily.CurrentStreak,
			hospitalCount: user.Hospital.Count,
			hospitalTreatmentCount: user.Hospital.TreatmentCount,
			hospitalTreatmentSum: user.Hospital.TreatmentSum,
			prisonCount: user.Prison.Count,
			escapeCount: user.Escape.Count,
			prisonBriberySum: user.Prison.BriberySum,
			prisonBriberyCount: user.Prison.BriberyCount,
			robberySuccessCount: user.Robbery.SuccessCount,
			robberyFailureCount: user.Robbery.FailureCount,
			robberySuccessRobbedSum: user.Robbery.SuccessRobbedSum,
			robberyBeingRobbedCount: user.Robbery.BeingRobbedCount,
			robberyBeingRobbedSum: user.Robbery.BeingRobbedSum,
			beatUpSuccessCount: user.BeatUp.SuccessCount,
			beatUpFailureCount: user.BeatUp.FailureCount,
			beatUpBeatedUpCount: user.BeatUp.BeatedUpCount,
			casinoWinCount: user.Casino.WinCount,
			casinoLoseCount: user.Casino.LoseCount,
			casinoWinSum: user.Casino.WinSum,
			casinoLoseSum: user.Casino.LoseSum,
			almsReceivedSum: user.Alms.ReceivedSum,
			almsReceivedCount: user.Alms.ReceivedCount,
			almsGivenSum: user.Alms.GivenSum,
			almsGivenCount: user.Alms.GivenCount,
			scavengeFoundCount: user.Scavenge.Found.Items + user.Scavenge.Found.MoneyCount,
			scavengeFailures: user.Scavenge.Found.Failures,
			scavengeHospitalizations: user.Scavenge.Found.FailureWithHospital,
			scavengePrisonizations: user.Scavenge.Found.FailureWithPrison,
			jobReceivedSum: user.Job.ReceivedSum,
			jobReceivedCount: user.Job.ReceivedCount,
			investmentProfit: user.Investment.TotalProfit,
			shopSpentSum: user.Shop.SpentSum,
			shopSpentCount: user.Shop.SpentCount,
		},
		badges: badgeList,
		createdAt: user.CreatedAt.toISOString(),
		updatedAt: user.UpdatedAt.toISOString(),
	};
}

// eslint-disable-next-line
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
			const [stats, vaultBalances] = await Promise.all([
				Dashboard.GetCurrentStats(),
				Vault.GetBalances(),
			]);
			return {
				...stats,
				date: stats.date.toISOString(),
				bankVaultValue: vaultBalances.bank,
				casinoVaultValue: vaultBalances.casino,
			};
		},

		dashboardHistory: async (_: unknown, __: unknown, context: GraphQLContext) => {
			assertAuthenticated(context);
			const history = await Dashboard.GetLast30Days();
			return history.map((snapshot) => ({
				id: (snapshot as { id?: number }).id || null,
				date: snapshot.date instanceof Date ? snapshot.date.toISOString() : String(snapshot.date),
				totalPlayers: snapshot.totalPlayers,
				allUsers: snapshot.allUsers,
				classCounts: snapshot.classCounts === null ? null : JSON.parse(snapshot.classCounts),
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

		events: async (_: unknown, __: unknown, context: GraphQLContext) => {
			assertAuthenticated(context);
			const events = await Event.GetAll();

			return events.map(event => ({
				id: event.id,
				type: event.type,
				value: event.value,
				periodStart: event.periodStart.toISOString(),
				periodEnd: event.periodEnd.toISOString(),
				isActive: Event.IsActive(event),
			}));
		},

		seasonInfo: async (_: unknown, __: unknown, context: GraphQLContext) => {
			assertAuthenticated(context);
			const [season, mainHeistAllowed] = await Promise.all([
				Season.GetCurrent(),
				Vault.IsMainHeistAllowed(),
			]);

			return {
				number: season.Number,
				startDate: season.StartDate.toISOString(),
				endDate: season.EndDate.toISOString(),
				daysRemaining: season.GetDaysRemaining(),
				mainHeistAllowed,
			};
		},

		seasonEndPreview: async (_: unknown, __: unknown, context: GraphQLContext) => {
			assertDeveloper(context);
			const [
				[
					topMoney,
					topGambler,
					topSpender,
					topThiefProfit,
					topThiefQuantity,
					topWorker,
					topBeater,
					topScavenger,
					topHospital,
					topBriber,
					topEscaper,
					topDrunk,
					topInvestor,
					topGang,
				],
				[
					activeUsers,
					activeGangs,
					gangMembers,
					gangRoles,
					gangHeists,
					items,
					robberies,
					notifications,
					lotteryTickets,
					investments,
					horseRaceBets,
				],
			] = await Promise.all([
				Season.GetEndSeasonRankingData(),
				Season.GetEndSeasonStats(),
			]);
			const mapUsers = (users: typeof topMoney, value: (user: typeof topMoney[number]) => number) => users.map(user => ({
				id: user.id,
				nickname: user.nickname,
				class: user.class,
				value: value(user),
			}));

			return {
				topMoney: mapUsers(topMoney, user => user.money),
				topGambler: mapUsers(topGambler, user => user.casinoWinSum),
				topSpender: mapUsers(topSpender, user => user.shopSpentSum),
				topThiefProfit: mapUsers(topThiefProfit, user => user.robberySuccessRobbedSum),
				topThiefQuantity: mapUsers(topThiefQuantity, user => user.robberySuccessCount),
				topWorker: mapUsers(topWorker, user => user.jobReceivedSum),
				topBeater: mapUsers(topBeater, user => user.beatUpSuccessCount),
				topScavenger: mapUsers(topScavenger, user => user.scavengeFoundTotal),
				topHospital: mapUsers(topHospital, user => user.hospitalTreatmentSum),
				topBriber: mapUsers(topBriber, user => user.prisonBriberySum),
				topEscaper: mapUsers(topEscaper, user => user.escapeCount),
				topDrunk: mapUsers(topDrunk, user => user.drinkHappyHour),
				topInvestor: mapUsers(topInvestor, user => user.investmentTotalProfit),
				topGang,
				stats: {
					activeUsers,
					activeGangs,
					gangMembers,
					gangRoles,
					gangHeists,
					items,
					robberies,
					notifications,
					lotteryTickets,
					investments,
					horseRaceBets,
				},
			};
		},

		users: async (
			_: unknown,
			args: { search?: string; limit?: number; offset?: number; vipOnly?: boolean },
			context: GraphQLContext,
		) => {
			assertAuthenticated(context);
			const { users, total } = await UserRepository.SearchUsers({
				search: args.search,
				limit: args.limit,
				offset: args.offset,
				vipOnly: args.vipOnly,
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
					class: user.Class,
					isVip: user.IsVip(),
					vipEternal: user.VipEternal,
					vipTime: user.VipTime?.toISOString() ?? null,
					situationId: user.Situation.Id,
					createdAt: user.CreatedAt.toISOString(),
					updatedAt: user.UpdatedAt.toISOString(),
					isDeveloper: isDev,
					isModerator: isMod,
					isHelper: isHelper,
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
				throw new GraphQLError("Invalid ranking pagination.", {
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
			const gangColors = new Map(
				gangs.map(gang => [gang.id, convertHexNumberToString(GangColor[gang.color].Color)]),
			);
			const gangByUserId = new Map(memberships.map(member => [member.userId, gangNames.get(member.gangId) ?? null]));
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
					avatarDecoration: AvatarDecorationList[user.avatarDecoration].Description[Language.English].toLowerCase().replaceAll(" ", "_"),
					gangName: gangByUserId.get(user.id) ?? null,
					gangColor: gangColorByUserId.get(user.id) ?? null,
					value: Number(user[ranking.orderField]),
					count: ranking.countField ? Number(user[ranking.countField]) : null,
				};
			}));

			return { entries, total };
		},

		topGangs: async (
			_: unknown,
			args: { limit?: number; offset?: number },
			context: GraphQLContext,
		) => {
			const authUser = assertAuthenticated(context);
			const limit = args.limit ?? 15;
			const offset = args.offset ?? 0;
			if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0) {
				throw new GraphQLError("Invalid ranking pagination.", {
					extensions: { code: "BAD_USER_INPUT" },
				});
			}

			const [gangs, total, member] = await Promise.all([
				GangRepository.FindTopGangs(limit, offset),
				GangRepository.CountAllGangs(),
				GangMemberRepository.FindByUserId(authUser.userId),
			]);
			const [memberRole, userGang] = await Promise.all([
				member ? GangRoleRepository.FindById(member.roleId) : null,
				member ? GangRepository.FindById(member.gangId) : null,
			]);
			const currentUserGangId = member?.gangId ?? null;

			return {
				total,
				currentUserGangId,
				currentUserGangName: userGang?.name ?? null,
				currentUserGangColor: userGang ? convertHexNumberToString(GangColor[userGang.color].Color) : null,
				entries: gangs.map(gang => ({
					id: gang.id,
					name: gang.name,
					acronym: gang.acronym.toUpperCase(),
					imageUrl: gang.image,
					level: gang.level,
					experience: gang.experience,
					color: convertHexNumberToString(GangColor[gang.color].Color),
					memberRole: gang.id === currentUserGangId ? memberRole?.name ?? "???" : null,
				})),
			};
		},

		user: async (_: unknown, args: { id: string }, context: GraphQLContext) => {
			assertAuthenticated(context);
			const user = new User(args.id);
			const found = await user.GetInfo(undefined, Language.Portuguese);
			if (!found) {
				return null;
			}
			return mapUserDetail(user);
		},
	},

	Mutation: {
		setMainHeistAllowed: async (
			_: unknown,
			args: { allowed: boolean },
			context: GraphQLContext,
		) => {
			assertDeveloper(context);
			await Vault.SetMainHeistAllowed(args.allowed);
			return {
				success: true,
				message: `Main heist ${args.allowed ? "enabled" : "disabled"}.`,
			};
		},

		endSeason: async (
			_: unknown,
			args: { isPreSeason: boolean },
			context: GraphQLContext,
		) => {
			assertDeveloper(context);
			await Season.EndCurrentSeason(args.isPreSeason);
			return {
				success: true,
				message: args.isPreSeason
					? "Pre-season values reset and a new season started."
					: "Season ended, winners awarded, announcements sent, and a new season started.",
			};
		},

		createEvent: async (
			_: unknown,
			args: { type: number; value: number; periodStart: string; periodEnd: string },
			context: GraphQLContext,
		) => {
			assertCanWrite(context);
			const eventTypes = Object.values(EventType).filter((type): type is EventType => typeof type === "number");
			const periodStart = new Date(args.periodStart);
			const periodEnd = new Date(args.periodEnd);
			if (
				!eventTypes.includes(args.type)
				|| !Number.isFinite(args.value)
				|| !Number.isFinite(periodStart.getTime())
				|| !Number.isFinite(periodEnd.getTime())
				|| periodStart >= periodEnd
			) {
				return { success: false, message: "Invalid event data." };
			}

			const success = await Event.Create(args.type, args.value, periodStart, periodEnd);
			return {
				success,
				message: success ? "Event created successfully." : "Failed to create event.",
			};
		},

		updateEvent: async (
			_: unknown,
			args: { id: number; value?: number | null; periodStart?: string | null; periodEnd?: string | null },
			context: GraphQLContext,
		) => {
			assertCanWrite(context);
			const event = await Event.GetById(args.id);
			if (!event) {
				return { success: false, message: "Event not found." };
			}

			const updatedData: Partial<Events> = {};
			if (args.value !== undefined && args.value !== null) {
				if (!Number.isFinite(args.value)) {
					return { success: false, message: "Invalid event value." };
				}
				updatedData.value = args.value;
			}

			const periodStart = args.periodStart !== undefined && args.periodStart !== null
				? new Date(args.periodStart)
				: event.periodStart;
			const periodEnd = args.periodEnd !== undefined && args.periodEnd !== null
				? new Date(args.periodEnd)
				: event.periodEnd;
			if (
				!Number.isFinite(periodStart.getTime())
				|| !Number.isFinite(periodEnd.getTime())
				|| periodStart >= periodEnd
			) {
				return { success: false, message: "Event start must be before its end." };
			}
			if (args.periodStart !== undefined && args.periodStart !== null) updatedData.periodStart = periodStart;
			if (args.periodEnd !== undefined && args.periodEnd !== null) updatedData.periodEnd = periodEnd;
			if (!Object.keys(updatedData).length) {
				return { success: false, message: "No event changes provided." };
			}

			const success = await Event.Update(args.id, updatedData);
			return {
				success,
				message: success ? "Event updated successfully." : "Failed to update event.",
			};
		},

		deleteEvent: async (_: unknown, args: { id: number }, context: GraphQLContext) => {
			assertCanWrite(context);
			const success = await Event.Delete(args.id);
			return {
				success,
				message: success ? "Event deleted successfully." : "Event not found or could not be deleted.",
			};
		},

		setMoney: async (
			_: unknown,
			args: { userId: string; amount: number; mode: "ADD" | "SET" },
			context: GraphQLContext,
		) => {
			assertCanWrite(context);
			if (!Number.isSafeInteger(args.amount)) {
				return { success: false, message: "Money amount must be a safe integer.", user: null };
			}

			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}

			const money = args.mode === "ADD" ? target.Money + args.amount : args.amount;
			if (!Number.isSafeInteger(money)) {
				return { success: false, message: "Updated money must be a safe integer.", user: null };
			}

			target.Money = money;
			await target.Update({ money });
			await target.GetInfo();

			return {
				success: true,
				message: `Money successfully updated to ${formatMoney(target.Money, Language.English)} for ${target.Nickname}.`,
				user: mapUserDetail(target),
			};
		},

		cureUser: async (_: unknown, args: { userId: string }, context: GraphQLContext) => {
			const admin = assertCanWrite(context);
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
			const admin = assertCanWrite(context);
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
			const admin = assertCanWrite(context);
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
			const admin = assertCanWrite(context);
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

		setItem: async (
			_: unknown,
			args: { userId: string; itemId: number; mode: "ADD" | "SET"; hoursOrQuantity: number },
			context: GraphQLContext,
		) => {
			assertCanWrite(context);
			const itemData = ItemList[args.itemId];
			if (!itemData) {
				return { success: false, message: `Item with Id ${args.itemId} was not found.`, user: null };
			}
			if (itemData.Type === ItemType.Consumable && (!Number.isInteger(args.hoursOrQuantity) || args.hoursOrQuantity < 0)) {
				return { success: false, message: "Consumable quantity must be a non-negative integer.", user: null };
			}
			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}

			const existingItem = await UserItemRepository.FindByUserAndItem(args.userId, args.itemId);
			const now = new Date();

			if (itemData.Type !== ItemType.Consumable) {
				const newExpiry = addHours(now, args.hoursOrQuantity);
				if (args.mode === "SET") {
					if (existingItem) {
						await UserItemRepository.UpdateDurationOrQuantity(args.userId, args.itemId, { remainingTime: newExpiry });
					}
					else {
						await UserItemRepository.Create({
							userId: args.userId,
							itemId: args.itemId,
							remainingTime: newExpiry,
							skin: BundleId.Default,
						});
					}
				}
				else {
					const baseDate = existingItem && existingItem.remainingTime > now ? existingItem.remainingTime : now;
					const extendedExpiry = addHours(baseDate, args.hoursOrQuantity);
					if (existingItem) {
						await UserItemRepository.UpdateDurationOrQuantity(args.userId, args.itemId, { remainingTime: extendedExpiry });
					}
					else {
						await UserItemRepository.Create({
							userId: args.userId,
							itemId: args.itemId,
							remainingTime: extendedExpiry,
							skin: BundleId.Default,
						});
					}
				}
			}
			else if (args.mode === "SET") {
				if (existingItem) {
					await UserItemRepository.UpdateDurationOrQuantity(args.userId, args.itemId, { quantity: args.hoursOrQuantity });
				}
				else {
					await UserItemRepository.Create({
						userId: args.userId,
						itemId: args.itemId,
						quantity: args.hoursOrQuantity,
						skin: BundleId.Default,
					});
				}
			}
			else {
				const newQuantity = (existingItem?.quantity || 0) + args.hoursOrQuantity;
				if (existingItem) {
					await UserItemRepository.UpdateDurationOrQuantity(args.userId, args.itemId, { quantity: newQuantity });
				}
				else {
					await UserItemRepository.Create({
						userId: args.userId,
						itemId: args.itemId,
						quantity: newQuantity,
						skin: BundleId.Default,
					});
				}
			}

			await target.GetInfo();
			return {
				success: true,
				message: `Item ${itemData.Description[Language.English]} updated for ${target.Nickname}.`,
				user: mapUserDetail(target),
			};
		},

		addSpecialCoins: async (
			_: unknown,
			args: { userId: string; amount: number },
			context: GraphQLContext,
		) => {
			assertCanWrite(context);
			if (!Number.isSafeInteger(args.amount)) {
				return { success: false, message: "Special coin amount must be a safe integer.", user: null };
			}

			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}

			if (!Number.isSafeInteger(target.SpecialCoin + args.amount)) {
				return { success: false, message: "Updated special coins must be a safe integer.", user: null };
			}

			await target.AddSpecialCoin(args.amount);
			await target.GetInfo();
			return {
				success: true,
				message: `Added ${args.amount} Special Coins to ${target.Nickname}.`,
				user: mapUserDetail(target),
			};
		},

		setClass: async (
			_: unknown,
			args: { userId: string; classId: number },
			context: GraphQLContext,
		) => {
			assertCanWrite(context);
			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}
			await target.SetClass(args.classId);
			await target.GetInfo();
			const className = ClassList[args.classId]?.Name[Language.English] || "Unknown";
			return {
				success: true,
				message: `Class updated to ${className} for ${target.Nickname}.`,
				user: mapUserDetail(target),
			};
		},

		setNickname: async (
			_: unknown,
			args: { userId: string; nickname: string },
			context: GraphQLContext,
		) => {
			assertCanWrite(context);
			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}
			await target.SetNickname(args.nickname);
			await target.GetInfo();
			return {
				success: true,
				message: `Nickname changed to ${target.Nickname}.`,
				user: mapUserDetail(target),
			};
		},

		setVip: async (
			_: unknown,
			args: { userId: string; days: number; eternal: boolean },
			context: GraphQLContext,
		) => {
			assertCanWrite(context);
			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}
			const wasEternalVip = target.VipEternal;
			await target.SetEternalVip(args.eternal);
			if (!args.eternal) {
				await target.AddVip(args.days, !wasEternalVip);
			}
			await target.GetInfo();
			return {
				success: true,
				message: args.eternal
					? `Set ${target.Nickname} as an eternal VIP.`
					: `Added ${args.days} days of VIP to ${target.Nickname}.`,
				user: mapUserDetail(target),
			};
		},

		killUser: async (
			_: unknown,
			args: { userId: string; days: number },
			context: GraphQLContext,
		) => {
			assertCanWrite(context);
			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}
			const deadUntil = await target.Kill(args.days);
			await target.GetInfo();
			return {
				success: true,
				message: `Killed ${target.Nickname} for ${args.days} days (Dead until ${deadUntil.toISOString()}).`,
				user: mapUserDetail(target),
			};
		},

		addBadge: async (
			_: unknown,
			args: { userId: string; badgeId: number },
			context: GraphQLContext,
		) => {
			assertCanWrite(context);
			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}
			const success = await UserBadge.Create(args.userId, args.badgeId);
			await target.GetInfo();
			return {
				success,
				message: success ? `Badge ${args.badgeId} added to ${target.Nickname}.` : `Failed to add badge (or already exists).`,
				user: mapUserDetail(target),
			};
		},

		removeBadge: async (
			_: unknown,
			args: { userId: string; badgeId: number },
			context: GraphQLContext,
		) => {
			assertCanWrite(context);
			const target = new User(args.userId);
			const found = await target.GetInfo();
			if (!found) {
				return { success: false, message: "User not found.", user: null };
			}
			const success = await UserBadge.Delete(args.userId, args.badgeId);
			await target.GetInfo();
			return {
				success,
				message: success ? `Badge ${args.badgeId} removed from ${target.Nickname}.` : `Failed to remove badge (not found).`,
				user: mapUserDetail(target),
			};
		},

		swapUsers: async (
			_: unknown,
			args: { firstUserId: string; secondUserId: string },
			context: GraphQLContext,
		) => {
			const admin = assertDeveloper(context);
			if (args.firstUserId === args.secondUserId) {
				return { success: false, message: "Choose two different users.", user: null };
			}

			const [firstUser, secondUser] = await Promise.all([
				UserRepository.FindById(args.firstUserId, ["id", "nickname"]),
				UserRepository.FindById(args.secondUserId, ["id", "nickname"]),
			]);
			if (!firstUser || !secondUser) {
				return { success: false, message: "One or both users were not found.", user: null };
			}

			const temporaryId = `TEMP_${randomBytes(6).toString("hex")}`;
			const updatedTables = await UserRepository.SwapUsers(args.firstUserId, args.secondUserId, temporaryId);
			logger.info(
				`Developer ${admin.username} (${admin.userId}) swapped users ${firstUser.nickname} (${args.firstUserId}) and ${secondUser.nickname} (${args.secondUserId}).`,
			);

			return {
				success: true,
				message: `Swapped all account data between ${firstUser.nickname} and ${secondUser.nickname}. Updated ${updatedTables.length} table references.`,
				user: null,
			};
		},
	},
};
