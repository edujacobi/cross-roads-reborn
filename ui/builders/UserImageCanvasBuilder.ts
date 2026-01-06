import { User } from "../../models/User";
import { Canvas, Image, loadImage } from "@napi-rs/canvas";
import { logger } from "../../utils/log";
import { DEFAULT_GANG_IMAGE } from "../../utils/ui";
import { ClassList } from "../../interfaces/Classes";
import fs from "node:fs";
import { UserBadge } from "../../models/UserBadge";

export enum Border {
	Default,
	VIP,
	Developer,
	Moderator,
	Helper
}

const BorderColor = {
	[Border.Default]: "#6C6C93",
	[Border.VIP]: "#E0BA20",
	[Border.Developer]: "#00B784",
	[Border.Moderator]: "#E43950",
	[Border.Helper]: "#007BFF",
} as const;

export class UserImageCanvasBuilder {
	User: User;
	AvatarUrl: string;
	Badges: UserBadge[] | null = null;

	constructor(user: User, avatarUrl: string | null) {
		this.User = user;
		this.AvatarUrl = avatarUrl ?? ClassList[this.User.Class].Image.Url;
	}

	SetBadges(badges: UserBadge[]) {
		this.Badges = badges;
		return this;
	}

	async GenerateImage() {
		const CANVAS_SIZE = 512;
		const BORDER_WIDTH = 20;
		const AVATAR_RADIUS = 214; // Radius of the border circle
		const AVATAR_CENTER = { x: 284, y: 228 }; // Center position of the avatar on the canvas - Control padding changing center

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

		if (isDeveloper) {
			imageBadge = await loadImage(`${badgePath}/Developer.png`);
			userCtx.strokeStyle = BorderColor[Border.Developer];
			userCtx.fillStyle = BorderColor[Border.Developer];
		}
		else if (isModerator) {
			imageBadge = await loadImage(`${badgePath}/Moderator.png`);
			userCtx.strokeStyle = BorderColor[Border.Moderator];
			userCtx.fillStyle = BorderColor[Border.Moderator];
		}
		else if (isHelper) {
			imageBadge = await loadImage(`${badgePath}/Helper.png`);
			userCtx.strokeStyle = BorderColor[Border.Helper];
			userCtx.fillStyle = BorderColor[Border.Helper];
		}
		else if (this.User.IsVip()) {
			imageBadge = await loadImage(`${badgePath}/vip.png`);
			userCtx.strokeStyle = BorderColor[Border.VIP];
			userCtx.fillStyle = BorderColor[Border.VIP];
		}
		else {
			userCtx.strokeStyle = BorderColor[Border.Default];
			userCtx.globalAlpha = 0.25;
		}

		// Draw border on the separate canvas
		userCtx.lineWidth = BORDER_WIDTH;
		userCtx.beginPath();
		userCtx.arc(LAYER_CENTER_X, LAYER_CENTER_Y, AVATAR_RADIUS, 0, Math.PI * 2);
		userCtx.closePath();
		userCtx.stroke();
		userCtx.globalAlpha = 1.0; // Reset alpha

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