import { User } from "./User";
import { type InvestmentId, type InvestmentActionResult } from "#core/types/Investments";
export declare class Investment {
    static readonly DURATION_DAYS = 7;
    private static IsProcessing;
    static Initialize(): void;
    /**
     * Returns the Date when the next hourly yield will be processed.
     * Based on LastProcessedHour, the next tick fires at (LastProcessedHour + 1):00:00.
     */
    static GetNextPaymentTime(): Date;
    static ProcessHourlyYield(): Promise<void>;
    /**
     * Allows a user to purchase a new investment.
     * They can only have one active investment at a time.
     */
    static Buy(user: User, investmentId: InvestmentId): Promise<InvestmentActionResult>;
    /**
     * Abandons the current investment, losing all accumulated yield and the property.
     */
    static Abandon(user: User): Promise<InvestmentActionResult>;
    /**
     * Hires a henchman for the current investment for 12 hours.
     */
    static HireHenchman(user: User): Promise<InvestmentActionResult>;
    static HasContractHenchman(user: User): boolean;
    /**
     * Checks if the user currently has an active henchman defending the property.
     */
    static HasActiveHenchman(user: User): boolean;
    /**
     * Toggles the investment yield notification preference.
     */
    static ToggleNotifyYield(user: User): Promise<boolean>;
}
