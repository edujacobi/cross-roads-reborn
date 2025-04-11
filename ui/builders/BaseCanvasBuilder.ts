import Konva from "konva";
import { loadImage } from "canvas";
import path from "node:path";
import { Language } from "../../models/Language";

export class BaseCanvasBuilder {
	Width: number;
	Height: number;
	Stage: Konva.Stage;
	Padding = 24;
	Language: Language;

	constructor(width: number, height: number, language: Language) {
		this.Width = width;
		this.Height = height;
		this.Language = language;

		this.Stage = new Konva.Stage({
			width,
			height,
		});
	}

	GenerateImage() {
		const dataURL = this.Stage.toDataURL();
		// const dataURL = this.Stage.toDataURL({ mimeType: "image/jpeg", quality: 0.8 });
		return Buffer.from(dataURL.split(",")[1], "base64");
	}

	async CreateKonvaImageLocal(imagePath: string, options: Omit<Konva.ImageConfig, "image">) {
		try {
			const imageObj = await loadImage(path.join(process.cwd(), imagePath));

			return new Konva.Image({
				// @ts-expect-error imageObj is not HTML Image
				image: imageObj,
				...options,
			});
		}
		catch (error) {
			console.error("Error loading local image path:", error);
			throw error;
		}
	}

	async CreateKonvaImageUrl(imageUrl: string, options: Omit<Konva.ImageConfig, "image">) {
		try {
			const imageObj = await loadImage(imageUrl);

			return new Konva.Image({
				// @ts-expect-error imageObj is not HTML Image
				image: imageObj,
				...options,
			});
		}
		catch (error) {
			console.error("Error loading remote image url:", error);
			throw error;
		}
	}
}