export declare class Vault {
    /**
     * Gets the current bank and casino balances.
     */
    static GetBalances(): Promise<{
        bank: number;
        casino: number;
    }>;
    /**
     * Checks if the main heist is allowed (e.g. by admin overrides).
     */
    static IsMainHeistAllowed(): Promise<boolean>;
    /**
     * Sets the main heist allowed flag.
     */
    static SetMainHeistAllowed(allowed: boolean): Promise<void>;
    /**
     * Adds funds to the Central Bank Vault.
     */
    static AddBankFunds(amount: number): Promise<void>;
    /**
     * Adds funds to the Casino Vault.
     */
    static AddCasinoFunds(amount: number): Promise<void>;
    /**
     * Deducts funds from the Central Bank Vault (safeguarded at 0).
     */
    static DeductBankFunds(amount: number): Promise<void>;
    /**
     * Deducts funds from the Casino Vault (safeguarded at 0).
     */
    static DeductCasinoFunds(amount: number): Promise<void>;
}
