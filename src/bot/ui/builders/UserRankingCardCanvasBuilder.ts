import { GangColor } from "#bot/utils/colors";
import { Gang } from "#core/models/Gang";
import { Language } from "#core/models/Language";
import type { User } from "#core/models/User";
import { type AvatarDecorationId, BackgroundDecorationId } from "#core/types/Ids";
import { type Canvas, type Image, loadImage } from "@napi-rs/canvas";
import {
	BackgroundPatternRegistry,
	CARD_AVATAR_SIZE,
	CARD_HEIGHT,
	CARD_WIDTH,
} from "../patterns/BackgroundPatternRegistry";
import { BaseCanvasBuilder } from "./BaseCanvasBuilder";
import { UserImageCanvasBuilder } from "./UserImageCanvasBuilder";

interface CachedDecoratedAvatar {
	image: Image;
	avatarDecorationId: AvatarDecorationId;
	backgroundDecorationId: BackgroundDecorationId;
	timestamp: number;
}

const DECORATED_CACHE = new Map<string, CachedDecoratedAvatar>();

const TTL_AVATAR = 60 * 60 * 1_000; // 1 hour in ms

export class UserRankingCardCanvasBuilder extends BaseCanvasBuilder {
	User: User;
	Rank: number;
	Value: string;
	AvatarUrl: string | null;
	Decoration: BackgroundDecorationId = BackgroundDecorationId.Default;

	constructor(user: User, rank: number, value: string, avatarUrl: string | null, language: Language = Language.English) {
		super(CARD_WIDTH, CARD_HEIGHT, language);
		this.User = user;
		this.Rank = rank;
		this.Value = value;
		this.AvatarUrl = avatarUrl;
	}

	private async GetDecoratedAvatar(): Promise<Image> {
		const userId = this.User.Id;
		const avatarDecorationId = this.User.AvatarDecoration.Id;
		const backgroundDecorationId = this.User.BackgroundDecoration.Id;
		const now = Date.now();

		const cached = DECORATED_CACHE.get(userId);

		// Cache Logic:
		// 1. Invalidate if any decoration changed
		// 2. Invalidate if TTL (1 hour) expired to catch discord avatar changes
		if (
			cached &&
			cached.avatarDecorationId === avatarDecorationId &&
			cached.backgroundDecorationId === backgroundDecorationId &&
			(now - cached.timestamp) < TTL_AVATAR
		) {
			return cached.image;
		}

		// Generate new decorated avatar
		const builder = new UserImageCanvasBuilder(this.User, this.AvatarUrl);
		builder.SetDecoration(avatarDecorationId);

		// Note: UserImageCanvasBuilder.GenerateImage() returns a Buffer (encoded webp)
		const buffer = await builder.GenerateImage();
		const image = await loadImage(buffer);

		// Store in cache
		DECORATED_CACHE.set(userId, {
			image,
			avatarDecorationId,
			backgroundDecorationId,
			timestamp: now,
		});

		return image;
	}

	SetDecoration(decoration: BackgroundDecorationId) {
		this.Decoration = decoration;
		return this;
	}

	async GetCanvas(): Promise<Canvas> {
		const ctx = this.Ctx;

		const radius = CARD_HEIGHT / 2;
		let gangName = "";
		let gangRgb = { r: 255, g: 255, b: 255 };

		// 0. Pill Shape Background
		ctx.beginPath();
		ctx.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, radius);
		ctx.save();
		ctx.clip();

		const bgId = this.Decoration;
		// Background Rendering
		const pattern = BackgroundPatternRegistry.get(bgId);
		ctx.drawImage(pattern, 0, 0, CARD_WIDTH, CARD_HEIGHT);

		// Always fetch gang info if available for the name and fallback color
		if (this.User.GangId) {
			const gang = await Gang.GetBasicById(this.User.GangId);
			if (gang) {
				const gangColorHex = GangColor[gang.Color].Color;
				gangRgb = {
					r: (gangColorHex >> 16) & 255,
					g: (gangColorHex >> 8) & 255,
					b: gangColorHex & 255,
				};
				// Use solid gang color if there's no special decoration background
				if (bgId === BackgroundDecorationId.Default) {
					ctx.fillStyle = `rgba(${gangRgb.r}, ${gangRgb.g}, ${gangRgb.b}, 0.1)`;
					ctx.fill();
				}
				gangName = gang.Name;
			}
		}

		ctx.restore();

		// 1. Draw Text Info (Left Side)
		const textLeft = radius - 10; // Adjusted to be inside the curved part but closer to the edge
		const valueY = (CARD_HEIGHT / 2);

		// 2. Get Avatar Info (Required for text width limits)
		const avatarX = CARD_WIDTH - CARD_AVATAR_SIZE - 17; // Pull slightly away from the rounded edge
		const maxWidth = avatarX - textLeft - 20; // 20px padding from the avatar

		// Rank Number  - Center Left
		ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
		ctx.font = "32px InterSemiBold";
		ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
		ctx.shadowBlur = 8;
		ctx.fillText(`${this.Rank}.`, 17, valueY + 8);

		// Value - Large Center (Auto-scaled)
		ctx.fillStyle = "#FFFFFF";
		let valueFontSize = 54;
		ctx.font = `${valueFontSize}px InterBold`;

		while (ctx.measureText(this.Value).width > maxWidth && valueFontSize > 20) {
			valueFontSize -= 2;
			ctx.font = `${valueFontSize}px InterBold`;
		}

		ctx.fillText(this.Value, textLeft, valueY - 2);

		// Nickname & Gang Line - Small Bottom (Auto-scaled)
		const fullNicknameLine = gangName ? `${this.User.Nickname} • ${gangName}` : this.User.Nickname;
		let nickFontSize = 36;
		ctx.font = `${nickFontSize}px InterBold`;

		while (ctx.measureText(fullNicknameLine).width > maxWidth && nickFontSize > 15) {
			nickFontSize -= 2;
			ctx.font = `${nickFontSize}px InterBold`;
		}

		// Draw Nickname
		ctx.fillStyle = "#E1E1E4";
		ctx.font = `${nickFontSize}px InterBold`;
		ctx.fillText(this.User.Nickname, textLeft, valueY + 43);

		// Draw Gang Name (Next to Nickname)
		if (gangName) {
			const nameWidth = ctx.measureText(this.User.Nickname).width;
			// Tinted white: 70% white, 30% gang color
			const tr = Math.floor(255 * 0.7 + gangRgb.r * 0.3);
			const tg = Math.floor(255 * 0.7 + gangRgb.g * 0.3);
			const tb = Math.floor(255 * 0.7 + gangRgb.b * 0.3);
			ctx.fillStyle = `rgb(${tr}, ${tg}, ${tb})`;

			// Maintain a slightly smaller font size for gang name relative to nickname
			const gangFontSize = Math.max(nickFontSize - 8, 12);
			ctx.font = `${gangFontSize}px InterBold`;
			ctx.fillText(` • ${gangName}`, textLeft + nameWidth + 4, valueY + 41);
		}
		ctx.shadowBlur = 0;

		// 3. Draw Avatar (Right Side, Center Aligned Vertically)
		const decoratedAvatar = await this.GetDecoratedAvatar();
		const avatarY = (CARD_HEIGHT - CARD_AVATAR_SIZE) / 2 + 7; // Perfectly centered vertically
		ctx.drawImage(decoratedAvatar, avatarX, avatarY, CARD_AVATAR_SIZE, CARD_AVATAR_SIZE);

		return this.Canvas;
	}
}

