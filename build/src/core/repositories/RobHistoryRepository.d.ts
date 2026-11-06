import { RobHistories } from "#core/database/RobHistories";
import type { BeatUp } from "#core/models/BeatUp";
import type { InvestmentRobbery } from "#core/models/InvestmentRobbery";
import { type LocationRobberyStrategy } from "#core/models/strategies/robbery/LocationRobberyStrategy";
import { type UserRobberyStrategy } from "#core/models/strategies/robbery/UserRobberyStrategy";
export declare class RobHistoryRepository {
    /**
     * Counts how many robberies/beat ups a user was involved in.
     */
    static Count(userId: string): Promise<number>;
    /**
     * Gets a page of robbery/beat up history for a user.
     */
    static GetList(userId: string, limit: number, offset: number): Promise<RobHistories[]>;
    /**
     * Creates a history record for a user-to-user robbery.
     */
    static CreateUserRobberyHistory(robbery: UserRobberyStrategy): Promise<void>;
    /**
     * Creates a history record for a location robbery.
     */
    static CreateLocationHistory(robbery: LocationRobberyStrategy): Promise<void>;
    /**
     * Creates a history record for a beat up.
     */
    static CreateUserBeatUpHistory(beatup: BeatUp): Promise<void>;
    /**
     * Bulk creates history records for an investment robbery.
     */
    static CreateInvestmentHistory(robbery: InvestmentRobbery, win: boolean, robbedAmount: number): Promise<void>;
    /**
     * Count of all robbery history records.
     */
    static CountAll(): Promise<number>;
    /**
     * Erases all robbery history records.
     */
    static DestroyAll(): Promise<number>;
}
