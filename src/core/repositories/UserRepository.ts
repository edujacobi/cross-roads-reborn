import { Users } from "#core/database/Users";
import { type InferAttributes, type InferCreationAttributes, Op, type Optional } from "sequelize";
import { type NullishPropertiesOf } from "sequelize/lib/utils";

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
}

