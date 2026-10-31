"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.topUserRankings = void 0;
exports.assertAuthenticated = assertAuthenticated;
exports.assertAdmin = assertAdmin;
exports.assertCanWrite = assertCanWrite;
exports.assertDeveloper = assertDeveloper;
exports.recordAdminAction = recordAdminAction;
exports.getCooldownValue = getCooldownValue;
exports.getActionValue = getActionValue;
exports.getCurrentDiscordProfile = getCurrentDiscordProfile;
exports.mapUserItems = mapUserItems;
exports.mapUserDetail = mapUserDetail;
exports.isBlackMarketOpen = isBlackMarketOpen;
const graphql_1 = require("graphql");
const AdminAuditLog_1 = require("#core/models/AdminAuditLog");
const Language_1 = require("#core/models/Language");
const Items_1 = require("#core/types/Items");
const Investments_1 = require("#core/types/Investments");
const Locations_1 = require("#core/types/Locations");
const Classes_1 = require("#core/types/Classes");
const GangColors_1 = require("#core/types/GangColors");
const ui_1 = require("#bot/utils/ui");
const UserBadge_1 = require("#core/models/UserBadge");
const date_fns_1 = require("date-fns");
const client_1 = require("#bot/client");
const UserRepository_1 = require("#core/repositories/UserRepository");
const log_1 = require("#shared/log");
// ─── Auth Guards ────────────────────────────────────────────────────────────
function assertAuthenticated(context) {
    if (!context.user) {
        throw new graphql_1.GraphQLError("Autenticação necessária para realizar esta ação.", {
            extensions: { code: "UNAUTHORIZED" },
        });
    }
    return context.user;
}
function assertAdmin(context) {
    const user = assertAuthenticated(context);
    if (user.role === "PLAYER") {
        throw new graphql_1.GraphQLError("Acesso negado: É necessário acesso de administrador.", {
            extensions: { code: "FORBIDDEN" },
        });
    }
    return user;
}
function assertCanWrite(context) {
    const user = assertAuthenticated(context);
    if (user.role !== "DEVELOPER" && user.role !== "MODERATOR") {
        throw new graphql_1.GraphQLError("Acesso negado: Este papel tem acesso somente leitura.", {
            extensions: { code: "FORBIDDEN" },
        });
    }
    return {
        ...user,
        auditRequestInfo: context.auditRequestInfo ?? { ipAddress: null, userAgent: null },
    };
}
function assertDeveloper(context) {
    const user = assertAuthenticated(context);
    if (user.role !== "DEVELOPER") {
        throw new graphql_1.GraphQLError("Acesso negado: É necessário acesso de desenvolvedor.", {
            extensions: { code: "FORBIDDEN" },
        });
    }
    return {
        ...user,
        auditRequestInfo: context.auditRequestInfo ?? { ipAddress: null, userAgent: null },
    };
}
// ─── Admin Audit ─────────────────────────────────────────────────────────────
async function recordAdminAction(admin, actionId, target, previousValue, newValue) {
    await AdminAuditLog_1.AdminAuditLog.Record(admin, actionId, target, previousValue, newValue, admin.auditRequestInfo);
}
// ─── User State Helpers ───────────────────────────────────────────────────────
function getCooldownValue(user, cooldown) {
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
function getActionValue(user, action) {
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
async function getCurrentDiscordProfile(userId) {
    const client = (0, client_1.getClient)();
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
        log_1.logger.warn({ userId, error }, "Could not resolve current Discord profile for admin audit log.");
        return { name: userId, avatarUrl: null };
    }
}
// ─── Mappers ─────────────────────────────────────────────────────────────────
function mapUserItems(user) {
    return (user.Items || []).map((item) => {
        const itemDef = Items_1.ItemList[item.Id];
        return {
            id: item.Id,
            name: itemDef?.Description?.[user.Language] || itemDef?.Description?.[Language_1.Language.English] || `Item #${item.Id}`,
            type: item.Type,
            quantity: item.Quantity,
            skin: item.SelectedSkin,
            remainingTime: item.RemainingTime ? item.RemainingTime.toISOString() : null,
        };
    });
}
async function mapUserDetail(user) {
    const now = new Date();
    const isInHospital = user.Hospital.Time > now;
    const isInPrison = user.Prison.Time > now;
    const isWorking = user.Job.EndsIn > now && user.Job.Id !== null;
    const isScavenging = user.IsScavenging();
    const isWanted = user.Wanted.Time > now;
    const isDead = user.DeadUntil > now;
    const items = mapUserItems(user);
    const className = Classes_1.ClassList[user.Class]?.Name?.[Language_1.Language.Portuguese] || "None";
    const client = (0, client_1.getClient)();
    const activityTargetId = user.BeatUp.IsBeingBeatUpById ??
        user.BeatUp.IsBeatingId ??
        user.Robbery.IsBeingRobbedById ??
        user.Robbery.IsRobbingId;
    // eslint-disable-next-line prefer-const
    let [badges, discordUser, gang, activityTarget] = await Promise.all([
        UserBadge_1.UserBadge.GetList(user.Id, Language_1.Language.Portuguese),
        client.users.fetch(user.Id),
        user.GetGang(),
        activityTargetId ? UserRepository_1.UserRepository.FindById(activityTargetId, ["nickname"]) : null,
    ]);
    if (user.IsVip()) {
        badges = UserBadge_1.UserBadge.AddVIPBadgeInList(badges, user, Language_1.Language.Portuguese);
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
        const investInfo = Investments_1.InvestmentList[user.Investment.Id];
        investment = {
            id: user.Investment.Id,
            name: investInfo.Name[Language_1.Language.Portuguese],
            expiresAt: user.Investment.ExpiresAt?.toISOString(),
            defense: investInfo.BaseDefense,
            nextPaymentValue: (0, ui_1.formatMoney)(user.Investment.AccumulatedYield, Language_1.Language.Portuguese),
            henchmanEndsAt: user.Investment.HenchmanEndsAt?.toISOString(),
        };
    }
    let gangInfo = null;
    if (gang) {
        const roleText = gang.Members.find(member => member.UserId === user.Id).RoleName;
        gangInfo = {
            id: gang.Id,
            name: gang.Name,
            level: gang.Level,
            role: roleText,
            imageUrl: gang.Image,
            color: (0, ui_1.convertHexNumberToString)(GangColors_1.GangColor[gang.Color].Color),
        };
    }
    const lastCommand = client.userLastCommand.get(user.Id) || 0;
    const isOnline = new Date(lastCommand) > (0, date_fns_1.subMinutes)(new Date(), 15);
    return {
        id: user.Id,
        nickname: user.Nickname,
        online: isOnline,
        money: user.Money,
        avatarUrl: discordUser.avatarURL(),
        avatarDecoration: user.AvatarDecoration.Description[Language_1.Language.English].toLowerCase().replaceAll(" ", "_"),
        backgroundDecoration: user.BackgroundDecoration.Description[Language_1.Language.English].toLowerCase().replaceAll(" ", "_"),
        specialCoin: user.SpecialCoin,
        automaticGrenade: user.AutomaticGrenade,
        dailyNextAvailableAt: user.Daily.LastReceived ? (0, date_fns_1.addHours)(user.Daily.LastReceived, 24).toISOString() : null,
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
        scavengingId: isScavenging ? user.Scavenge.IsScavengingId : null,
        robberUserId: user.Robbery.IsRobbingId,
        robbedByUserId: user.Robbery.IsBeingRobbedById,
        robberyLocationId: user.Robbery.IsRobbingLocationId,
        robberyLocationName: user.Robbery.IsRobbingLocationId === null
            ? null
            : Locations_1.LocationList[user.Robbery.IsRobbingLocationId]?.Name[Language_1.Language.Portuguese] ?? null,
        beaterUserId: user.BeatUp.IsBeatingId,
        beatenByUserId: user.BeatUp.IsBeingBeatUpById,
        activityTargetNickname: activityTarget ? `${activityTarget.nickname}` : null,
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
// ─── Ranking Config ───────────────────────────────────────────────────────────
exports.topUserRankings = {
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
};
// ─── Market Helpers ───────────────────────────────────────────────────────────
function isBlackMarketOpen() {
    const OPENNING_HOUR = 21;
    const now = new Date();
    const day = now.getUTCDay();
    const hours = now.getUTCHours();
    const SUNDAY = 0;
    const FRIDAY = 5;
    const SATURDAY = 6;
    return day === SUNDAY || day === SATURDAY || (day === FRIDAY && hours >= OPENNING_HOUR);
}
//# sourceMappingURL=helpers.js.map