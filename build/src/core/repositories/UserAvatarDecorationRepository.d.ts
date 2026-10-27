import { UserAvatarDecorations } from "#core/database/UserAvatarDecorations";
import type { InferCreationAttributes, Optional } from "sequelize";
import type { NullishPropertiesOf } from "sequelize/lib/utils";
export declare class UserAvatarDecorationRepository {
    static FindOne(userId: string, avatarDecorationId: number): Promise<UserAvatarDecorations | null>;
    static FindAllByUserId(userId: string): Promise<UserAvatarDecorations[]>;
    static Create(values: Optional<InferCreationAttributes<UserAvatarDecorations>, NullishPropertiesOf<InferCreationAttributes<UserAvatarDecorations>>>): Promise<UserAvatarDecorations>;
    static Destroy(userId: string, avatarDecorationId: number): Promise<number>;
    static DestroyAll(): Promise<number>;
}
