import { UserItems } from "#core/database/UserItems";
import type { ItemId } from "#core/types/Ids";
import { type InferAttributes, type InferCreationAttributes, type Optional } from "sequelize";
import { type NullishPropertiesOf } from "sequelize/lib/utils";
export type UserItemUpdateParam = Partial<InferAttributes<UserItems>>;
export declare class UserItemRepository {
    /**
     * Finds a user item by its primary key.
     */
    static FindByPk(id: number): Promise<UserItems | null>;
    /**
     * Finds a user item by userId and itemId.
     */
    static FindByUserAndItem(userId: string, itemId: ItemId): Promise<UserItems | null>;
    /**
     * Finds all items belonging to a user.
     */
    static FindAllByUser(userId: string): Promise<UserItems[]>;
    /**
     * Finds all items belonging to a user matching specific item IDs.
     */
    static FindAllByUserAndItems(userId: string, itemIds: ItemId[]): Promise<UserItems[]>;
    /**
     * Finds active (unexpired or quantity > 0) items belonging to a user.
     */
    static FindActiveByUser(userId: string): Promise<UserItems[]>;
    /**
     * Counts how many active users possess a specific item.
     */
    static CountUsersWithItem(itemId: ItemId): Promise<number>;
    /**
     * Creates a new user item record.
     */
    static Create(values: Optional<InferCreationAttributes<UserItems>, NullishPropertiesOf<InferCreationAttributes<UserItems>>>): Promise<UserItems>;
    /**
     * Bulk creates user item records.
     */
    static BulkCreate(records: Optional<InferCreationAttributes<UserItems>, NullishPropertiesOf<InferCreationAttributes<UserItems>>>[]): Promise<UserItems[]>;
    /**
     * Updates the skin of a user item.
     */
    static UpdateSkin(userId: string, itemId: ItemId, skinId: number): Promise<void>;
    /**
     * Updates the skins of a set of user items.
     */
    static UpdateBundleSkins(userId: string, itemIds: ItemId[], skinId: number): Promise<void>;
    /**
     * Updates the remaining time and/or quantity of a user item.
     */
    static UpdateDurationOrQuantity(userId: string, itemId: ItemId, values: Pick<UserItemUpdateParam, "quantity" | "remainingTime">): Promise<void>;
    /**
     * Decrements the quantity of a user item.
     */
    static DecrementQuantity(userId: string, itemId: ItemId, amount: number): Promise<void>;
    /**
     * Upserts a user item record.
     */
    static Upsert(values: Optional<InferCreationAttributes<UserItems>, NullishPropertiesOf<InferCreationAttributes<UserItems>>>): Promise<void>;
}
