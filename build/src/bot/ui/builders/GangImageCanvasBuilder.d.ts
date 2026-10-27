import type { Gang } from "#core/models/Gang";
import { Language } from "#core/models/Language";
import { User } from "#core/models/User";
import { type Canvas, type SKRSContext2D } from "@napi-rs/canvas";
import { BaseCanvasBuilder } from "./BaseCanvasBuilder";
export declare const DEFAULT_GANG_IMAGE = "https://i.imgur.com/xOUjOlZ.png";
export declare class GangImageCanvasBuilder extends BaseCanvasBuilder {
    User: User;
    Gang: Gang;
    IsFullSize: boolean;
    constructor(user: User, gang: Gang, language: Language, isFullSize?: boolean);
    private static GangImageCache;
    GetCanvas(): Promise<Canvas>;
    DrawGangInfo(ctx: SKRSContext2D, x: number, y: number): Promise<void>;
}
export declare function testImage(): Promise<void>;
