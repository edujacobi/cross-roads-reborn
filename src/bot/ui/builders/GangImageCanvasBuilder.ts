import { convertHexNumberToString, hexToRGB } from "#bot/utils/ui";
import type { Gang } from "#core/models/Gang";
import { Language, type Localization } from "#core/models/Language";
import { User } from "#core/models/User";
import { logger } from "#shared/log";
import { type Canvas, type Image, loadImage, type SKRSContext2D } from "@napi-rs/canvas";
import fs from "node:fs";
import { BaseCanvasBuilder } from "./BaseCanvasBuilder";
import { GangColor } from "#core/types/GangColors";

export const DEFAULT_GANG_IMAGE = "https://i.imgur.com/xOUjOlZ.png";

export class GangImageCanvasBuilder extends BaseCanvasBuilder {
	User: User;
	Gang: Gang;
	IsFullSize: boolean;

	constructor(user: User, gang: Gang, language: Language, isFullSize: boolean = false) {
		const width = 1184;
		const height = isFullSize ? 64 : 32;
		super(width, height, language);
		this.User = user;
		this.Gang = gang;
		this.IsFullSize = isFullSize;
	}

	private static GangImageCache = new Map<string, Image>();

	async GetCanvas(): Promise<Canvas> {
		const ctx = this.Ctx;
		await this.DrawGangInfo(ctx, 0, 0);
		return this.Canvas;
	}

	async DrawGangInfo(ctx: SKRSContext2D, x: number, y: number): Promise<void> {
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
		} as const satisfies Localization;

		let image: Image;
		const imageUrl = this.Gang.Image ?? DEFAULT_GANG_IMAGE;

		const cached = GangImageCanvasBuilder.GangImageCache.get(imageUrl);
		if (cached) {
			image = cached;
		}
		else {
			try {
				image = await loadImage(imageUrl);
				GangImageCanvasBuilder.GangImageCache.set(imageUrl, image);
			}
			catch (error) {
				logger.error(`Error loading gang image. Default image used instead.`, error);
				const defaultCached = GangImageCanvasBuilder.GangImageCache.get(DEFAULT_GANG_IMAGE);
				if (defaultCached) {
					image = defaultCached;
				}
				else {
					image = await loadImage(DEFAULT_GANG_IMAGE);
					GangImageCanvasBuilder.GangImageCache.set(DEFAULT_GANG_IMAGE, image);
				}
			}
		}

		const colorString = convertHexNumberToString(GangColor[this.Gang.Color].Color);
		const color = hexToRGB(colorString);

		if (this.IsFullSize) {
			ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.15)`;
			ctx.beginPath();
			ctx.roundRect(x, y, this.Width, this.Height, 18);
			ctx.fill();
		}

		const radius = 16;
		const imageSize = radius * 2;
		const circleY = y + this.Height / 2;

		if (this.IsFullSize) {
			const padding = 8;
			const circleX = x + padding + radius;

			ctx.beginPath();
			ctx.arc(circleX, circleY, radius, 0, Math.PI * 2);
			ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.5)`;
			ctx.fill();

			ctx.save();
			ctx.clip();
			ctx.drawImage(image, circleX - radius, circleY - radius, imageSize, imageSize);
			ctx.restore();

			ctx.font = "600 20px InterSemiBold";
			ctx.fillStyle = "#E3E3E6";
			ctx.textBaseline = "middle";
			ctx.textAlign = "start";

			const textMargin = circleX + radius + 16;
			const roleText = `${this.Gang.Members.find(member => member.UserId === this.User.Id)!.RoleName} ${Strings[this.Language].of} `;
			ctx.shadowBlur = 8;
			ctx.fillText(roleText, textMargin, circleY);

			const roleWidth = ctx.measureText(roleText).width;
			ctx.fillStyle = colorString;
			ctx.fillText(this.Gang.Name, textMargin + roleWidth, circleY);

			ctx.fillStyle = "#E3E3E6";
			ctx.textAlign = "end";
			ctx.fillText(`${Strings[this.Language].level} ${this.Gang.Level}`, this.Width - 8, circleY);

		}
		else {
			// Compact mode: [Icon] [Text] (Right aligned as a group)
			ctx.font = "600 20px InterSemiBold";
			ctx.textBaseline = "middle";

			const roleName = this.Gang.Members.find(member => member.UserId === this.User.Id)!.RoleName;
			const roleText = `${roleName} ${Strings[this.Language].of} `;
			const textWidth = ctx.measureText(roleText).width + ctx.measureText(this.Gang.Name).width;
			const groupWidth = imageSize + 10 + textWidth;

			const startX = x + this.Width - groupWidth;
			const circleX = startX + radius;

			ctx.beginPath();
			ctx.arc(circleX, circleY, radius, 0, Math.PI * 2);
			ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.15)`;
			ctx.fill();

			ctx.save();
			ctx.clip();
			ctx.drawImage(image, circleX - radius, circleY - radius, imageSize, imageSize);
			ctx.restore();

			const textMargin = startX + imageSize + 10;
			ctx.textAlign = "left";
			ctx.fillStyle = "#E3E3E6";
			ctx.shadowBlur = 8;
			ctx.fillText(roleText, textMargin, circleY);

			ctx.fillStyle = colorString;
			ctx.fillText(this.Gang.Name, textMargin + ctx.measureText(roleText).width, circleY);
		}

		ctx.shadowBlur = 0;
	}
}

export async function testImage() {
	const user = await new User("332228051871989761").GetInfo();
	if (!user) return;
	const gang = await user.GetGang();
	if (!gang) return;
	const image = await new GangImageCanvasBuilder(user, gang, Language.English).GenerateImage();
	fs.writeFile("image.webp", image, (err) => {
		if (err) logger.error(err);
	});
}