import { User } from "../../models/User";
import { Canvas, CanvasGradient, Image, loadImage, SKRSContext2D } from "@napi-rs/canvas";
import { logger } from "../../utils/log";
import { DEFAULT_GANG_IMAGE } from "../../utils/ui";
import { ClassList } from "../../interfaces/Classes";
import fs from "node:fs";
import { UserBadge } from "../../models/UserBadge";

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
			return colors[0] ?? BorderStyles[Border.Default];
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
			return colors[0] ?? BorderStyles[Border.Default];
		}

		colors.forEach((color, index) => {
			gradient.addColorStop(index / (colors.length - 1), color);
		});

		return gradient;
	};
}

export enum Border {
	Default,
	VIP,
	Developer,
	Moderator,
	Helper,
	Purple,
	Sunset,
	Sunrise,
	Cloud,
	FrutigerAero,
	Silver,
	Cat,
}

const CANVAS_SIZE = 512;
const BORDER_WIDTH = 20;
const AVATAR_RADIUS = 214; // Radius of the border circle
const AVATAR_CENTER = { x: 284, y: 228 }; // Center position of the avatar on the canvas - Control padding changing center

// Type definition for border styles which can be a solid color string or a function returning a gradient
type BorderStyle = string | ((ctx: SKRSContext2D, x: number, y: number, radius: number) => string | CanvasGradient);

const BorderStyles: Record<Border, BorderStyle> = {
	[Border.Default]: "#6C6C93",
	[Border.VIP]: createLinearGradient(["#E0BA20", "#FFA500"], 45),
	[Border.Developer]: "#00B784",
	[Border.Moderator]: "#E43950",
	[Border.Helper]: "#007BFF",
	[Border.Purple]: createLinearGradient(["#7345C4", "#3F1EB7"]),
	[Border.Sunset]: createLinearGradient(["#FD5949", "#D6249F", "#285AEB"]),
	[Border.Sunrise]: createLinearGradient(["#FCB045", "#FD1D1D", "#833AB4"]),
	[Border.Cloud]: createRadialGradient(["#94BBE9", "#EEAECA"]),
	[Border.FrutigerAero]: createLinearGradient(["#EDDD53", "#57C785", "#2A7B9B"], 115),
	[Border.Silver]: createLinearGradient(["#d9d9d9", "#ADBBC3", "#656C70"], 115),
	[Border.Cat]: "#6A4931",
};

interface SecondaryBorderDef {
	style: BorderStyle;
	alpha: number;
	lineWidth: number;
	position: number;
}

const SecondaryBorderStyles: Partial<Record<Border, SecondaryBorderDef>> = {
	[Border.FrutigerAero]: {
		style: "#EDDD53",
		alpha: 0.25,
		lineWidth: BORDER_WIDTH / 2,
		position: BORDER_WIDTH / 4,
	},
	[Border.Silver]: {
		style: createLinearGradient(["#000", "#FFF"], 115),
		alpha: 0.35,
		lineWidth: BORDER_WIDTH / 2,
		position: BORDER_WIDTH / 4,
	},
};

export class UserImageCanvasBuilder {
	User: User;
	AvatarUrl: string;
	Badges: UserBadge[] | null = null;
	Border: Border | null = null;

	constructor(user: User, avatarUrl: string | null) {
		this.User = user;
		this.AvatarUrl = avatarUrl ?? ClassList[this.User.Class].Image.Url;

		// debug
		this.Border = Border.Cat;
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

		const [isDeveloper, isModerator, isHelper] = await Promise.all([
			UserBadge.IsDeveloper(this.User.Id),
			UserBadge.IsModerator(this.User.Id),
			UserBadge.IsHelper(this.User.Id),
		]);

		let imageBadge: Image | null = null;
		const badgePath = "ui/assets/images/badges";

		let borderStyle: BorderStyle = BorderStyles[Border.Default];
		let badgeImageName: string | null = null;

		if (this.Border) {
			borderStyle = BorderStyles[this.Border];
		}
		else if (isDeveloper) {
			borderStyle = BorderStyles[Border.Developer];
			badgeImageName = "Developer.png";
		}
		else if (isModerator) {
			borderStyle = BorderStyles[Border.Moderator];
			badgeImageName = "Moderator.png";
		}
		else if (isHelper) {
			borderStyle = BorderStyles[Border.Helper];
			badgeImageName = "Helper.png";
		}
		else if (this.User.IsVip()) {
			borderStyle = BorderStyles[Border.VIP];
			badgeImageName = "vip.png";
		}

		// Resolve the style (string or gradient)
		const currentStyle = typeof borderStyle === "function"
			? borderStyle(userCtx, LAYER_CENTER_X, LAYER_CENTER_Y, AVATAR_RADIUS)
			: borderStyle;

		userCtx.strokeStyle = currentStyle;
		userCtx.fillStyle = currentStyle;

		if (badgeImageName) {
			imageBadge = await loadImage(`${badgePath}/${badgeImageName}`);
		}
		else if (this.Border) {
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
		if (this.Border && this.Border in SecondaryBorderStyles) {
			const config = SecondaryBorderStyles[this.Border];
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
		if (this.Border == Border.Cat) {
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

	const image = await new UserImageCanvasBuilder(user, "https://64.media.tumblr.com/e4c4d8cb95b53cb810d7d0cadf1a5fa1/e4a5be77d55d027d-fe/s1280x1920/874f014800947f2327825bc8ba35026e703bf033.jpg").GenerateImage();

	fs.writeFile("image.webp", image, (err) => {
		logger.error(err);
	});
}