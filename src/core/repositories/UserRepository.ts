import { sequelize } from "#core/database/Database";
import GangMembers from "#core/database/GangMembers";
import Gangs from "#core/database/Gangs";
import { HorseRaceBets } from "#core/database/HorseRaceBets";
import { LotteryTickets } from "#core/database/LotteryTickets";
import { Notifications } from "#core/database/Notifications";
import { RobHistories } from "#core/database/RobHistories";
import UserAvatarDecorations from "#core/database/UserAvatarDecorations";
import UserBackgroundDecorations from "#core/database/UserBackgroundDecorations";
import UserBadges from "#core/database/UserBadges";
import UserBundles from "#core/database/UserBundles";
import { UserInvestments } from "#core/database/UserInvestments";
import { UserItems } from "#core/database/UserItems";
import { Users } from "#core/database/Users";
import { Op, QueryTypes, type InferAttributes, type InferCreationAttributes, type Optional } from "sequelize";
import { type NullishPropertiesOf } from "sequelize/lib/utils";

import type { Language } from "#core/models/Language";
import { ClassId } from "#core/types/Classes";

export type UserUpdateParam = Partial<InferAttributes<Users>>;

export class UserRepository {
	/**
	 * Finds a user by their primary key (ID).
	 * @param id The user's Discord ID.
	 * @param attributes Optional list of attributes to select.
	 */
	static async FindById(
		id: string,
		attributes?: (keyof Users)[]
	): Promise<Users | null> {
		return await Users.findByPk(id, attributes ? { attributes } : undefined);
	}

	/**
	 * Creates a new user record in the database.
	 * @param values Initial field values.
	 */
	static async Create(values: Optional<InferCreationAttributes<Users>, NullishPropertiesOf<InferCreationAttributes<Users>>>): Promise<Users> {
		return await Users.create(values);
	}

	/**
	 * Updates a user record matching the ID.
	 * @param id The user's Discord ID.
	 * @param values Updated field values.
	 */
	static async Update(
		id: string,
		values: UserUpdateParam
	): Promise<[number]> {
		return await Users.update(values, {
			where: { id },
		});
	}

	/**
	 * Searches for a user by nickname (case-insensitive/like match) or exact ID.
	 * @param nameOrId The nickname search query or Discord ID.
	 */
	static async SearchByNameOrId(nameOrId: string): Promise<Users | null> {
		return await Users.findOne({
			where: {
				[Op.or]: {
					nickname: {
						[Op.like]: nameOrId,
					},
					id: nameOrId,
				},
			},
		});
	}

	/**
	 * Increments the user's money and total investment profit columns.
	 * @param id The user's Discord ID.
	 * @param amount The profit/money amount to increment.
	 */
	static async IncrementMoneyAndProfit(id: string, amount: number): Promise<void> {
		await Users.increment(
			{ money: amount, investmentTotalProfit: amount },
			{ where: { id } }
		);
	}

	/**
	 * Finds all users who are currently hospitalized.
	 */
	static async FindAllHospitalized(): Promise<Users[]> {
		return await Users.findAll({
			attributes: ["nickname", "class", "hospitalTime", "hospitalCount"],
			order: [["hospitalTime", "DESC"]],
			where: { hospitalTime: { [Op.gt]: new Date() } }
		});
	}

	/**
	 * Finds all users who are currently in prison.
	 */
	static async FindAllPrisoners(): Promise<Users[]> {
		return await Users.findAll({
			attributes: ["nickname", "class", "prisonTime", "robberyFailureCount", "escapeCount"],
			order: [["prisonTime", "DESC"]],
			where: { prisonTime: { [Op.gt]: new Date() } }
		});
	}

	/**
	 * Finds all users who are currently dead.
	 */
	static async FindAllDead(): Promise<Users[]> {
		return await Users.findAll({
			attributes: ["nickname", "class", "deadUntil"],
			order: [["deadUntil", "DESC"]],
			where: { deadUntil: { [Op.gt]: new Date() } }
		});
	}

	/**
	 * Finds all VIP users with pagination.
	 */
	static async FindAllVips(limit: number, offset: number): Promise<Users[]> {
		return await Users.findAll({
			where: {
				[Op.or]: {
					vipTime: { [Op.gt]: new Date() },
					vipEternal: { [Op.not]: false },
				},
			},
			limit,
			offset,
			order: [["vipTime", "DESC"]],
		});
	}

	/**
	 * Counts all VIP users.
	 */
	static async CountVips(): Promise<number> {
		return await Users.count({
			where: {
				[Op.or]: {
					vipTime: { [Op.gt]: new Date() },
					vipEternal: { [Op.not]: false },
				},
			},
		});
	}

	/**
	 * Finds top users for a specific column.
	 */
	static async FindTopUsers(topType: keyof Users, limit: number, offset: number): Promise<Users[]> {
		return await Users.findAll({
			limit,
			offset,
			order: [[topType, "DESC"]],
			where: {
				class: { [Op.not]: ClassId.None },
				[topType]: { [Op.gt]: 0 }
			}
		});
	}

	/**
	 * Counts top users for a specific column.
	 */
	static async CountTopUsers(topType: keyof Users): Promise<number> {
		return await Users.count({
			where: {
				class: { [Op.not]: ClassId.None },
				[topType]: { [Op.gt]: 0 }
			}
		});
	}

	/**
	 * Counts active players (with a class chosen).
	 */
	static async CountActivePlayers(): Promise<number> {
		return await Users.count({
			where: { class: { [Op.not]: ClassId.None } }
		});
	}

	/**
	 * Counts prisoners.
	 */
	static async CountPrisoners(date: Date): Promise<number> {
		return await Users.count({
			where: { prisonTime: { [Op.gt]: date } }
		});
	}

	/**
	 * Counts hospitalized users.
	 */
	static async CountHospitalized(date: Date): Promise<number> {
		return await Users.count({
			where: { hospitalTime: { [Op.gt]: date } }
		});
	}

	/**
	 * Counts working users.
	 */
	static async CountWorking(date: Date): Promise<number> {
		return await Users.count({
			where: {
				jobTime: { [Op.gt]: date },
				jobId: { [Op.ne]: null }
			}
		});
	}

	/**
	 * Counts scavenging users.
	 */
	static async CountScavenging(date: Date): Promise<number> {
		return await Users.count({
			where: {
				scavengeTime: { [Op.gt]: date },
				scavengingId: { [Op.ne]: null }
			}
		});
	}

	/**
	 * Counts users currently in a casino game.
	 */
	static async CountInCasinoGame(): Promise<number> {
		return await Users.count({
			where: { casinoIsInGame: true }
		});
	}

	/**
	 * Counts users currently in a robbery.
	 */
	static async CountInRobbery(): Promise<number> {
		return await Users.count({
			where: {
				[Op.or]: [
					{ robbingUserId: { [Op.ne]: null } },
					{ robbingLocationId: { [Op.ne]: null } }
				]
			}
		});
	}

	/**
	 * Counts users in a beatup.
	 */
	static async CountInBeatUp(): Promise<number> {
		return await Users.count({
			where: { beatingUserId: { [Op.ne]: null } }
		});
	}

	/**
	 * Counts players by language.
	 */
	static async CountPlayersByLanguage(language: Language): Promise<number> {
		return await Users.count({
			where: { language, class: { [Op.not]: ClassId.None } }
		});
	}

	/**
	 * Counts users grouped by class.
	 */
	static async CountGroupedByClass() {
		return await Users.count({
			attributes: ["class"],
			group: ["class"],
			where: {
				class: {
					[Op.not]: ClassId.None,
				},
			},
		}) as unknown as { class: number; count: number }[];
	}

	/**
	 * Swaps two users across all database tables using a transaction.
	 */
	static async SwapUsers(oldId: string, newId: string, tempId: string): Promise<string[]> {
		const transaction = await sequelize.transaction();
		try {
			await sequelize.query("PRAGMA defer_foreign_keys = ON", { transaction });

			const updates = [
				{ tableName: Users.tableName, column: "id" },
				{ tableName: Users.tableName, column: "robbingUserId" },
				{ tableName: Users.tableName, column: "beingRobbedByUserId" },
				{ tableName: Users.tableName, column: "beatingUserId" },
				{ tableName: Users.tableName, column: "beingBeatUpByUserId" },
				{ tableName: UserItems.tableName, column: "userId" },
				{ tableName: UserBadges.tableName, column: "userId" },
				{ tableName: UserInvestments.tableName, column: "userId" },
				{ tableName: UserBundles.tableName, column: "userId" },
				{ tableName: UserAvatarDecorations.tableName, column: "userId" },
				{ tableName: UserBackgroundDecorations.tableName, column: "userId" },
				{ tableName: Notifications.tableName, column: "userId" },
				{ tableName: GangMembers.tableName, column: "userId" },
				{ tableName: Gangs.tableName, column: "leaderId" },
				{ tableName: HorseRaceBets.tableName, column: "userId" },
				{ tableName: LotteryTickets.tableName, column: "userId" },
				{ tableName: RobHistories.tableName, column: "attackerId" },
				{ tableName: RobHistories.tableName, column: "defenderId" }
			];

			const details: string[] = [];

			for (const { tableName, column } of updates) {
				await sequelize.query(
					`UPDATE ${tableName} SET ${column} = :tempId WHERE ${column} = :oldId`,
					{ replacements: { oldId, tempId }, type: QueryTypes.UPDATE, transaction }
				);

				await sequelize.query(
					`UPDATE ${tableName} SET ${column} = :oldId WHERE ${column} = :newId`,
					{ replacements: { oldId, newId }, type: QueryTypes.UPDATE, transaction }
				);

				await sequelize.query(
					`UPDATE ${tableName} SET ${column} = :newId WHERE ${column} = :tempId`,
					{ replacements: { newId, tempId }, type: QueryTypes.UPDATE, transaction }
				);

				details.push(`- **${tableName}**: Swapped ${column}`);
			}

			await transaction.commit();
			return details;
		}
		catch (error) {
			await transaction.rollback();
			throw error;
		}
	}

	/**
	 * Finds all active users (who have chosen a class and are not dead/banned).
	 */
	static async FindAllActive(attributes?: (keyof Users)[]): Promise<Users[]> {
		return await Users.findAll({
			where: {
				class: {
					[Op.not]: ClassId.None,
				},
				[Op.or]: [
					{ deadUntil: null },
					{ deadUntil: { [Op.lte]: new Date() } },
				],
			},
			attributes,
		});
	}

	/**
	 * Searches and paginates users for admin panel.
	 */
	static async SearchUsers(options: { search?: string; limit?: number; offset?: number }): Promise<{ users: Users[]; total: number }> {
		const limit = Math.min(options.limit || 20, 100);
		const offset = options.offset || 0;
		const whereClause = options.search
			? {
				[Op.or]: [
					{ id: { [Op.like]: `%${options.search}%` } },
					{ nickname: { [Op.like]: `%${options.search}%` } },
				],
			}
			: {};

		const { rows, count } = await Users.findAndCountAll({
			where: whereClause,
			limit,
			offset,
			order: [["money", "DESC"]],
		});

		return { users: rows, total: count };
	}
}

