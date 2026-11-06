import { Log } from "#shared/log";
import { User } from "./User";
export declare enum NotificationType {
    Daily = 1,
    Job = 2,
    RobAgain = 3,
    Free = 4,
    Hospital = 5,
    AlmsGive = 6,
    AlmsReceive = 7,
    Scavenge = 8,
    BeatAgain = 9,
    HorseRace = 10,
    GangDepositAgain = 11,
    InvestmentYield = 12,
    InvestmentExpired = 13,
    Vote = 14
}
export declare class Notification {
    Id: number;
    UserId: string;
    Type: NotificationType;
    Date: Date;
    Create(): Promise<Log | undefined>;
    static Daily(user: User): Promise<void>;
    static Job(user: User): Promise<void>;
    static RobAgain(user: User): Promise<void>;
    static Free(user: User): Promise<void>;
    static Hospital(user: User): Promise<void>;
    static AlmsGive(user: User): Promise<void>;
    static AlmsReceive(user: User): Promise<void>;
    static Scavenge(user: User): Promise<void>;
    static BeatAgain(user: User): Promise<void>;
    static GangDepositAgain(user: User, nextDeposit: Date): Promise<void>;
    static Vote(user: User, votedAt: Date): Promise<void>;
    static InvestmentYield(user: User, investmentName: string, payout: number, feeAmount?: number, feePercent?: number): Promise<void>;
    static InvestmentExpired(user: User, investmentName: string, payout: number, feeAmount?: number, feePercent?: number): Promise<void>;
    static VipGift(receiver: User, giver: User, days: number): Promise<void>;
    static HasNotificationsToSend(time: Date): Promise<boolean>;
    static GetNextNotifications(time: Date): Promise<Notification[]>;
    SetAsNotified(): Promise<void>;
    static Dismiss(userId: string, type: NotificationType): Promise<void>;
    private static isProcessing;
    static SendTimedNotification(): Promise<void>;
    static StartProcedure(): void;
}
