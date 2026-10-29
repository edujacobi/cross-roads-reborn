import type { User } from "./User";
import type { Gang } from "./Gang";
import { type Investment } from "#core/types/Investments";
import type { UserInvestments } from "#core/database/UserInvestments";
export declare enum InvestmentRobberyReason {
    NoPermission = 0,
    CantRobYourself = 1,
    LeaderNotIdling = 2,
    TargetSameGang = 3,
    WithoutItem = 4,
    TargetWithoutNick = 5,
    TargetWithoutClass = 6,
    TargetAlreadyUnderAttack = 7,
    TargetNoInvestment = 8,
    TargetNoYield = 9,
    NotInGang = 10,
    ParticipateNotIdling = 11,
    LeaderIsWanted = 12,
    ParticipateIsWanted = 13
}
export interface InvestmentRobberyValidation {
    success: boolean;
    reason?: InvestmentRobberyReason;
    investmentData?: UserInvestments;
    investmentBase?: Investment;
}
export interface InvestmentRobberyResult {
    win: boolean;
    totalAtk: number;
    totalDef: number;
    successChance: number;
    robbedAmount: number;
    expGain: number;
    henchmanHospitalized: boolean;
    defenderHospitalized: boolean;
    defenderHospitalTime: Date | null;
    attackersHospitalized: boolean;
    remainingYield: number;
    prisonHours: number;
}
export declare class InvestmentRobbery {
    Gang: Gang;
    Initializer: User;
    Target: User;
    Participants: Map<string, User>;
    InvestmentData: UserInvestments | null;
    InvestmentBase: Investment | null;
    constructor(gang: Gang, initializer: User, target: User);
    Validate(): Promise<InvestmentRobberyValidation>;
    ValidateJoin(participant: User): {
        success: boolean;
        reason?: InvestmentRobberyReason;
    };
    ApplyAttackerState(participant: User): Promise<void>;
    ApplyDefenderState(): Promise<void>;
    ClearTargetState(): Promise<void>;
    ClearAttackerStates(): Promise<void>;
    Abort(): Promise<void>;
    CalculateAndApplyOutcome(defenderJoined: boolean): Promise<InvestmentRobberyResult>;
}
