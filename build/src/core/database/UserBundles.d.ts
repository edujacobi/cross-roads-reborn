import { type CreationOptional, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
import type { BundleId } from "#core/types/Ids";
export declare class UserBundles extends Model<InferAttributes<UserBundles>, InferCreationAttributes<UserBundles>> {
    id: CreationOptional<number>;
    userId: string;
    bundleId: BundleId;
}
export default UserBundles;
