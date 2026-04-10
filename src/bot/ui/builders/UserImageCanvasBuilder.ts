import { User } from "@core/models/User";
import { Canvas, type Image, loadImage } from "@napi-rs/canvas";
import {
	AVATAR_BORDER_WIDTH,
	AVATAR_CANVAS_SIZE,
	AVATAR_RADIUS,
	AvatarDecorationRegistry,
} from "../patterns/AvatarDecorationRegistry";
import { logger } from "@shared/log";
import { ClassList } from "@core/types/Classes";
import fs from "node:fs";
import type { UserBadge } from "@core/models/UserBadge";
import { AvatarDecorationId } from "@core/types/Ids";
import { DEFAULT_GANG_IMAGE } from "./GangImageCanvasBuilder";

const AVATAR_CENTER = { x: 284, y: 228 }; // Center position of the avatar on the canvas - Control padding changing center

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
		const canvas = new Canvas(AVATAR_CANVAS_SIZE, AVATAR_CANVAS_SIZE);
		const ctx = canvas.getContext("2d");

		const userCanvas = new Canvas(AVATAR_CANVAS_SIZE, AVATAR_CANVAS_SIZE);
		const userCtx = userCanvas.getContext("2d");

		const LAYER_CENTER_X = AVATAR_CANVAS_SIZE / 2;
		const LAYER_CENTER_Y = AVATAR_CANVAS_SIZE / 2;

		let image: Image;

		try {
			image = await loadImage(this.AvatarUrl);
		}
		catch (error) {
			logger.error(`Error loading user image. Default image used instead.`, error);
			image = await loadImage(DEFAULT_GANG_IMAGE);
		}

		// Calculate image size based on radius to ensure it covers the clip area
		// Clip radius is (AVATAR_RADIUS - BORDER_WIDTH / 2)
		// We multiply by 2 for diameter and add a small buffer (+4)
		const imageDrawSize = (AVATAR_RADIUS - AVATAR_BORDER_WIDTH / 2) * 2 + 4;

		// Draw the user image on the separate canvas
		userCtx.save();
		userCtx.beginPath();
		userCtx.arc(LAYER_CENTER_X, LAYER_CENTER_Y, AVATAR_RADIUS - AVATAR_BORDER_WIDTH / 2, 0, Math.PI * 2);
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

		// Draw the frame from the registry
		const frame = AvatarDecorationRegistry.get(this.Decoration);
		userCtx.drawImage(frame, 0, 0, AVATAR_CANVAS_SIZE, AVATAR_CANVAS_SIZE);

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