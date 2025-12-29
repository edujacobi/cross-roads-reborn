import { User } from "../../models/User";
import { Canvas, Image, loadImage } from "@napi-rs/canvas";
import { logger } from "../../utils/log";
import { createUserGangImage, DEFAULT_GANG_IMAGE } from "../../utils/ui";
import { ClassList } from "../../interfaces/Classes";
import { Language } from "../../models/Language";
import fs from "node:fs";
import { UserBadge } from "../../models/UserBadge";
import userBadges, { UserBadges } from "../../database/UserBadges";

export enum Border {
	Default,
	VIP,
	Developer,
	Moderator,
}

const BorderColor = {
	[Border.Default]: null,
	[Border.VIP]: "#F1C40F",
	[Border.Developer]: "#80E893",
	[Border.Moderator]: "#E43950",
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

		const borderWidth = padding / 2;
		const radius = (canvasSize / 2) - (borderWidth / 2) - (padding / 2); // Radius for the circle, accounting for border thickness
		const centerX = canvasSize / 2;
		const centerY = canvasSize / 2;

		// Cut the image 100% round
		ctx.beginPath();
		ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
		ctx.closePath();
		ctx.clip();

		// Draw the image
		ctx.drawImage(image, padding, padding, imageSize, imageSize);

		const isDeveloper = await UserBadge.IsDeveloper(this.User.Id);
		const isModerator = await UserBadge.IsModerator(this.User.Id);

		if (isDeveloper) {
			ctx.strokeStyle = BorderColor[Border.Developer];
			drawBorder();
		}
		else if (isModerator) {
			ctx.strokeStyle = BorderColor[Border.Moderator];
			drawBorder();
		}
		else if (this.User.IsVip()) {
			ctx.strokeStyle = BorderColor[Border.VIP];
			drawBorder();
		}

		function drawBorder() {
			ctx.lineWidth = borderWidth;
			ctx.beginPath(); // Start a new path for the border
			ctx.arc(centerX, centerY, radius, 0, Math.PI * 2); // Draw the border circle
			ctx.closePath(); // Close the path
			ctx.stroke(); // Apply the stroke
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