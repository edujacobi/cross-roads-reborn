import { Users } from "#core/database/Users";
import { type InferAttributes, type InferCreationAttributes, type Optional } from "sequelize";
import { type NullishPropertiesOf } from "sequelize/lib/utils";
import type { Language } from "#core/models/Language";
export type UserUpdateParam = Partial<InferAttributes<Users>>;
export type TopUserRankingField = "money" | "casinoWinSum" | "shopSpentSum" | "robberySuccessRobbedSum" | "jobReceivedSum" | "drinkHappyHour" | "beatUpSuccessCount" | "scavengeFoundTotal" | "hospitalTreatmentSum" | "prisonBriberySum" | "escapeCount" | "investmentTotalProfit";
export type TopUserRankingCountField = "casinoWinCount" | "shopSpentCount" | "robberySuccessCount" | "jobReceivedCount" | "drunkCount" | "beatUpBeatedUpCount" | "scavengeCount" | "hospitalTreatmentCount" | "prisonBriberyCount" | "prisonCount";
export declare class UserRepository {
    /**
     * Finds a user by their primary key (ID).
     * @param id The user's Discord ID.
     * @param attributes Optional list of attributes to select.
     */
    static FindById(id: string, attributes?: (keyof Users)[]): Promise<Users | null>;
    /**
     * Creates a new user record in the database.
     * @param values Initial field values.
     */
    static Create(values: Optional<InferCreationAttributes<Users>, NullishPropertiesOf<InferCreationAttributes<Users>>>): Promise<Users>;
    /**
     * Updates a user record matching the ID.
     * @param id The user's Discord ID.
     * @param values Updated field values.
     */
    static Update(id: string, values: UserUpdateParam): Promise<[number]>;
    static IsResolvingAction(): boolean;
    static GiftVipForDays(giverId: string, receiverId: string, days: number, price: number): Promise<boolean>;
    /**
     * Atomically clear scavengingId only if it's not already null.
     * Returns true if this call was the one that cleared it (first caller).
     * Returns false if scavengingId was already null (another caller already ended it).
     */
    static ClearScavengingId(id: string): Promise<boolean>;
    static TryStartCasinoGame(id: string): Promise<boolean>;
    static TryStartEscape(id: string, escapeTime: Date): Promise<boolean>;
    static FindOverdueEscapes(): Promise<Pick<Users, "id">[]>;
    static TryEndEscape(id: string, escapeTime: Date, prisonTime: Date, values: Pick<UserUpdateParam, "escapeTime" | "escapeCount" | "prisonTime" | "wantedTime">): Promise<boolean>;
    /**
     * Deletes a user and all data that references their ID in one transaction.
     */
    static DeleteUser(id: string): Promise<boolean>;
    /**
     * Searches for a user by nickname (case-insensitive/like match) or exact ID.
     * @param nameOrId The nickname search query or Discord ID.
     */
    static SearchByNameOrId(nameOrId: string): Promise<Users | null>;
    /**
     * Increments the user's money and total investment profit columns.
     * @param id The user's Discord ID.
     * @param amount The profit/money amount to increment.
     */
    static IncrementMoneyAndProfit(id: string, amount: number): Promise<void>;
    /**
     * Finds all users who are currently hospitalized.
     */
    static FindAllHospitalized(): Promise<Users[]>;
    /**
     * Finds hospitalized users with pagination, search, and sorting.
     */
    static FindHospitalized(options: {
        search?: string;
        limit?: number;
        offset?: number;
        sortBy?: string;
        sortOrder?: string;
    }): Promise<{
        users: Users[];
        total: number;
    }>;
    /**
     * Finds all users who are currently in prison.
     */
    static FindAllPrisoners(): Promise<Users[]>;
    /**
     * Finds prisoners with pagination, search, and sorting.
     */
    static FindPrisoners(options: {
        search?: string;
        limit?: number;
        offset?: number;
        sortBy?: string;
        sortOrder?: string;
    }): Promise<{
        users: Users[];
        total: number;
    }>;
    /**
     * Finds all users who are currently dead.
     */
    static FindAllDead(): Promise<Users[]>;
    /**
     * Finds all VIP users with pagination.
     */
    static FindAllVips(limit: number, offset: number): Promise<Users[]>;
    /**
     * Counts all VIP users.
     */
    static CountVips(): Promise<number>;
    /**
     * Finds top users for a specific column.
     */
    static FindTopUsers(topType: TopUserRankingField, limit: number, offset: number): Promise<Users[]>;
    /**
     * Counts top users for a specific column.
     */
    static CountTopUsers(topType: TopUserRankingField): Promise<number>;
    /**
     * Counts active players (with a class chosen).
     */
    static CountActivePlayers(): Promise<number>;
    /**
     * Counts all registered users.
     */
    static CountAllUsers(): Promise<number>;
    /**
     * Counts prisoners.
     */
    static CountPrisoners(date: Date): Promise<number>;
    /**
     * Counts hospitalized users.
     */
    static CountHospitalized(date: Date): Promise<number>;
    /**
     * Counts working users.
     */
    static CountWorking(date: Date): Promise<number>;
    /**
     * Counts scavenging users.
     */
    static CountScavenging(date: Date): Promise<number>;
    /**
     * Counts users currently in a casino game.
     */
    static CountInCasinoGame(): Promise<number>;
    /**
     * Counts users currently in a robbery.
     */
    static CountInRobbery(): Promise<number>;
    /**
     * Counts users in a beatup.
     */
    static CountInBeatUp(): Promise<number>;
    /**
     * Counts all users by language.
     */
    static CountPlayersByLanguage(language: Language): Promise<number>;
    /**
     * Counts users grouped by class.
     */
    static CountGroupedByClass(): Promise<{
        class: number;
        count: number;
    }[]>;
    /**
     * Swaps two users across all database tables using a transaction.
     */
    static SwapUsers(oldId: string, newId: string, tempId: string): Promise<string[]>;
    /**
     * Finds all active users (who have chosen a class and are not dead/banned).
     */
    static FindAllActive(attributes?: (keyof Users)[]): Promise<Users[]>;
    /**
     * Searches and paginates users for admin panel.
     */
    static SearchUsers(options: {
        search?: string;
        limit?: number;
        offset?: number;
        vipOnly?: boolean;
        sortBy?: string;
        sortOrder?: string;
    }): Promise<{
        users: Users[];
        total: number;
    }>;
}
