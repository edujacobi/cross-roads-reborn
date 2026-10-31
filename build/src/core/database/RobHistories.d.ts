import { type CreationOptional, type ForeignKey, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
import type { Users } from "./Users";
export declare class RobHistories extends Model<InferAttributes<RobHistories>, InferCreationAttributes<RobHistories>> {
    id: CreationOptional<number>;
    attackerId: ForeignKey<Users["id"]>;
    defenderId: CreationOptional<ForeignKey<Users["id"]>>;
    locationId: CreationOptional<number>;
    success: boolean;
    money: number;
    type: number;
    createdAt: CreationOptional<Date>;
    updatedAt: CreationOptional<Date>;
}
