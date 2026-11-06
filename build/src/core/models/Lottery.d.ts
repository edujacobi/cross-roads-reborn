import { User } from "./User";
import type { LotteryDraws } from "#core/database/LotteryDraws";
import type { LotteryTickets } from "#core/database/LotteryTickets";
export declare class Lottery {
    static IsMegaDraw(drawDate: Date): boolean;
    static GetTicketPrice(drawDate: Date): number;
    /** Returns what the user actually pays (VIPs get 25% off). */
    static GetTicketCost(drawDate: Date, isVip: boolean): number;
    static GetNextDraw(): Promise<LotteryDraws | null>;
    static GetLastWinner(): Promise<{
        draw: LotteryDraws;
        ticket: LotteryTickets | null;
        user: User | null;
    } | null>;
    static HasUserBoughtTicket(userId: string, drawId: number): Promise<LotteryTickets | null>;
    static BuyTicket(user: User): Promise<{
        success: boolean;
        message: string;
        ticketId?: number;
        amount?: number;
    }>;
    static RunDraw(drawId: number): Promise<void>;
    static ScheduleNextDraw(): Promise<void>;
    static CheckPendingDraws(): Promise<void>;
    static Initialize(): Promise<void>;
}
