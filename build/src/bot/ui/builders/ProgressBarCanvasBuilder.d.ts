import { BaseCanvasBuilder } from "./BaseCanvasBuilder";
import { type Language } from "#core/models/Language";
export declare class ProgressBarCanvasBuilder extends BaseCanvasBuilder {
    Ratio: number;
    IconPath: string;
    ColorHex: string;
    constructor(width: number, height: number, ratio: number, iconPath: string, colorHex: string, language: Language);
    GenerateImage(): Promise<Buffer>;
}
