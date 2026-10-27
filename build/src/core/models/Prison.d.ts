import { User } from "./User";
import { Language } from "./Language";
export declare enum PrisonFailureReason {
    BribeNotInPrison = 0,
    EscapeHasTried = 1,
    EscapeEscaping = 2,
    AttackerIsBeingRobbedById = 3,
    AttackerIsBeatingId = 4,
    AttackerIsBeingBeatedById = 5,
    BribeHasPaid = 6,
    BribeEscaping = 7,
    EscapeInHospital = 8,
    BribeInHospital = 9
}
export declare function cleanupActiveEscapes(): void;
export declare class Prison {
    User: User;
    Bribe: {
        BaseValue: number;
        Value: number;
    };
    Escape: {
        HasJetpack: boolean;
        BaseChance: number;
        BaseJetpackChance: number;
        UserChance: number;
        TotalChance: number;
        DefaultDuration: number;
    };
    static BribeTimeInMinutesWanted: number;
    static EscapeTimeInMinutesWanted: number;
    static Initialize(): Promise<void>;
    static RecoverPendingEscapes(): Promise<void>;
    static Arrest(user: User, durationInMinutes: number, { isFromRobbery }?: {
        isFromRobbery?: boolean;
    }): Promise<void>;
    constructor(user: User);
    getGangEscapeModifier(): Promise<number>;
    calculateTotalTime(): number;
    CalculateEscapeChance(): Promise<void>;
    GetPrisoners(): Promise<import("../database/Users").Users[]>;
    CanEscape(): Promise<{
        canEscape: boolean;
        reason: PrisonFailureReason;
        attacker?: undefined;
    } | {
        canEscape: boolean;
        reason: PrisonFailureReason;
        attacker: import("../database/Users").Users | null;
    } | {
        reason?: undefined;
        attacker?: undefined;
        canEscape: boolean;
    }>;
    StartEscape(): Promise<boolean>;
    EndEscape(): Promise<{
        success: boolean;
        totalTime: number;
        message: string;
    } | null>;
    generateEscapeMessage(success: boolean, totalTime: number, language: Language): string;
    CanBribe(): Promise<{
        attacker?: undefined;
        canBribe: boolean;
        reason: PrisonFailureReason;
    } | {
        canBribe: boolean;
        reason: PrisonFailureReason;
        attacker: import("../database/Users").Users | null;
    } | {
        reason?: undefined;
        attacker?: undefined;
        canBribe: boolean;
    }>;
    CalculateBribeValue(): number;
    PayBribery(bribeValue: number): Promise<boolean>;
}
