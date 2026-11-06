"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseCanvasBuilder = void 0;
const log_1 = require("#shared/log");
const canvas_1 = require("@napi-rs/canvas");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
class BaseCanvasBuilder {
    Width;
    Height;
    Canvas;
    Ctx;
    Padding = 8;
    Language;
    IsBuilt = false;
    // Centralized cache for decoded Image objects
    static AssetCache = new Map();
    constructor(width, height, language) {
        this.Width = width;
        this.Height = height;
        this.Language = language;
        this.Canvas = new canvas_1.Canvas(width, height);
        this.Ctx = this.Canvas.getContext("2d");
    }
    /**
     * Builds the canvas content. Subclasses should override this.
     * @returns The built canvas.
     */
    async GetCanvas() {
        return this.Canvas;
    }
    /**
     * Internal method to ensure the canvas is built only once.
     */
    async build() {
        if (this.IsBuilt)
            return this.Canvas;
        const canvas = await this.GetCanvas();
        this.IsBuilt = true;
        return canvas;
    }
    /**
     * Generates the image buffer.
     * @param quality WebP quality (0-100), defaults to 80 for optimal balance.
     * @returns The image buffer.
     */
    async GenerateImage(quality = 80) {
        const canvas = await this.build();
        return canvas.encode("webp", quality);
    }
    /**
     * Preloads multiple local images into the cache in parallel.
     * @param imagePaths Array of paths relative to src/bot/
     */
    static async PreloadLocalImages(imagePaths) {
        const paths = imagePaths.filter((p) => !!p);
        const uniquePaths = [...new Set(paths)];
        await Promise.all(uniquePaths.map(async (imagePath) => {
            const fullPath = imagePath.startsWith("src/bot")
                ? node_path_1.default.join(process.cwd(), imagePath)
                : node_path_1.default.join(process.cwd(), "src/bot", imagePath);
            if (BaseCanvasBuilder.AssetCache.has(fullPath))
                return;
            try {
                if (node_fs_1.default.existsSync(fullPath)) {
                    const buffer = node_fs_1.default.readFileSync(fullPath);
                    const image = await (0, canvas_1.loadImage)(buffer);
                    BaseCanvasBuilder.AssetCache.set(fullPath, image);
                }
            }
            catch (error) {
                log_1.logger.error(`[Canvas] Failed to preload asset: ${imagePath}`, error);
            }
        }));
    }
    /**
     * Loads a local image from the project assets.
     * @param imagePath Path relative to src/bot/
     */
    async LoadLocalImage(imagePath) {
        const fullPath = imagePath.startsWith("src/bot")
            ? node_path_1.default.join(process.cwd(), imagePath)
            : node_path_1.default.join(process.cwd(), "src/bot", imagePath);
        // Check cache first
        const cached = BaseCanvasBuilder.AssetCache.get(fullPath);
        if (cached)
            return cached;
        if (!node_fs_1.default.existsSync(fullPath)) {
            throw new Error(`File not found: ${fullPath}`);
        }
        const buffer = node_fs_1.default.readFileSync(fullPath);
        const image = await (0, canvas_1.loadImage)(buffer);
        // Store in cache
        BaseCanvasBuilder.AssetCache.set(fullPath, image);
        return image;
    }
    /**
     * Loads an external image from a URL.
     * @param imageUrl The URL of the image to load.
     * @returns The loaded image.
     */
    async LoadExternalImage(imageUrl) {
        try {
            return await (0, canvas_1.loadImage)(imageUrl);
        }
        catch (error) {
            console.error(`Error loading remote image url: ${imageUrl}`, error);
            throw error;
        }
    }
    /**
     * Attempts to load an image and execute a draw action.
     * Logs missing assets in development only, addressing review point #4.
     */
    async tryDrawImage(imagePath, draw) {
        try {
            const img = await this.LoadLocalImage(imagePath);
            draw(img);
            return true;
        }
        catch {
            // Log only in development
            if (process.env.NODE_ENV === "DEV") {
                log_1.logger.warn(`[Canvas] Missing asset: ${imagePath}`);
            }
            return false;
        }
    }
}
exports.BaseCanvasBuilder = BaseCanvasBuilder;
//# sourceMappingURL=BaseCanvasBuilder.js.map