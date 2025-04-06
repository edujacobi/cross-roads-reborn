import Konva from "konva";
import { registerFont } from "canvas";
import path from "node:path";

export class BaseCanvasBuilder {
	Width: number;
	Height: number;
	Font = "ui/assets/fonts/Inter-VariableFont_opsz,wght.ttf";
	Stage: Konva.Stage;
	Padding = 24;

	constructor(width: number, height: number) {
		this.Width = width;
		this.Height = height;
		this.Stage = new Konva.Stage({
			width,
			height,
		});

		// registerFont(path.join(process.cwd(), "ui/assets/fonts/", "Inter_24pt-Semibold.ttf"), {
		// 	family: "Inter",
		// 	weight: "600",
		// });
		//
		// registerFont(path.join(process.cwd(), "ui/assets/fonts/", "Inter_28pt-Bold.ttf"), {
		// 	family: "Inter",
		// 	weight: "700",
		// });
	}

	GenerateImage() {
		const dataURL = this.Stage.toDataURL();
		// const dataURL = this.Stage.toDataURL({ mimeType: "image/jpeg", quality: 0.8 });
		return Buffer.from(dataURL.split(",")[1], "base64");
	}
}