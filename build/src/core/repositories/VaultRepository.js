"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VaultRepository = void 0;
const Vault_1 = require("#core/database/Vault");
class VaultRepository {
    /**
     * Get the global Vault instance. If it doesn't exist, create it.
     */
    static async GetInstance() {
        const [instance] = await Vault_1.Vault.findOrCreate({
            where: { id: 1 },
            defaults: {
                bankBalance: 50_000_000,
                casinoBalance: 25_000_000,
                mainHeistAllowed: true,
            },
        });
        return instance;
    }
    /**
     * Update the vault balances in the database.
     */
    static async UpdateBalances(bankBalance, casinoBalance) {
        await Vault_1.Vault.update({ bankBalance, casinoBalance }, { where: { id: 1 } });
    }
    static async SetBalance(vault, amount) {
        await Vault_1.Vault.update(vault === "bank" ? { bankBalance: amount } : { casinoBalance: amount }, { where: { id: 1 } });
    }
    /**
     * Toggle the main heist allowed flag in the database.
     */
    static async SetMainHeistAllowed(mainHeistAllowed) {
        await Vault_1.Vault.update({ mainHeistAllowed }, { where: { id: 1 } });
    }
    /**
     * Reset the vault to default starting balances and flags.
     */
    static async Reset(transaction) {
        await Vault_1.Vault.update({
            bankBalance: 50_000_000,
            casinoBalance: 25_000_000,
            mainHeistAllowed: true,
        }, { where: { id: 1 }, transaction });
    }
}
exports.VaultRepository = VaultRepository;
//# sourceMappingURL=VaultRepository.js.map