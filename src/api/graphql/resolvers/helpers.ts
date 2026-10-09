import { GraphQLError } from "graphql";
import { AdminAuditLog } from "#core/models/AdminAuditLog";
import type { AdminAuditTarget } from "#core/models/AdminAuditLog";
import { type AdminAuditActionId } from "#core/types/AdminAuditLog";
import { type User } from "#core/models/User";
import { Language } from "#core/models/Language";
import { ItemList } from "#core/types/Items";
import { InvestmentList } from "#core/types/Investments";
import { ClassList } from "#core/types/Classes";
import { GangColor } from "#core/types/GangColors";
import type { AuthUser, GraphQLContext } from "#api/types";
import { convertHexNumberToString, formatMoney } from "#bot/utils/ui";
import { UserBadge } from "#core/models/UserBadge";
import { addHours, subMinutes } from "date-fns";
import { getClient } from "#bot/client";
import type { TopUserRankingCountField, TopUserRankingField } from "#core/repositories/UserRepository";
import { logger } from "#shared/log";

// ─── Auth Guards ────────────────────────────────────────────────────────────

export function assertAuthenticated(context: GraphQLContext): AuthUser {
	if (!context.user) {
		throw new GraphQLError("Authentication required to perform this action.", {
			extensions: { code: "UNAUTHORIZED" },
		});
	}
	return context.user;
}

export type AdminActor = AuthUser & {
	auditRequestInfo: NonNullable<GraphQLContext["auditRequestInfo"]>;
};

export function assertAdmin(context: GraphQLContext): AuthUser {
	const user = assertAuthenticated(context);
	if (user.role === "PLAYER") {
		throw new GraphQLError("Forbidden: Admin access required.", {
			extensions: { code: "FORBIDDEN" },
		});
	}
	return user;
}

export function assertCanWrite(context: GraphQLContext): AdminActor {
	const user = assertAuthenticated(context);
	if (user.role !== "DEVELOPER" && user.role !== "MODERATOR") {
		throw new GraphQLError("Forbidden: This role has read-only access.", {
			extensions: { code: "FORBIDDEN" },
		});
	}
	return {
		...user,
		auditRequestInfo: context.auditRequestInfo ?? { ipAddress: null, userAgent: null },
	};
}

export function assertDeveloper(context: GraphQLContext): AdminActor {
	const user = assertAuthenticated(context);
	if (user.role !== "DEVELOPER") {
		throw new GraphQLError("Forbidden: Developer access required.", {
			extensions: { code: "FORBIDDEN" },
		});
	}
	return {
		...user,
		auditRequestInfo: context.auditRequestInfo ?? { ipAddress: null, userAgent: null },
	};
}

// ─── Admin Audit ─────────────────────────────────────────────────────────────

export async function recordAdminAction(
	admin: AdminActor,
	actionId: AdminAuditActionId,
	target: AdminAuditTarget,
	previousValue: unknown,
	newValue: unknown,
): Promise<void> {
	await AdminAuditLog.Record(admin, actionId, target, previousValue, newValue, admin.auditRequestInfo);
}

// ─── User State Helpers ───────────────────────────────────────────────────────

export function getCooldownValue(user: User, cooldown: string): Date | null {
	switch (cooldown) {
	case "scavenge":
		return user.Scavenge.Time;
	case "robbery":
		return user.Wanted.Time;
	case "beatup":
		return user.BeatUp.Time;
	default:
		return null;
	}
}

export function getActionValue(user: User, action: string): unknown {
	switch (action) {
	case "job":
		return { jobId: user.Job.Id };
	case "scavenge":
		return { scavengingId: user.Scavenge.IsScavengingId };
	case "robbery":
		return {
			robbingUserId: user.Robbery.IsRobbingId,
			beingRobbedByUserId: user.Robbery.IsBeingRobbedById,
			robbingLocationId: user.Robbery.IsRobbingLocationId,
			investmentIsDefending: user.Robbery.InvestmentIsDefending,
			participatingInGangAction: user.Robbery.ParticipatingInGangAction,
		};
	case "beatup":
		return {
			beatingUserId: user.BeatUp.IsBeatingId,
			beingBeatUpByUserId: user.BeatUp.IsBeingBeatUpById,
		};
	case "casino":
		return { isInGame: user.Casino.IsInGame };
	case "gangaction":
		return { participatingInGangAction: user.Robbery.ParticipatingInGangAction };
	default:
		return null;
	}
}

// ─── Discord Helpers ─────────────────────────────────────────────────────────

export async function getCurrentDiscordProfile(userId: string): Promise<{ name: string; avatarUrl: string | null }> {
	const client = getClient();
	if (process.env.SERVER_ID) {
		try {
			const guild = client.guilds.cache.get(process.env.SERVER_ID)
				?? await client.guilds.fetch(process.env.SERVER_ID);
			const member = await guild.members.fetch({ user: userId, force: true });
			return {
				name: member.displayName,
				avatarUrl: member.displayAvatarURL({ size: 128 }),
			};
		}
		catch {
			// Fall back to the current Discord account name for users no longer in the server.
		}
	}

	try {
		const discordUser = await client.users.fetch(userId, { force: true });
		return {
			name: discordUser.globalName || discordUser.username,
			avatarUrl: discordUser.displayAvatarURL({ size: 128 }),
		};
	}
	catch (error) {
		logger.warn({ userId, error }, "Could not resolve current Discord profile for admin audit log.");
		return { name: userId, avatarUrl: null };
	}
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

export function mapUserItems(user: User) {
	return (user.Items || []).map((item) => {
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
}

export async function mapUserDetail(user: User) {
	const now = new Date();
	const isInHospital = user.Hospital.Time > now;
	const isInPrison = user.Prison.Time > now;
	const isWorking = user.Job.EndsIn > now && user.Job.Id !== null;
	const isScavenging = user.Scavenge.Time > now && user.Scavenge.IsScavengingId !== null;
	const isWanted = user.Wanted.Time > now;
	const isDead = user.DeadUntil > now;

	const items = mapUserItems(user);

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
		backgroundDecoration: user.BackgroundDecoration.Description[Language.English].toLowerCase().replaceAll(" ", "_"),
		specialCoin: user.SpecialCoin,
		automaticGrenade: user.AutomaticGrenade,
		dailyNextAvailableAt: user.Daily.LastReceived ? addHours(user.Daily.LastReceived, 24).toISOString() : null,
		nicknameChangeCost: user.GetNicknameChangeCost(),
		classChangeCost: user.GetClassChangeCost(),
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
		escapeHasTried: user.Escape.HasTried,
		prisonHasPaidBribe: user.Prison.HasPaidBribe,
		isWorking,
		currentJobId: isWorking ? user.Job.Id : null,
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

// ─── Resolver Type ────────────────────────────────────────────────────────────

// eslint-disable-next-line
export type ResolverFn = (_: unknown, args: any, context: GraphQLContext) => Promise<any> | any;

// ─── Ranking Config ───────────────────────────────────────────────────────────

export const topUserRankings = {
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

// ─── Market Helpers ───────────────────────────────────────────────────────────

export function isBlackMarketOpen(): boolean {
	const OPENNING_HOUR = 21;
	const now = new Date();
	const day = now.getUTCDay();
	const hours = now.getUTCHours();
	const SUNDAY = 0;
	const FRIDAY = 5;
	const SATURDAY = 6;
	return day === SUNDAY || day === SATURDAY || (day === FRIDAY && hours >= OPENNING_HOUR);
}