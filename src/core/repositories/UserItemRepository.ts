import { UserItems } from "#core/database/UserItems";
import type { ItemId } from "#core/types/Ids";
import { type InferAttributes, type InferCreationAttributes, Op, type Optional } from "sequelize";
import { type NullishPropertiesOf } from "sequelize/lib/utils";

export type UserItemUpdateParam = Partial<InferAttributes<UserItems>>;

export class UserItemRepository {
	/**
	 * Finds a user item by its primary key.
	 */
	static async FindByPk(id: number): Promise<UserItems | null> {
		return await UserItems.findByPk(id);
	}

	/**
	 * Finds a user item by userId and itemId.
	 */
	static async FindByUserAndItem(userId: string, itemId: ItemId): Promise<UserItems | null> {
		return await UserItems.findOne({
			where: { userId, itemId },
		});
	}

	/**
	 * Finds all items belonging to a user.
	 */
	static async FindAllByUser(userId: string): Promise<UserItems[]> {
		return await UserItems.findAll({
			where: { userId },
		});
	}

	/**
	 * Finds all items belonging to a user matching specific item IDs.
	 */
	static async FindAllByUserAndItems(userId: string, itemIds: ItemId[]): Promise<UserItems[]> {
		return await UserItems.findAll({
			where: {
				userId,
				itemId: {
					[Op.in]: itemIds,
				},
			},
		});
	}

	/**
	 * Finds active (unexpired or quantity > 0) items belonging to a user.
	 */
	static async FindActiveByUser(userId: string): Promise<UserItems[]> {
		return await UserItems.findAll({
			where: {
				userId,
				[Op.or]: {
					remainingTime: {
						[Op.gt]: new Date(),
					},
					quantity: {
						[Op.gt]: 0,
					},
				},
			},
			order: [["remainingTime", "ASC"]],
		});
	}

	/**
	 * Counts how many active users possess a specific item.
	 */
	static async CountUsersWithItem(itemId: ItemId): Promise<number> {
		return await UserItems.count({
			where: {
				itemId,
				[Op.or]: {
					remainingTime: {
						[Op.gt]: new Date(),
					},
					quantity: {
						[Op.gt]: 0,
					},
				},
			},
		});
	}

	/**
	 * Creates a new user item record.
	 */
	static async Create(values: Optional<InferCreationAttributes<UserItems>, NullishPropertiesOf<InferCreationAttributes<UserItems>>>): Promise<UserItems> {
		return await UserItems.create(values);
	}

	/**
	 * Bulk creates user item records.
	 */
	static async BulkCreate(records: Optional<InferCreationAttributes<UserItems>, NullishPropertiesOf<InferCreationAttributes<UserItems>>>[]): Promise<UserItems[]> {
		return await UserItems.bulkCreate(records);
	}

	/**
	 * Updates the skin of a user item.
	 */
	static async UpdateSkin(userId: string, itemId: ItemId, skinId: number): Promise<void> {
		await UserItems.update(
			{ skin: skinId },
			{ where: { userId, itemId } }
		);
	}

	/**
	 * Updates the skins of a set of user items.
	 */
	static async UpdateBundleSkins(userId: string, itemIds: ItemId[], skinId: number): Promise<void> {
		await UserItems.update(
			{ skin: skinId },
			{ where: { userId, itemId: { [Op.in]: itemIds } } }
		);
	}

	/**
	 * Updates the remaining time and/or quantity of a user item.
	 */
	static async UpdateDurationOrQuantity(
		userId: string,
		itemId: ItemId,
		values: Pick<UserItemUpdateParam, "quantity" | "remainingTime">
	): Promise<void> {
		await UserItems.update(values, {
			where: { userId, itemId },
		});
	}

	/**
	 * Decrements the quantity of a user item.
	 */
	static async DecrementQuantity(userId: string, itemId: ItemId, amount: number): Promise<void> {
		await UserItems.decrement("quantity", {
			by: amount,
			where: { userId, itemId },
		});
	}

	/**
	 * Upserts a user item record.
	 */
	static async Upsert(values: Optional<InferCreationAttributes<UserItems>, NullishPropertiesOf<InferCreationAttributes<UserItems>>>): Promise<void> {
		await UserItems.upsert(values);
	}
}

