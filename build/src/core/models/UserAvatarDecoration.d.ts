import { Language } from "./Language";
import { AvatarDecorationId } from "#core/types/Ids";
import type { User } from "./User";
export declare class UserAvatarDecoration {
    UserId: string;
    AvatarDecorationId: AvatarDecorationId;
    Description: string;
    static Create(userId: string, avatarDecorationId: AvatarDecorationId): Promise<boolean>;
    static HasAvatarDecoration(userId: string, avatarDecorationId: AvatarDecorationId): Promise<boolean | undefined>;
    static Delete(userId: string, avatarDecorationId: AvatarDecorationId): Promise<boolean>;
    static GetList(user: User, language?: Language): Promise<UserAvatarDecoration[]>;
}
