import { type Language } from "#core/models/Language";
import { logger } from "#shared/log";
import { Canvas, loadImage, type Image, type SKRSContext2D } from "@napi-rs/canvas";
import fs from "node:fs";
import path from "node:path";

export class BaseCanvasBuilder {
	Width: number;
	Height: number;
	Canvas: Canvas;
	Ctx: SKRSContext2D;
	Padding = 8;
	Language: Language;
	protected IsBuilt = false;

	// Centralized cache for decoded Image objects
	private static AssetCache = new Map<string, Image>();

	constructor(width: number, height: number, language: Language) {
		this.Width = width;
		this.Height = height;
		this.Language = language;

		this.Canvas = new Canvas(width, height);
		this.Ctx = this.Canvas.getContext("2d");
	}

	/**
	 * Builds the canvas content. Subclasses should override this.
	 * @returns The built canvas.
	 */
	async GetCanvas(): Promise<Canvas> {
		return this.Canvas;
	}

	/**
	 * Internal method to ensure the canvas is built only once.
	 */
	protected async build(): Promise<Canvas> {
		if (this.IsBuilt) return this.Canvas;
		const canvas = await this.GetCanvas();
		this.IsBuilt = true;
		return canvas;
	}

	/**
	 * Generates the image buffer.
	 * @param quality WebP quality (0-100), defaults to 80 for optimal balance.
	 * @returns The image buffer.
	 */
	async GenerateImage(quality = 80): Promise<Buffer> {
		const canvas = await this.build();
		return canvas.encode("webp", quality);
	}

	/**
	 * Preloads multiple local images into the cache in parallel.
	 * @param imagePaths Array of paths relative to src/bot/
	 */
	static async PreloadLocalImages(imagePaths: (string | null | undefined)[]) {
		const paths = imagePaths.filter((p): p is string => !!p);
		const uniquePaths = [...new Set(paths)];

		await Promise.all(uniquePaths.map(async (imagePath) => {
			const fullPath = imagePath.startsWith("src/bot")
				? path.join(process.cwd(), imagePath)
				: path.join(process.cwd(), "src/bot", imagePath);

			if (BaseCanvasBuilder.AssetCache.has(fullPath)) return;

			try {
				if (fs.existsSync(fullPath)) {
					const buffer = fs.readFileSync(fullPath);
					const image = await loadImage(buffer);
					BaseCanvasBuilder.AssetCache.set(fullPath, image);
				}
			}
			catch (error) {
				logger.error(`[Canvas] Failed to preload asset: ${imagePath}`, error);
			}
		}));
	}

	/**
	 * Loads a local image from the project assets.
	 * @param imagePath Path relative to src/bot/
	 */
	async LoadLocalImage(imagePath: string) {
		const fullPath = imagePath.startsWith("src/bot")
			? path.join(process.cwd(), imagePath)
			: path.join(process.cwd(), "src/bot", imagePath);

		// Check cache first
		const cached = BaseCanvasBuilder.AssetCache.get(fullPath);
		if (cached) return cached;

		if (!fs.existsSync(fullPath)) {
			throw new Error(`File not found: ${fullPath}`);
		}

		const buffer = fs.readFileSync(fullPath);
		const image = await loadImage(buffer);

		// Store in cache
		BaseCanvasBuilder.AssetCache.set(fullPath, image);

		return image;
	}

	/**
	 * Loads an external image from a URL.
	 * @param imageUrl The URL of the image to load.
	 * @returns The loaded image.
	 */
	async LoadExternalImage(imageUrl: string) {
		try {
			return await loadImage(imageUrl);
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
	protected async tryDrawImage(
		imagePath: string,
		draw: (img: Image) => void
	): Promise<boolean> {
		try {
			const img = await this.LoadLocalImage(imagePath);
			draw(img);
			return true;
		}
		catch {
			// Log only in development
			if (process.env.NODE_ENV === "DEV") {
				logger.warn(`[Canvas] Missing asset: ${imagePath}`);
			}
			return false;
		}
	}
}
