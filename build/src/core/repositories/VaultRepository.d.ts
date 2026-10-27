import { Vault } from "#core/database/Vault";
import { type Transaction } from "sequelize";
export declare class VaultRepository {
    /**
     * Get the global Vault instance. If it doesn't exist, create it.
     */
    static GetInstance(): Promise<Vault>;
    /**
     * Update the vault balances in the database.
     */
    static UpdateBalances(bankBalance: number, casinoBalance: number): Promise<void>;
    /**
     * Toggle the main heist allowed flag in the database.
     */
    static SetMainHeistAllowed(mainHeistAllowed: boolean): Promise<void>;
    /**
     * Reset the vault to default starting balances and flags.
     */
    static Reset(transaction?: Transaction): Promise<void>;
}
