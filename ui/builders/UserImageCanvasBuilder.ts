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
	[Border.Developer]: "#80E893",
	[Border.Moderator]: "#E43950",
	[Border.Helper]: "#007BFF",
} as const;

export class UserImageCanvasBuilder {
	User: User;
	AvatarUrl: string;
	Badges: UserBadge[] | null = null;

	// Border: Border;

	constructor(user: User, avatarUrl: string | null) {
		this.User = user;
		this.AvatarUrl = avatarUrl ?? ClassList[this.User.Class].Image.Url;
	}

	SetBadges(badges: UserBadge[]) {
		this.Badges = badges;
		return this;
	}

	async GenerateImage() {
		const canvasSize = 512;
		const padding = 64;
		const imageSize = canvasSize - padding * 2;

		const canvas = new Canvas(canvasSize, canvasSize);
		const ctx = canvas.getContext("2d");
		let image: Image;

		try {
			image = await loadImage(this.AvatarUrl);
		}
		catch (error) {
			logger.error(`Error loading user image. Default image used instead.`, error);
			image = await loadImage(DEFAULT_GANG_IMAGE);
		}

		const borderWidth = 20;
		const radius = (canvasSize - borderWidth - padding) / 2; // Radius for the circle, accounting for border thickness
		const centerX = canvasSize - radius - (borderWidth / 2) - 4;
		const centerY = radius + (borderWidth / 2);

		// Cut the image 100% round, centered in X and at the top in Y
		ctx.save();
		ctx.beginPath();
		ctx.arc(centerX, centerY, radius - borderWidth / 2, 0, Math.PI * 2);
		ctx.closePath();
		ctx.clip();

		// Draw the image
		ctx.drawImage(
			image,
			canvasSize - imageSize + borderWidth - padding - 4,
			canvasSize - imageSize + borderWidth - (padding * 2),
			imageSize + borderWidth + 4,
			imageSize + borderWidth + 4,
		);
		ctx.restore();

		// ctx.drawImage(
		// 	image,
		// 	canvasSize - imageSize + (borderWidth / 2) - padding,
		// 	canvasSize - imageSize + (borderWidth / 2) - (padding * 2),
		// 	imageSize + (borderWidth * 2),
		// 	imageSize + (borderWidth * 2),
		// );

		const isDeveloper = await UserBadge.IsDeveloper(this.User.Id);
		const isModerator = await UserBadge.IsModerator(this.User.Id);
		const isHelper = await UserBadge.IsHelper(this.User.Id);

		let imageBadge: Image | null = null;
		const badgePosition = {
			x: canvasSize - imageSize / 2 - padding / 2,
			y: canvasSize - padding - borderWidth / 2,
		};

		if (isDeveloper) {
			imageBadge = await loadImage("ui/assets/images/badges/Developer.png");
			ctx.strokeStyle = BorderColor[Border.Developer];
			ctx.fillStyle = BorderColor[Border.Developer];
		}
		else if (isModerator) {
			imageBadge = await loadImage("ui/assets/images/badges/Moderator.png");
			ctx.strokeStyle = BorderColor[Border.Moderator];
			ctx.fillStyle = BorderColor[Border.Moderator];
		}
		else if (isHelper) {
			imageBadge = await loadImage("ui/assets/images/badges/Helper.png");
			ctx.strokeStyle = BorderColor[Border.Helper];
			ctx.fillStyle = BorderColor[Border.Helper];
		}
		else if (this.User.IsVip()) {
			imageBadge = await loadImage("ui/assets/images/badges/vip.png");
			ctx.strokeStyle = BorderColor[Border.VIP];
			ctx.fillStyle = BorderColor[Border.VIP];
		}
		else {
			ctx.strokeStyle = BorderColor[Border.Default];
			ctx.globalAlpha = 0.25;
		}

		drawBorder();
		if (imageBadge) {
			drawBadgeCircle();
			ctx.drawImage(imageBadge, badgePosition.x - 32, badgePosition.y - 32, 64, 64);
		}

		function drawBorder() {
			ctx.lineWidth = borderWidth;
			ctx.beginPath(); // Start a new path for the border
			// ctx.globalAlpha = 0.5;
			ctx.arc(centerX, centerY, radius, 0, Math.PI * 2); // Draw the border circle
			ctx.closePath(); // Close the path
			ctx.stroke(); // Apply the stroke
		}

		function drawBadgeCircle() {
			ctx.beginPath();
			ctx.arc(badgePosition.x, badgePosition.y, 36, 0, Math.PI * 2);
			ctx.closePath();
			ctx.fill();
		}

		return canvas.encode("webp");
	}
}

export async function testImage() {
	const user = await new User("332228051871989761").GetInfo();
	if (!user) {
		return;
	}

	const image = await new UserImageCanvasBuilder(user, "https://images-ext-1.discordapp.net/external/FWpt2F_F1LT_wI2IGrL9jyaoc2PwevntyecOzQG6Rbo/https/cdn.discordapp.com/avatars/332228051871989761/1899a95dfb279741a828a87aa47fef93.webp?format=webp").GenerateImage();

	fs.writeFile("image.webp", image, (err) => {
		logger.error(err);
	});
}