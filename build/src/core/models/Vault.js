"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Vault = void 0;
const VaultRepository_1 = require("#core/repositories/VaultRepository");
const log_1 = require("#shared/log");
class Vault {
    /**
     * Gets the current bank and casino balances.
     */
    static async GetBalances() {
        const instance = await VaultRepository_1.VaultRepository.GetInstance();
        return {
            bank: instance.bankBalance,
            casino: instance.casinoBalance,
        };
    }
    /**
     * Checks if the main heist is allowed (e.g. by admin overrides).
     */
    static async IsMainHeistAllowed() {
        const instance = await VaultRepository_1.VaultRepository.GetInstance();
        return instance.mainHeistAllowed;
    }
    /**
     * Sets the main heist allowed flag.
     */
    static async SetMainHeistAllowed(allowed) {
        await VaultRepository_1.VaultRepository.SetMainHeistAllowed(allowed);
        log_1.Log.Success(`Vault: Admin updated mainHeistAllowed to ${allowed}.`);
    }
    /**
     * Adds funds to the Central Bank Vault.
     */
    static async AddBankFunds(amount) {
        if (amount <= 0)
            return;
        const instance = await VaultRepository_1.VaultRepository.GetInstance();
        const newBalance = instance.bankBalance + amount;
        await VaultRepository_1.VaultRepository.UpdateBalances(newBalance, instance.casinoBalance);
        log_1.Log.Success(`Vault: Deposited Cr$ ${amount.toLocaleString()} into Central Bank Vault. New balance: Cr$ ${newBalance.toLocaleString()}`);
    }
    /**
     * Adds funds to the Casino Vault.
     */
    static async AddCasinoFunds(amount) {
        if (amount <= 0)
            return;
        const instance = await VaultRepository_1.VaultRepository.GetInstance();
        const newBalance = instance.casinoBalance + amount;
        await VaultRepository_1.VaultRepository.UpdateBalances(instance.bankBalance, newBalance);
        log_1.Log.Success(`Vault: Deposited Cr$ ${amount.toLocaleString()} into Casino Vault. New balance: Cr$ ${newBalance.toLocaleString()}`);
    }
    /**
     * Deducts funds from the Central Bank Vault (safeguarded at 0).
     */
    static async DeductBankFunds(amount) {
        if (amount <= 0)
            return;
        const instance = await VaultRepository_1.VaultRepository.GetInstance();
        const newBalance = Math.max(0, instance.bankBalance - amount);
        await VaultRepository_1.VaultRepository.UpdateBalances(newBalance, instance.casinoBalance);
        log_1.Log.Success(`Vault: Withdrew Cr$ ${amount.toLocaleString()} from Central Bank Vault. New balance: Cr$ ${newBalance.toLocaleString()}`);
    }
    /**
     * Deducts funds from the Casino Vault (safeguarded at 0).
     */
    static async DeductCasinoFunds(amount) {
        if (amount <= 0)
            return;
        const instance = await VaultRepository_1.VaultRepository.GetInstance();
        const newBalance = Math.max(0, instance.casinoBalance - amount);
        await VaultRepository_1.VaultRepository.UpdateBalances(instance.bankBalance, newBalance);
        log_1.Log.Success(`Vault: Withdrew Cr$ ${amount.toLocaleString()} from Casino Vault. New balance: Cr$ ${newBalance.toLocaleString()}`);
    }
}
exports.Vault = Vault;
//# sourceMappingURL=Vault.js.map