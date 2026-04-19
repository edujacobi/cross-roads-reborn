import { type Language } from "#core/models/Language";
import { Canvas, type SKRSContext2D, loadImage, type Image } from "@napi-rs/canvas";
import path from "node:path";
import fs from "node:fs";
import { logger } from "#shared/log";

export class BaseCanvasBuilder {
	Width: number;
	Height: number;
	Canvas: Canvas;
	Ctx: SKRSContext2D;
	Padding = 8;
	Language: Language;

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
	 * Generates the image buffer.
	 * @returns The image buffer.
	 */
	async GenerateImage(): Promise<Buffer> {
		return this.Canvas.encode("webp");
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
