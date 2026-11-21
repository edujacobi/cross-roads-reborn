import { UserInvestments } from "#core/database/UserInvestments";
export declare class UserInvestmentRepository {
    /**
     * Finds a user investment by their userId.
     */
    static FindByUserId(userId: string): Promise<UserInvestments | null>;
    /**
     * Finds all active user investments.
     */
    static FindAll(): Promise<UserInvestments[]>;
    /**
     * Creates a new user investment record.
     */
    static Create(values: {
        userId: string;
        investmentId: number;
        expiresAt: Date;
        accumulatedYield?: number;
        accumulatedFee?: number;
        henchmanEndsAt?: Date | null;
        henchmanHospitalized?: boolean;
        lastYieldAt?: Date | null;
    }): Promise<UserInvestments>;
    /**
     * Updates user investments matching the userId.
     */
    static UpdateByUserId(userId: string, values: Partial<UserInvestments>): Promise<void>;
    /**
     * Destroys user investments matching the userId.
     */
    static DestroyByUserId(userId: string): Promise<number>;
    /**
     * Count of all user investments.
     */
    static Count(): Promise<number>;
    /**
     * Decrements accumulated yield for a user investment.
     */
    static DecrementYield(userId: string, amount: number): Promise<void>;
    /**
     * Increments yield and fee for a user investment.
     */
    static IncrementYieldAndFee(userId: string, yieldAmount: number, feeAmount: number): Promise<void>;
}
