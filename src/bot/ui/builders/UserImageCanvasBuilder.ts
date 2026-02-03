import { User } from "@core/models/User";
import { Canvas, CanvasGradient, Image, loadImage, SKRSContext2D } from "@napi-rs/canvas";
import { logger } from "@shared/log";
import { ClassList } from "@core/types/Classes";
import fs from "node:fs";
import { UserBadge } from "@core/models/UserBadge";
import { AvatarDecorationId } from "@core/types/Ids";
import { DEFAULT_GANG_IMAGE } from "./GangImageCanvasBuilder";

function createLinearGradient(colors: string[], angle = 90) {
	return (ctx: SKRSContext2D, x: number, y: number, radius: number) => {
		// Convert angle to radians
		const radian = (angle * Math.PI) / 180;

		// Calculate start and end points based on the angle
		// 0deg: Left -> Right
		// 90deg: Top -> Bottom
		const dx = Math.cos(radian) * radius;
		const dy = Math.sin(radian) * radius;

		const gradient = ctx.createLinearGradient(x - dx, y - dy, x + dx, y + dy);

		if (colors.length < 2) {
			return colors[0] ?? BorderStyles[AvatarDecorationId.Default];
		}

		colors.forEach((color, index) => {
			gradient.addColorStop(index / (colors.length - 1), color);
		});

		return gradient;
	};
}

function createRadialGradient(colors: string[]) {
	return (ctx: SKRSContext2D, x: number, y: number, radius: number) => {
		const gradient = ctx.createRadialGradient(x, y, radius - 10, x, y, radius + 10);

		if (colors.length < 2) {
			return colors[0] ?? BorderStyles[AvatarDecorationId.Default];
		}

		colors.forEach((color, index) => {
			gradient.addColorStop(index / (colors.length - 1), color);
		});

		return gradient;
	};
}

const CANVAS_SIZE = 512;
const BORDER_WIDTH = 20;
const AVATAR_RADIUS = 214; // Radius of the border circle
const AVATAR_CENTER = { x: 284, y: 228 }; // Center position of the avatar on the canvas - Control padding changing center

// Type definition for border styles which can be a solid color string or a function returning a gradient
type BorderStyle = string | ((ctx: SKRSContext2D, x: number, y: number, radius: number) => string | CanvasGradient);

const BorderStyles: Record<AvatarDecorationId, BorderStyle> = {
	[AvatarDecorationId.Default]: "#6C6C93",
	[AvatarDecorationId.VIP]: createLinearGradient(["#E0BA20", "#FFA500"], 45),
	[AvatarDecorationId.Developer]: "#00B784",
	[AvatarDecorationId.Moderator]: "#E43950",
	[AvatarDecorationId.Helper]: "#007BFF",
	// 1000
	[AvatarDecorationId.Purple]: createLinearGradient(["#7345C4", "#3F1EB7"]),
	[AvatarDecorationId.Sunset]: createLinearGradient(["#FD5949", "#D6249F", "#285AEB"]),
	[AvatarDecorationId.Sunrise]: createLinearGradient(["#FCB045", "#FD1D1D", "#833AB4"]),
	[AvatarDecorationId.Cloud]: createRadialGradient(["#94BBE9", "#EEAECA"]),
	[AvatarDecorationId.BotanicalGarden]: createLinearGradient(["#3E805B", "#AAD47B", "#F9FFA1", "#e66c97", "#ba4fc2"], 30),
	// 1500
	[AvatarDecorationId.FrutigerAero]: createLinearGradient(["#EDDD53", "#57C785", "#2A7B9B"], 115),
	[AvatarDecorationId.Silver]: createLinearGradient(["#d9d9d9", "#ADBBC3", "#656C70"], 115),
	[AvatarDecorationId.Rainbow]: createLinearGradient(["#9C4F96", "#FF6355", "#FBA949", "#FAE442", "#8BD448", "#2AA8F2"], 45),
	[AvatarDecorationId.Cat]: "#6A4931",
};

interface SecondaryBorderDef {
	style: BorderStyle;
	alpha: number;
	lineWidth: number;
	position: number;
}

const SecondaryBorderStyles: Partial<Record<AvatarDecorationId, SecondaryBorderDef>> = {
	[AvatarDecorationId.FrutigerAero]: {
		style: "#EDDD53",
		alpha: 0.25,
		lineWidth: BORDER_WIDTH / 2,
		position: BORDER_WIDTH / 4,
	},
	[AvatarDecorationId.Silver]: {
		style: createLinearGradient(["#000", "#FFF"], 115),
		alpha: 0.35,
		lineWidth: BORDER_WIDTH / 2,
		position: BORDER_WIDTH / 4,
	},
};

// Cache for badge images
const badgeImageCache: Map<string, Image> = new Map();

export class UserImageCanvasBuilder {
	User: User;
	AvatarUrl: string;
	Badges: UserBadge[] | null = null;
	Decoration: AvatarDecorationId = AvatarDecorationId.Default;

	constructor(user: User, avatarUrl: string | null) {
		this.User = user;
		this.AvatarUrl = avatarUrl ?? ClassList[this.User.Class].Image.Url;
	}

	SetDecoration(decoration: AvatarDecorationId) {
		this.Decoration = decoration;
		if (decoration === AvatarDecorationId.VIP && !this.User.IsVip()) {
			this.Decoration = AvatarDecorationId.Default;
		}
		return this;
	}

	SetBadges(badges: UserBadge[]) {
		this.Badges = badges;
		return this;
	}

	async GenerateImage() {
		// General canvas
		const canvas = new Canvas(CANVAS_SIZE, CANVAS_SIZE);
		const ctx = canvas.getContext("2d");

		// Create a separate canvas for the user image and border (Layer)
		const userCanvas = new Canvas(CANVAS_SIZE, CANVAS_SIZE);
		const userCtx = userCanvas.getContext("2d");

		let image: Image;

		try {
			image = await loadImage(this.AvatarUrl);
		}
		catch (error) {
			logger.error(`Error loading user image. Default image used instead.`, error);
			image = await loadImage(DEFAULT_GANG_IMAGE);
		}

		// We draw on the center of the layer (userCanvas)
		const LAYER_CENTER_X = CANVAS_SIZE / 2;
		const LAYER_CENTER_Y = CANVAS_SIZE / 2;

		// Calculate image size based on radius to ensure it covers the clip area
		// Clip radius is (AVATAR_RADIUS - BORDER_WIDTH / 2)
		// We multiply by 2 for diameter and add a small buffer (+4)
		const imageDrawSize = (AVATAR_RADIUS - BORDER_WIDTH / 2) * 2 + 4;

		// Draw the user image on the separate canvas
		userCtx.save();
		userCtx.beginPath();
		userCtx.arc(LAYER_CENTER_X, LAYER_CENTER_Y, AVATAR_RADIUS - BORDER_WIDTH / 2, 0, Math.PI * 2);
		userCtx.closePath();
		userCtx.clip();

		userCtx.drawImage(
			image,
			LAYER_CENTER_X - imageDrawSize / 2,
			LAYER_CENTER_Y - imageDrawSize / 2,
			imageDrawSize,
			imageDrawSize,
		);
		userCtx.restore();

		let imageBadge: Image | null = null;
		const badgePath = "ui/assets/images/badges";

		const borderStyle = BorderStyles[this.Decoration];

		const badgeMap: Partial<Record<AvatarDecorationId, string>> = {
			[AvatarDecorationId.Developer]: "Developer.png",
			[AvatarDecorationId.Moderator]: "Moderator.png",
			[AvatarDecorationId.Helper]: "Helper.png",
			[AvatarDecorationId.VIP]: "vip.png",
		};

		const badgeImageName = badgeMap[this.Decoration] ?? null;

		// Resolve the style (string or gradient)
		const currentStyle = typeof borderStyle === "function"
			? borderStyle(userCtx, LAYER_CENTER_X, LAYER_CENTER_Y, AVATAR_RADIUS)
			: borderStyle;

		userCtx.strokeStyle = currentStyle;
		userCtx.fillStyle = currentStyle;

		if (badgeImageName) {
			const badgeFullPath = `${badgePath}/${badgeImageName}`;
			if (badgeImageCache.has(badgeFullPath)) {
				imageBadge = badgeImageCache.get(badgeFullPath)!;
			}
			else {
				try {
					imageBadge = await loadImage(badgeFullPath);
					badgeImageCache.set(badgeFullPath, imageBadge);
				}
				catch (error) {
					logger.error(`Error loading badge image: ${badgeFullPath}`, error);
				}
			}
		}
		else if (this.Decoration) {
			// Full opacity if Border is defined
			userCtx.globalAlpha = 1;
		}
		else {
			// Default border transparency
			userCtx.globalAlpha = 0.25;
		}

		// Draw border on the separate canvas
		userCtx.lineWidth = BORDER_WIDTH;
		userCtx.beginPath();
		userCtx.arc(LAYER_CENTER_X, LAYER_CENTER_Y, AVATAR_RADIUS, 0, Math.PI * 2);
		userCtx.closePath();
		userCtx.stroke();
		userCtx.globalAlpha = 1.0; // Reset alpha

		// Secondary Border
		if (this.Decoration && this.Decoration in SecondaryBorderStyles) {
			const config = SecondaryBorderStyles[this.Decoration];
			if (config) {
				const currentSecondaryStyle = typeof config.style === "function"
					? config.style(userCtx, LAYER_CENTER_X, LAYER_CENTER_Y, AVATAR_RADIUS)
					: config.style;

				userCtx.strokeStyle = currentSecondaryStyle;
				userCtx.globalAlpha = config.alpha;

				userCtx.lineWidth = config.lineWidth;
				userCtx.beginPath();
				userCtx.arc(LAYER_CENTER_X, LAYER_CENTER_Y, AVATAR_RADIUS - config.position, 0, Math.PI * 2);
				userCtx.closePath();
				userCtx.stroke();
				userCtx.globalAlpha = 1.0; // Reset alpha
			}
		}

		// Special case - Cat Ears
		if (this.Decoration == AvatarDecorationId.Cat) {
			// load image of cat
		}

		// Draw badge circle and image on the separate canvas
		if (imageBadge) {
			userCtx.beginPath();

			// Badge position at the bottom center of the circle border
			const angle = Math.PI / 2; // 90 degrees
			const badgeCenterX = LAYER_CENTER_X + AVATAR_RADIUS * Math.cos(angle);
			const badgeCenterY = LAYER_CENTER_Y + AVATAR_RADIUS * Math.sin(angle);

			userCtx.arc(badgeCenterX, badgeCenterY, 36, 0, Math.PI * 2);
			userCtx.closePath();
			userCtx.fill();
			userCtx.drawImage(imageBadge, badgeCenterX - 32, badgeCenterY - 32, 64, 64);
		}

		// Draw the user canvas onto the main canvas with repositioning
		const offsetX = AVATAR_CENTER.x - LAYER_CENTER_X;
		const offsetY = AVATAR_CENTER.y - LAYER_CENTER_Y;

		ctx.drawImage(userCanvas, offsetX, offsetY);

		return canvas.encode("webp");
	}
}

export async function testImage() {
	const user = await new User("332228051871989761").GetInfo();
	if (!user) {
		return;
	}

	const image = await new UserImageCanvasBuilder(
		user,
		"https://64.media.tumblr.com/e4c4d8cb95b53cb810d7d0cadf1a5fa1/e4a5be77d55d027d-fe/s1280x1920/874f014800947f2327825bc8ba35026e703bf033.jpg",
	)
		.SetDecoration(AvatarDecorationId.BotanicalGarden)
		.GenerateImage();

	fs.writeFile("image.webp", image, (err) => {
		logger.error(err);
	});
}