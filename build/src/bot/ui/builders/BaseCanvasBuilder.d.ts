import { type Language } from "#core/models/Language";
import { Canvas, type Image, type SKRSContext2D } from "@napi-rs/canvas";
export declare class BaseCanvasBuilder {
    Width: number;
    Height: number;
    Canvas: Canvas;
    Ctx: SKRSContext2D;
    Padding: number;
    Language: Language;
    protected IsBuilt: boolean;
    private static AssetCache;
    constructor(width: number, height: number, language: Language);
    /**
     * Builds the canvas content. Subclasses should override this.
     * @returns The built canvas.
     */
    GetCanvas(): Promise<Canvas>;
    /**
     * Internal method to ensure the canvas is built only once.
     */
    protected build(): Promise<Canvas>;
    /**
     * Generates the image buffer.
     * @param quality WebP quality (0-100), defaults to 80 for optimal balance.
     * @returns The image buffer.
     */
    GenerateImage(quality?: number): Promise<Buffer>;
    /**
     * Preloads multiple local images into the cache in parallel.
     * @param imagePaths Array of paths relative to src/bot/
     */
    static PreloadLocalImages(imagePaths: (string | null | undefined)[]): Promise<void>;
    /**
     * Loads a local image from the project assets.
     * @param imagePath Path relative to src/bot/
     */
    LoadLocalImage(imagePath: string): Promise<Image>;
    /**
     * Loads an external image from a URL.
     * @param imageUrl The URL of the image to load.
     * @returns The loaded image.
     */
    LoadExternalImage(imageUrl: string): Promise<Image>;
    /**
     * Attempts to load an image and execute a draw action.
     * Logs missing assets in development only, addressing review point #4.
     */
    protected tryDrawImage(imagePath: string, draw: (img: Image) => void): Promise<boolean>;
}
