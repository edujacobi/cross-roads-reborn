import { type CreationOptional, type ForeignKey, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
import type { Users } from "./Users";
import type { BundleId, ItemId } from "#core/types/Ids";
export declare class UserItems extends Model<InferAttributes<UserItems>, InferCreationAttributes<UserItems>> {
    id: CreationOptional<number>;
    userId: ForeignKey<Users["id"]>;
    itemId: ForeignKey<ItemId>;
    remainingTime: CreationOptional<Date>;
    quantity: CreationOptional<number>;
    skin: BundleId;
}
