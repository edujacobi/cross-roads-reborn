import { Language } from "#core/models/Language";
import type { User } from "#core/models/User";
import { BackgroundDecorationId } from "#core/types/Ids";
import { type Canvas } from "@napi-rs/canvas";
import { BaseCanvasBuilder } from "./BaseCanvasBuilder";
export declare class UserRankingCardCanvasBuilder extends BaseCanvasBuilder {
    User: User;
    Rank: number;
    Value: string;
    AvatarUrl: string | null;
    Decoration: BackgroundDecorationId;
    constructor(user: User, rank: number, value: string, avatarUrl: string | null, language?: Language);
    private GetDecoratedAvatar;
    SetDecoration(decoration: BackgroundDecorationId): this;
    GetCanvas(): Promise<Canvas>;
}
