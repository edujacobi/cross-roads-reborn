import { BackgroundDecorationId } from "#core/types/Ids";
import { type Image } from "@napi-rs/canvas";
export declare const CARD_WIDTH = 1200;
export declare const CARD_HEIGHT = 150;
export declare const CARD_BACKGROUND_OPACITY = 0.35;
export declare const CARD_AVATAR_SIZE = 130;
export declare class BackgroundPatternRegistry {
    private static patterns;
    static initialize(): Promise<void>;
    static get(bgId: BackgroundDecorationId): Image;
    private static getBgColors;
    private static getBgAngle;
    private static prepareClip;
    private static renderGloss;
    private static renderBorder;
    private static renderSpecialEffects;
    private static renderFrutigerAero;
    private static renderSilver;
    private static renderCloud;
}
