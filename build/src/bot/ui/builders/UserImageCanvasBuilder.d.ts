import { Language } from "#core/models/Language";
import { User } from "#core/models/User";
import type { UserBadge } from "#core/models/UserBadge";
import { AvatarDecorationId } from "#core/types/Ids";
import { Canvas } from "@napi-rs/canvas";
import { BaseCanvasBuilder } from "./BaseCanvasBuilder";
export declare class UserImageCanvasBuilder extends BaseCanvasBuilder {
    User: User;
    AvatarUrl: string;
    Badges: UserBadge[] | null;
    Decoration: AvatarDecorationId;
    constructor(user: User, avatarUrl: string | null, language?: Language);
    SetDecoration(decoration: AvatarDecorationId): this;
    SetBadges(badges: UserBadge[]): this;
    private static AvatarCache;
    GetCanvas(): Promise<Canvas>;
}
export declare function testImage(): Promise<void>;
