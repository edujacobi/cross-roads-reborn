import { VaultRepository } from "#core/repositories/VaultRepository";
import { Log } from "#shared/log";

export class Vault {
	/**
	 * Gets the current bank and casino balances.
	 */
	static async GetBalances(): Promise<{ bank: number; casino: number }> {
		const instance = await VaultRepository.GetInstance();
		return {
			bank: instance.bankBalance,
			casino: instance.casinoBalance,
		};
	}

	/**
	 * Checks if the main heist is allowed (e.g. by admin overrides).
	 */
	static async IsMainHeistAllowed(): Promise<boolean> {
		const instance = await VaultRepository.GetInstance();
		return instance.mainHeistAllowed;
	}

	/**
	 * Sets the main heist allowed flag.
	 */
	static async SetMainHeistAllowed(allowed: boolean): Promise<void> {
		await VaultRepository.SetMainHeistAllowed(allowed);
		Log.Success(`Vault: Admin updated mainHeistAllowed to ${allowed}.`);
	}

	/**
	 * Adds funds to the Central Bank Vault.
	 */
	static async AddBankFunds(amount: number): Promise<void> {
		if (amount <= 0) return;
		const instance = await VaultRepository.GetInstance();
		const newBalance = instance.bankBalance + amount;
		await VaultRepository.UpdateBalances(newBalance, instance.casinoBalance);
		Log.Success(`Vault: Deposited Cr$ ${amount.toLocaleString()} into Central Bank Vault. New balance: Cr$ ${newBalance.toLocaleString()}`);
	}

	/**
	 * Adds funds to the Casino Vault.
	 */
	static async AddCasinoFunds(amount: number): Promise<void> {
		if (amount <= 0) return;
		const instance = await VaultRepository.GetInstance();
		const newBalance = instance.casinoBalance + amount;
		await VaultRepository.UpdateBalances(instance.bankBalance, newBalance);
		Log.Success(`Vault: Deposited Cr$ ${amount.toLocaleString()} into Casino Vault. New balance: Cr$ ${newBalance.toLocaleString()}`);
	}

	/**
	 * Deducts funds from the Central Bank Vault (safeguarded at 0).
	 */
	static async DeductBankFunds(amount: number): Promise<void> {
		if (amount <= 0) return;
		const instance = await VaultRepository.GetInstance();
		const newBalance = Math.max(0, instance.bankBalance - amount);
		await VaultRepository.UpdateBalances(newBalance, instance.casinoBalance);
		Log.Success(`Vault: Withdrew Cr$ ${amount.toLocaleString()} from Central Bank Vault. New balance: Cr$ ${newBalance.toLocaleString()}`);
	}

	/**
	 * Deducts funds from the Casino Vault (safeguarded at 0).
	 */
	static async DeductCasinoFunds(amount: number): Promise<void> {
		if (amount <= 0) return;
		const instance = await VaultRepository.GetInstance();
		const newBalance = Math.max(0, instance.casinoBalance - amount);
		await VaultRepository.UpdateBalances(instance.bankBalance, newBalance);
		Log.Success(`Vault: Withdrew Cr$ ${amount.toLocaleString()} from Casino Vault. New balance: Cr$ ${newBalance.toLocaleString()}`);
	}
}
