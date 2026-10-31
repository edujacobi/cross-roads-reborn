import type { AdminAuditTarget } from "#core/models/AdminAuditLog";
import { type AdminAuditActionId } from "#core/types/AdminAuditLog";
import { type User } from "#core/models/User";
import { Language } from "#core/models/Language";
import type { AuthUser, GraphQLContext } from "#api/types";
export declare function assertAuthenticated(context: GraphQLContext): AuthUser;
export type AdminActor = AuthUser & {
    auditRequestInfo: NonNullable<GraphQLContext["auditRequestInfo"]>;
};
export declare function assertAdmin(context: GraphQLContext): AuthUser;
export declare function assertCanWrite(context: GraphQLContext): AdminActor;
export declare function assertDeveloper(context: GraphQLContext): AdminActor;
export declare function recordAdminAction(admin: AdminActor, actionId: AdminAuditActionId, target: AdminAuditTarget, previousValue: unknown, newValue: unknown): Promise<void>;
export declare function getCooldownValue(user: User, cooldown: string): Date | null;
export declare function getActionValue(user: User, action: string): unknown;
export declare function getCurrentDiscordProfile(userId: string): Promise<{
    name: string;
    avatarUrl: string | null;
}>;
export declare function mapUserItems(user: User): {
    id: import("../../../core/types/Ids").ItemId;
    name: string;
    type: import("#core/types/Items").ItemType;
    quantity: number;
    skin: import("../../../core/types/Ids").BundleId;
    remainingTime: string | null;
}[];
export declare function mapUserDetail(user: User): Promise<{
    id: string;
    nickname: string;
    online: boolean;
    money: number;
    avatarUrl: string | null;
    avatarDecoration: string;
    backgroundDecoration: string;
    specialCoin: number;
    automaticGrenade: boolean;
    dailyNextAvailableAt: string | null;
    nicknameChangeCost: number;
    classChangeCost: number;
    gang: {
        id: number;
        name: string;
        level: number;
        role: string;
        imageUrl: string | null;
        color: string;
    } | null;
    class: import("#core/types/Classes").ClassId;
    className: string;
    attack: number;
    defense: number;
    isVip: boolean;
    vipEternal: boolean;
    vipTime: string | null;
    language: Language;
    isInHospital: boolean;
    hospitalTime: string | null;
    isInPrison: boolean;
    prisonTime: string | null;
    escapeHasTried: boolean;
    prisonHasPaidBribe: boolean;
    isWorking: boolean;
    currentJobId: import("../../../core/types/Jobs").JobId | null;
    jobEndsIn: string | null;
    isScavenging: boolean;
    scavengingId: import("../../../core/types/Ids").ScavengeId | null;
    robberUserId: string | null;
    robbedByUserId: string | null;
    robberyLocationId: import("#core/types/Locations").LocationId | null;
    robberyLocationName: string | null;
    beaterUserId: string | null;
    beatenByUserId: string | null;
    activityTargetNickname: string | null;
    isWanted: boolean;
    wantedTime: string | null;
    isRobbing: boolean;
    isBeingRobbed: boolean;
    isBeating: boolean;
    isBeingBeated: boolean;
    isInCasino: boolean;
    isDefendingInvestment: boolean;
    isInGangAction: boolean;
    isDead: boolean;
    deadUntil: string | null;
    investment: {
        id: import("#core/types/Investments").InvestmentId.CrackDen | import("#core/types/Investments").InvestmentId.BocceCourt | import("#core/types/Investments").InvestmentId.VeganRestaurant | import("#core/types/Investments").InvestmentId.GolfClub | import("#core/types/Investments").InvestmentId.VehicleManufacturer | import("#core/types/Investments").InvestmentId.UnderdevelopedCountry | import("#core/types/Investments").InvestmentId.ReligiousCult | import("#core/types/Investments").InvestmentId.StarGalaxy;
        name: string;
        expiresAt: string | undefined;
        defense: number;
        nextPaymentValue: string;
        henchmanEndsAt: string | undefined;
    } | null;
    situationId: number;
    items: {
        id: import("../../../core/types/Ids").ItemId;
        name: string;
        type: import("#core/types/Items").ItemType;
        quantity: number;
        skin: import("../../../core/types/Ids").BundleId;
        remainingTime: string | null;
    }[];
    voteCount: number;
    activityStats: {
        dailyMaxStreak: number;
        dailyCurrentStreak: number;
        hospitalCount: number;
        hospitalTreatmentCount: number;
        hospitalTreatmentSum: number;
        prisonCount: number;
        escapeCount: number;
        prisonBriberySum: number;
        prisonBriberyCount: number;
        robberySuccessCount: number;
        robberyFailureCount: number;
        robberySuccessRobbedSum: number;
        robberyBeingRobbedCount: number;
        robberyBeingRobbedSum: number;
        beatUpSuccessCount: number;
        beatUpFailureCount: number;
        beatUpBeatedUpCount: number;
        casinoWinCount: number;
        casinoLoseCount: number;
        casinoWinSum: number;
        casinoLoseSum: number;
        almsReceivedSum: number;
        almsReceivedCount: number;
        almsGivenSum: number;
        almsGivenCount: number;
        scavengeFoundCount: number;
        scavengeFailures: number;
        scavengeHospitalizations: number;
        scavengePrisonizations: number;
        jobReceivedSum: number;
        jobReceivedCount: number;
        investmentProfit: number;
        shopSpentSum: number;
        shopSpentCount: number;
    };
    badges: {
        id: import("../../../core/types/Ids").BadgeId;
        name: string;
        description: string;
    }[];
    createdAt: string;
    updatedAt: string;
}>;
export type ResolverFn = (_: unknown, args: any, context: GraphQLContext) => Promise<any> | any;
export declare const topUserRankings: {
    MONEY: {
        orderField: "money";
        countField: undefined;
    };
    GAMBLERS: {
        orderField: "casinoWinSum";
        countField: "casinoWinCount";
    };
    SPENDERS: {
        orderField: "shopSpentSum";
        countField: "shopSpentCount";
    };
    THIEVES: {
        orderField: "robberySuccessRobbedSum";
        countField: "robberySuccessCount";
    };
    WORKERS: {
        orderField: "jobReceivedSum";
        countField: "jobReceivedCount";
    };
    DRUNKERS: {
        orderField: "drinkHappyHour";
        countField: "drunkCount";
    };
    BEATERS: {
        orderField: "beatUpSuccessCount";
        countField: "beatUpBeatedUpCount";
    };
    SCAVENGERS: {
        orderField: "scavengeFoundTotal";
        countField: "scavengeCount";
    };
    HOSPITAL: {
        orderField: "hospitalTreatmentSum";
        countField: "hospitalTreatmentCount";
    };
    BRIBERS: {
        orderField: "prisonBriberySum";
        countField: "prisonBriberyCount";
    };
    ESCAPERS: {
        orderField: "escapeCount";
        countField: "prisonCount";
    };
    INVESTORS: {
        orderField: "investmentTotalProfit";
        countField: undefined;
    };
};
export declare function isBlackMarketOpen(): boolean;
