import { type CreationOptional, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
import type { AvatarDecorationId } from "#core/types/Ids";
export declare class UserAvatarDecorations extends Model<InferAttributes<UserAvatarDecorations>, InferCreationAttributes<UserAvatarDecorations>> {
    id: CreationOptional<number>;
    userId: string;
    avatarDecorationId: AvatarDecorationId;
}
export default UserAvatarDecorations;
