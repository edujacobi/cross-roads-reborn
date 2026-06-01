import { RobHistories } from "#core/database/RobHistories";
import type { BeatUp } from "#core/models/BeatUp";
import type { InvestmentRobbery } from "#core/models/InvestmentRobbery";
import { Language } from "#core/models/Language";
import { type LocationRobberyStrategy } from "#core/models/strategies/robbery/LocationRobberyStrategy";
import { type UserRobberyStrategy } from "#core/models/strategies/robbery/UserRobberyStrategy";
import { LocationList } from "#core/types/Locations";
import { ClashType } from "#core/types/Robbery";
import { Log } from "#shared/log";
import { Op } from "sequelize";

export class RobHistoryRepository {
	/**
	 * Counts how many robberies/beat ups a user was involved in.
	 */
	static async Count(userId: string): Promise<number> {
		return await RobHistories.count({
			where: {
				[Op.or]: [{ attackerId: userId }, { defenderId: userId }],
			},
		});
	}

	/**
	 * Gets a page of robbery/beat up history for a user.
	 */
	static async GetList(userId: string, limit: number, offset: number): Promise<RobHistories[]> {
		return await RobHistories.findAll({
			limit,
			order: [["createdAt", "DESC"]],
			offset,
			where: {
				[Op.or]: [{ attackerId: userId }, { defenderId: userId }],
			},
		});
	}

	/**
	 * Creates a history record for a user-to-user robbery.
	 */
	static async CreateUserRobberyHistory(robbery: UserRobberyStrategy): Promise<void> {
		try {
			await RobHistories.create({
				attackerId: robbery.Attacker.Id,
				defenderId: robbery.Defender.Id,
				success: robbery.Success,
				money: robbery.MoneyRobbed,
				type: robbery.Type,
			});

			Log.Success(`Robbery History for ${robbery.Attacker.Nickname} (Id: ${robbery.Attacker.Id}) and ${robbery.Defender.Nickname} (Id: ${robbery.Defender.Id}) added successfully.`);
		}
		catch (err) {
			Log.Warning(`Something went wrong with adding Robbery History for ${robbery.Attacker.Nickname} (Id: ${robbery.Attacker.Id}) and ${robbery.Defender.Nickname} (Id: ${robbery.Defender.Id}).`);
		}
	}

	/**
	 * Creates a history record for a location robbery.
	 */
	static async CreateLocationHistory(robbery: LocationRobberyStrategy): Promise<void> {
		try {
			await RobHistories.create({
				attackerId: robbery.Attacker.Id,
				locationId: robbery.LocationId,
				success: robbery.Success,
				money: robbery.MoneyRobbed,
				type: robbery.Type,
			});

			Log.Success(`Robbery History for ${robbery.Attacker.Nickname} (Id: ${robbery.Attacker.Id}) and ${LocationList[robbery.LocationId].Name[Language.English]} (Id: ${robbery.LocationId}) added successfully.`);
		}
		catch (err) {
			Log.Warning(`Something went wrong with adding Robbery History for ${robbery.Attacker.Nickname} (Id: ${robbery.Attacker.Id}) and ${LocationList[robbery.LocationId].Name[Language.English]} (Id: ${robbery.LocationId}).`);
		}
	}

	/**
	 * Creates a history record for a beat up.
	 */
	static async CreateUserBeatUpHistory(beatup: BeatUp): Promise<void> {
		try {
			await RobHistories.create({
				attackerId: beatup.Attacker.Id,
				defenderId: beatup.Defender.Id,
				success: beatup.Success,
				money: 0,
				type: ClashType.BeatUp,
			});

			Log.Success(`Beat Up History for ${beatup.Attacker.Nickname} (Id: ${beatup.Attacker.Id}) and ${beatup.Defender.Nickname} (Id: ${beatup.Defender.Id}) added successfully.`);
		}
		catch (err) {
			Log.Warning(`Something went wrong with adding Beat Up History for ${beatup.Attacker.Nickname} (Id: ${beatup.Attacker.Id}) and ${beatup.Defender.Nickname} (Id: ${beatup.Defender.Id}).`);
		}
	}

	/**
	 * Bulk creates history records for an investment robbery.
	 */
	static async CreateInvestmentHistory(robbery: InvestmentRobbery, win: boolean, robbedAmount: number): Promise<void> {
		try {
			const histories = Array.from(robbery.Participants.values()).map(participant => ({
				attackerId: participant.Id,
				defenderId: robbery.Target.Id,
				locationId: robbery.InvestmentBase?.Id,
				success: win,
				money: Math.floor(robbedAmount / robbery.Participants.size),
				type: ClashType.Investment,
			}));

			await RobHistories.bulkCreate(histories);

			Log.Success(`Investment Robbery History for Gang ${robbery.Gang.Name} and target ${robbery.Target.Nickname} (Id: ${robbery.Target.Id}) added successfully.`);
		}
		catch (err) {
			Log.Warning(`Something went wrong with adding Investment Robbery History for Gang ${robbery.Gang.Name} and target ${robbery.Target.Nickname} (Id: ${robbery.Target.Id}). ${err}`);
		}
	}

	/**
	 * Count of all robbery history records.
	 */
	static async CountAll(): Promise<number> {
		return await RobHistories.count();
	}

	/**
	 * Erases all robbery history records.
	 */
	static async DestroyAll(): Promise<number> {
		return await RobHistories.destroy({ where: {} });
	}
}
