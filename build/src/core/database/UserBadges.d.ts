import { type CreationOptional, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
export declare class UserBadges extends Model<InferAttributes<UserBadges>, InferCreationAttributes<UserBadges>> {
    id: CreationOptional<number>;
    userId: string;
    badgeId: number;
}
export default UserBadges;
