import { AvatarDecorationId } from "#core/types/Ids";
import { type Image } from "@napi-rs/canvas";
export declare const AVATAR_CANVAS_SIZE = 512;
export declare const AVATAR_BORDER_WIDTH = 20;
export declare const AVATAR_RADIUS = 214;
export declare const AVATAR_CENTER_X: number;
export declare const AVATAR_CENTER_Y: number;
export declare class AvatarDecorationRegistry {
    private static patterns;
    static initialize(): Promise<void>;
    static get(id: AvatarDecorationId): Image;
    private static getBorderStyle;
    private static getSecondaryStyle;
    private static renderPremiumEffects;
}
