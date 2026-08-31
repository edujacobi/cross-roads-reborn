import { GangHeists } from "#core/database/GangHeists";
import type { InferAttributes } from "sequelize";

export class GangHeistRepository {
	/**
	 * Gets the heist state for a gang. If none exists, creates it.
	 */
	static async GetByGangId(gangId: number): Promise<GangHeists> {
		const [instance] = await GangHeists.findOrCreate({
			where: { gangId },
			defaults: {
				gangId,
				heistCooldownUntil: null,
				mission1Completed: false,
				mission1CooldownUntil: null,
				mission2Completed: false,
				mission2CooldownUntil: null,
				mission3Completed: false,
				mission3CooldownUntil: null,
				heistWins: 0,
				heistLosses: 0,
				totalStolen: 0,
			},
		});
		return instance;
	}

	/**
	 * Updates the heist state for a gang.
	 */
	static async Update(gangId: number, values: Partial<InferAttributes<GangHeists>>): Promise<void> {
		await GangHeists.update(values, {
			where: { gangId },
		});
	}
}
