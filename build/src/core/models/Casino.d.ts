import type { User } from "./User";
import { Language } from "./Language";
export declare class Casino {
    static CanUserPlayGame(user: User, amount: number, language?: Language): Promise<{
        canPlay: boolean;
        message: string;
    }>;
    static StartUserGame(user: User): Promise<boolean>;
    static FinishUserGameWithWin(user: User, prize: number, betAmount?: number): Promise<void>;
    static FinishUserGameWithLoss(user: User, amount: number): Promise<void>;
    static FinishUserGameWithLossNoSubtraction(user: User, amount: number): Promise<void>;
}
