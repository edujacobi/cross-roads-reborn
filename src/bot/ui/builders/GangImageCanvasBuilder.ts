import { User } from "@core/models/User";
import { Gang } from "@core/models/Gang";
import { Language } from "@core/models/Language";
import { Canvas, Image, loadImage } from "@napi-rs/canvas";
import { logger } from "@shared/log";
import { convertHexNumberToString, hexToRGB } from "@bot/utils/ui";
import { GangColor } from "@bot/utils/colors";
import fs from "node:fs";

export const DEFAULT_GANG_IMAGE = "https://i.imgur.com/xOUjOlZ.png";

// Cache for gang images
const gangImageCache: Map<string, Image> = new Map();

export class GangImageCanvasBuilder {
	User: User;
	Gang: Gang;
	Language: Language;

	constructor(user: User, gang: Gang, language: Language) {
		this.User = user;
		this.Gang = gang;
		this.Language = language;
	}

	async GenerateImage() {
		const Strings = {
			[Language.English]: {
				of: "of",
				level: "Level",
			},
			[Language.Portuguese]: {
				of: "de",
				level: "Nível",
			},
			[Language.Spanish]: {
				of: "de",
				level: "Nivel",
			},
		} as const;

		const canvas = new Canvas(1024, 100);
		const ctx = canvas.getContext("2d");
		let image: Image;

		const imageUrl = this.Gang.Image ?? DEFAULT_GANG_IMAGE;

		if (gangImageCache.has(imageUrl)) {
			image = gangImageCache.get(imageUrl)!;
		}
		else {
			try {
				image = await loadImage(imageUrl);
				gangImageCache.set(imageUrl, image);
			}
			catch (error) {
				logger.error(`Error loading gang image. Default image used instead.`, error);
				// Try to load default image, check cache first
				if (gangImageCache.has(DEFAULT_GANG_IMAGE)) {
					image = gangImageCache.get(DEFAULT_GANG_IMAGE)!;
				}
				else {
					image = await loadImage(DEFAULT_GANG_IMAGE);
					gangImageCache.set(DEFAULT_GANG_IMAGE, image);
				}
			}
		}

		// Background
		const color = hexToRGB(convertHexNumberToString(GangColor[this.Gang.Color].Color));
		ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.15)`;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		const padding = 22;
		const radius = 32;
		const imageSize = radius * 2;

		const circleX = padding + radius;
		const circleY = ctx.canvas.height / 2;

		// Draw circle
		ctx.beginPath();
		ctx.arc(circleX, circleY, radius, 0, Math.PI * 2);
		ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.5)`;
		ctx.fill();

		// Image
		ctx.save();
		ctx.clip();
		// Calculate the top-left corner to center the image inside the circle
		const imageX = circleX - radius;
		const imageY = circleY - radius;
		ctx.drawImage(image, imageX, imageY, imageSize, imageSize);
		ctx.restore();

		// Text
		const margin = 110;
		const roleText = `${this.Gang.Members.find(member => member.UserId === this.User.Id)!.RoleName} ${Strings[this.Language].of}`;
		ctx.font = "600 28px Inter";
		ctx.fillStyle = "#FFFFFF";
		ctx.textBaseline = "middle";
		ctx.fillText(roleText, margin, ctx.canvas.height / 2);

		ctx.fillStyle = convertHexNumberToString(GangColor[this.Gang.Color].Color);
		ctx.fillText(this.Gang.Name, margin + ctx.measureText(roleText).width + 10, ctx.canvas.height / 2);

		ctx.fillStyle = "#FFFFFF";
		ctx.font = "600 20px Inter";
		ctx.textAlign = "end";
		ctx.fillText(`${Strings[this.Language].level} ${this.Gang.Level}`, ctx.canvas.width - 32, ctx.canvas.height / 2);

		return canvas.encode("webp");
	}
}

export async function testImage() {
	const user = await new User("332228051871989761").GetInfo();
	if (!user) {
		return;
	}
	const gang = await user.GetGang();
	if (!gang) {
		return;
	}

	const image = await new GangImageCanvasBuilder(user, gang, Language.English).GenerateImage();

	fs.writeFile("image.webp", image, (err) => {
		logger.error(err);
	});
}