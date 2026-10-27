import { Language } from "./Language";
import { BackgroundDecorationId } from "#core/types/Ids";
import type { User } from "./User";
export declare class UserBackgroundDecoration {
    UserId: string;
    BackgroundDecorationId: BackgroundDecorationId;
    Description: string;
    static Create(userId: string, backgroundDecorationId: BackgroundDecorationId): Promise<boolean>;
    static HasBackgroundDecoration(userId: string, backgroundDecorationId: BackgroundDecorationId): Promise<boolean>;
    static Delete(userId: string, backgroundDecorationId: BackgroundDecorationId): Promise<boolean>;
    static GetList(user: User, language?: Language): Promise<UserBackgroundDecoration[]>;
}
