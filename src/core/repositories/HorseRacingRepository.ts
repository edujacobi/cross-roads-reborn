import { HorseRaces } from "#core/database/HorseRaces";
import { HorseRaceBets } from "#core/database/HorseRaceBets";
import { Op } from "sequelize";
import type { InferAttributes, InferCreationAttributes, Optional } from "sequelize";
import type { NullishPropertiesOf } from "sequelize/lib/utils";

export class HorseRacingRepository {
	// --- Horse Races ---
	static async FindRaceById(id: number): Promise<HorseRaces | null> {
		return await HorseRaces.findByPk(id);
	}

	static async FindNextRace(): Promise<HorseRaces | null> {
		return await HorseRaces.findOne({
			where: { isFinished: false },
			order: [["raceTime", "ASC"]],
		});
	}

	static async FindPreviousRace(currentRaceId: number): Promise<HorseRaces | null> {
		return await HorseRaces.findOne({
			where: { id: { [Op.lt]: currentRaceId }, isFinished: true },
			order: [["id", "DESC"]],
		});
	}

	static async FindPendingRaces(date: Date): Promise<HorseRaces[]> {
		return await HorseRaces.findAll({
			where: { raceTime: { [Op.lt]: date }, isFinished: false },
		});
	}

	static async CreateRace(
		values: Optional<InferCreationAttributes<HorseRaces>, NullishPropertiesOf<InferCreationAttributes<HorseRaces>>>
	): Promise<HorseRaces> {
		return await HorseRaces.create(values);
	}

	static async UpdateRace(
		id: number,
		values: Partial<InferAttributes<HorseRaces>>
	): Promise<[number]> {
		return await HorseRaces.update(values, {
			where: { id },
		});
	}

	static async DestroyAllRaces(): Promise<number> {
		return await HorseRaces.destroy({
			where: {},
		});
	}

	// --- Horse Race Bets ---
	static async FindBetById(id: number): Promise<HorseRaceBets | null> {
		return await HorseRaceBets.findByPk(id);
	}

	static async FindBet(userId: string, raceId: number): Promise<HorseRaceBets | null> {
		return await HorseRaceBets.findOne({
			where: { userId, raceId },
		});
	}

	static async FindBetsForRace(raceId: number): Promise<HorseRaceBets[]> {
		return await HorseRaceBets.findAll({
			where: { raceId },
		});
	}

	static async CreateBet(
		values: Optional<InferCreationAttributes<HorseRaceBets>, NullishPropertiesOf<InferCreationAttributes<HorseRaceBets>>>
	): Promise<HorseRaceBets> {
		return await HorseRaceBets.create(values);
	}

	static async UpdateBet(
		id: number,
		values: Partial<InferAttributes<HorseRaceBets>>
	): Promise<[number]> {
		return await HorseRaceBets.update(values, {
			where: { id },
		});
	}

	static async DestroyAllBets(): Promise<number> {
		return await HorseRaceBets.destroy({
			where: {},
		});
	}
}
