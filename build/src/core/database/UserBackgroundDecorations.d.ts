import { type CreationOptional, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
import type { BackgroundDecorationId } from "#core/types/Ids";
export declare class UserBackgroundDecorations extends Model<InferAttributes<UserBackgroundDecorations>, InferCreationAttributes<UserBackgroundDecorations>> {
    id: CreationOptional<number>;
    userId: string;
    backgroundDecorationId: BackgroundDecorationId;
}
export default UserBackgroundDecorations;
