import { AvatarDecorationList } from "@core/types/AvatarDecorations";
import { AvatarDecorationId } from "@core/types/Ids";
import { Canvas, type CanvasGradient, type Image, loadImage, type SKRSContext2D } from "@napi-rs/canvas";
import { Log } from "@shared/log";
import path from "node:path";

export const AVATAR_CANVAS_SIZE = 512;
export const AVATAR_BORDER_WIDTH = 20;
export const AVATAR_RADIUS = 214;
export const AVATAR_CENTER_X = AVATAR_CANVAS_SIZE / 2;
export const AVATAR_CENTER_Y = AVATAR_CANVAS_SIZE / 2;

const BADGE_MAP: Partial<Record<AvatarDecorationId, string>> = {
	[AvatarDecorationId.Developer]: "Developer.png",
	[AvatarDecorationId.Moderator]: "Moderator.png",
	[AvatarDecorationId.Helper]: "Helper.png",
	[AvatarDecorationId.VIP]: "vip.png",
};

interface SecondaryStyle {
	style: string | ((ctx: SKRSContext2D, x: number, y: number, r: number) => string | CanvasGradient);
	alpha: number;
	lineWidth: number;
	position: number;
}

function createLinearGradient(ctx: SKRSContext2D, colors: string[], angle = 90, x = AVATAR_CENTER_X, y = AVATAR_CENTER_Y, radius = AVATAR_RADIUS) {
	const radian = (angle * Math.PI) / 180;
	const dx = Math.cos(radian) * radius;
	const dy = Math.sin(radian) * radius;
	const gradient = ctx.createLinearGradient(x - dx, y - dy, x + dx, y + dy);

	colors.forEach((color, index) => {
		gradient.addColorStop(index / (colors.length - 1), color);
	});
	return gradient;
}

export class AvatarDecorationRegistry {
	private static patterns = new Map<AvatarDecorationId, Image>();

	static async initialize() {
		Log.Info("Initializing avatar decoration frames...");
		const startTime = Date.now();

		const badgePath = path.join(process.cwd(), "src", "bot", "ui", "assets", "images", "badges");

		for (const decorationId of Object.keys(AvatarDecorationList).map(Number) as AvatarDecorationId[]) {
			const canvas = new Canvas(AVATAR_CANVAS_SIZE, AVATAR_CANVAS_SIZE);
			const ctx = canvas.getContext("2d");

			const style = this.getBorderStyle(ctx, decorationId);
			const secondary = this.getSecondaryStyle(decorationId);

			// 1. Primary Border
			ctx.lineWidth = AVATAR_BORDER_WIDTH;
			ctx.strokeStyle = style;
			ctx.globalAlpha = decorationId === AvatarDecorationId.Default ? 0.25 : 1.0;
			ctx.beginPath();
			ctx.arc(AVATAR_CENTER_X, AVATAR_CENTER_Y, AVATAR_RADIUS, 0, Math.PI * 2);
			ctx.stroke();
			ctx.globalAlpha = 1.0;

			// 2. Secondary Border/Effects
			if (secondary) {
				ctx.save();
				ctx.globalAlpha = secondary.alpha;
				ctx.lineWidth = secondary.lineWidth;
				ctx.strokeStyle = typeof secondary.style === "function"
					? secondary.style(ctx, AVATAR_CENTER_X, AVATAR_CENTER_Y, AVATAR_RADIUS)
					: secondary.style;

				ctx.beginPath();
				ctx.arc(AVATAR_CENTER_X, AVATAR_CENTER_Y, AVATAR_RADIUS - secondary.position, 0, Math.PI * 2);
				ctx.stroke();
				ctx.restore();
			}

			// 3. Premium Highlights
			this.renderPremiumEffects(ctx, decorationId);

			// 4. Badge Loading & Baking
			const badgeFile = BADGE_MAP[decorationId];
			if (badgeFile) {
				try {
					const badgeImg = await loadImage(path.join(badgePath, badgeFile));
					const angle = Math.PI / 2;
					const bx = AVATAR_CENTER_X + AVATAR_RADIUS * Math.cos(angle);
					const by = AVATAR_CENTER_Y + AVATAR_RADIUS * Math.sin(angle);

					ctx.fillStyle = ctx.strokeStyle;
					ctx.beginPath();
					ctx.arc(bx, by, 36, 0, Math.PI * 2);
					ctx.fill();

					ctx.drawImage(badgeImg, bx - 32, by - 32, 64, 64);
				}
				catch (e) {
					Log.Warning(`Failed to load badge ${badgeFile} for avatar decoration ${decorationId}`);
				}
			}

			const buffer = canvas.toBuffer("image/webp");
			const image = await loadImage(buffer);
			this.patterns.set(decorationId, image);
		}

		Log.Info(`Avatar decoration frames initialized in ${Date.now() - startTime}ms`);
	}

	static get(id: AvatarDecorationId): Image {
		return this.patterns.get(id) || this.patterns.get(AvatarDecorationId.Default)!;
	}

	private static getBorderStyle(ctx: SKRSContext2D, id: AvatarDecorationId) {
		switch (id) {
		case AvatarDecorationId.VIP:
			return createLinearGradient(ctx, ["#E0BA20", "#FFA500"], 45);
		case AvatarDecorationId.Developer:
			return "#00B784";
		case AvatarDecorationId.Moderator:
			return "#E43950";
		case AvatarDecorationId.Helper:
			return "#007BFF";
		case AvatarDecorationId.Purple:
			return createLinearGradient(ctx, ["#7345C4", "#3F1EB7"]);
		case AvatarDecorationId.Sunset:
			return createLinearGradient(ctx, ["#FD5949", "#D6249F", "#285AEB"]);
		case AvatarDecorationId.Sunrise:
			return createLinearGradient(ctx, ["#FCB045", "#FD1D1D", "#833AB4"]);
		case AvatarDecorationId.Cloud: {
			const grad = ctx.createRadialGradient(AVATAR_CENTER_X, AVATAR_CENTER_Y, AVATAR_RADIUS - 10, AVATAR_CENTER_X, AVATAR_CENTER_Y, AVATAR_RADIUS + 10);
			grad.addColorStop(0, "#94BBE9");
			grad.addColorStop(1, "#EEAECA");
			return grad;
		}
		case AvatarDecorationId.BotanicalGarden:
			return createLinearGradient(ctx, ["#3E805B", "#AAD47B", "#F9FFA1", "#e66c97", "#ba4fc2"], 30);
		case AvatarDecorationId.FrutigerAero:
			return createLinearGradient(ctx, ["#EDDD53", "#57C785", "#2A7B9B"], 115);
		case AvatarDecorationId.Silver:
			return createLinearGradient(ctx, ["#d9d9d9", "#ADBBC3", "#656C70"], 115);
		case AvatarDecorationId.Rainbow:
			return createLinearGradient(ctx, ["#9C4F96", "#FF6355", "#FBA949", "#FAE442", "#8BD448", "#2AA8F2"], 45);
		case AvatarDecorationId.Cat:
			return "#6A4931";
		default:
			return "#6C6C93";
		}
	}

	private static getSecondaryStyle(id: AvatarDecorationId): SecondaryStyle | null {
		const B = AVATAR_BORDER_WIDTH;
		switch (id) {
		case AvatarDecorationId.FrutigerAero:
			return {
				style: "#EDDD53",
				alpha: 0.25,
				lineWidth: B / 2,
				position: B / 4,
			};
		case AvatarDecorationId.Silver:
			return {
				style: (ctx: SKRSContext2D, x: number, y: number, r: number) => createLinearGradient(ctx, ["#000", "#FFF"], 115, x, y, r),
				alpha: 0.35,
				lineWidth: B / 2,
				position: B / 4,
			};
		default:
			return null;
		}
	}

	private static renderPremiumEffects(ctx: SKRSContext2D, id: AvatarDecorationId) {
		if (id === AvatarDecorationId.Silver) {
			ctx.save();
			for (let i = 0; i < 800; i++) {
				const angle = Math.random() * Math.PI * 2;
				const dist = AVATAR_RADIUS + (Math.random() - 0.5) * AVATAR_BORDER_WIDTH;
				const px = AVATAR_CENTER_X + Math.cos(angle) * dist;
				const py = AVATAR_CENTER_Y + Math.sin(angle) * dist;
				const opacity = Math.random() * 0.3;
				ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
				ctx.fillRect(px, py, 1, 1);
			}
			ctx.restore();
		}

		if (id === AvatarDecorationId.FrutigerAero) {
			ctx.save();
			const shine = ctx.createRadialGradient(AVATAR_CENTER_X - 100, AVATAR_CENTER_Y - 100, 10, AVATAR_CENTER_X, AVATAR_CENTER_Y, AVATAR_RADIUS);
			shine.addColorStop(0, "rgba(255, 255, 255, 0.2)");
			shine.addColorStop(1, "rgba(255, 255, 255, 0)");
			ctx.fillStyle = shine;
			ctx.beginPath();
			ctx.arc(AVATAR_CENTER_X, AVATAR_CENTER_Y, AVATAR_RADIUS + AVATAR_BORDER_WIDTH / 2, 0, Math.PI * 2);
			ctx.fill();
			ctx.restore();
		}
	}
}
