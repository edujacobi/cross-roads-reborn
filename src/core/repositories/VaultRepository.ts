import { Vault } from "#core/database/Vault";

export class VaultRepository {
	/**
	 * Get the global Vault instance. If it doesn't exist, create it.
	 */
	static async GetInstance(): Promise<Vault> {
		const [instance] = await Vault.findOrCreate({
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
	static async UpdateBalances(bankBalance: number, casinoBalance: number): Promise<void> {
		await Vault.update(
			{ bankBalance, casinoBalance },
			{ where: { id: 1 } },
		);
	}

	/**
	 * Toggle the main heist allowed flag in the database.
	 */
	static async SetMainHeistAllowed(mainHeistAllowed: boolean): Promise<void> {
		await Vault.update(
			{ mainHeistAllowed },
			{ where: { id: 1 } },
		);
	}
}
