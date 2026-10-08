import { Season } from "#core/models/Season";
import { Vault } from "#core/models/Vault";
import { Language } from "#core/models/Language";
import { AdminAuditActionId, AdminAuditSettingId } from "#core/types/AdminAuditLog";
import type { GraphQLContext } from "#api/types";
import { assertDeveloper, assertAdmin, recordAdminAction } from "./helpers";
import type { ResolverFn } from "./helpers";

export const seasonResolvers: {
	Query: Record<string, ResolverFn>;
	Mutation: Record<string, ResolverFn>;
} = {
	Query: {
		seasonInfo: async (_: unknown, __: unknown, context: GraphQLContext) => {
			assertAdmin(context);
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
	},

	Mutation: {
		setMainHeistAllowed: async (
			_: unknown,
			args: { allowed: boolean },
			context: GraphQLContext,
		) => {
			const admin = assertDeveloper(context);
			const previousValue = await Vault.IsMainHeistAllowed();
			await Vault.SetMainHeistAllowed(args.allowed);
			await recordAdminAction(
				admin,
				AdminAuditActionId.SetMainHeistAllowed,
				{ settingId: AdminAuditSettingId.MainHeist },
				previousValue,
				args.allowed,
			);
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
			const admin = assertDeveloper(context);
			const previousSeason = await Season.GetCurrent();
			await Season.EndCurrentSeason(args.isPreSeason);
			const newSeason = await Season.GetCurrent();
			await recordAdminAction(
				admin,
				AdminAuditActionId.EndSeason,
				{ settingId: AdminAuditSettingId.Season },
				{ number: previousSeason.Number, startDate: previousSeason.StartDate, endDate: previousSeason.EndDate },
				{
					number: newSeason.Number,
					startDate: newSeason.StartDate,
					endDate: newSeason.EndDate,
					isPreSeason: args.isPreSeason,
				},
			);
			return {
				success: true,
				message: args.isPreSeason
					? "Pre-season values reset and a new season started."
					: "Season ended, winners awarded, announcements sent, and a new season started.",
			};
		},
	},
};
