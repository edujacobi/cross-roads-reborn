import { getBackgroundDecorationList } from "#core/types/BackgroundDecorations";
import { BackgroundDecorationId } from "#core/types/Ids";
import { Canvas, type Image, loadImage, type SKRSContext2D } from "@napi-rs/canvas";
import { Log } from "#shared/log";

export const CARD_WIDTH = 1_200;
export const CARD_HEIGHT = 150;
export const CARD_BACKGROUND_OPACITY = 0.35;
export const CARD_AVATAR_SIZE = 130;

const BG_COLORS: Record<BackgroundDecorationId, string[]> = {
	[BackgroundDecorationId.Purple]: ["#7345C4", "#3F1EB7"],
	[BackgroundDecorationId.Sunset]: ["#FD5949", "#D6249F", "#285AEB"],
	[BackgroundDecorationId.Sunrise]: ["#FCB045", "#FD1D1D", "#833AB4"],
	[BackgroundDecorationId.Cloud]: ["#94BBE9", "#EEAECA"],
	[BackgroundDecorationId.BotanicalGarden]: ["#3E805B", "#AAD47B", "#F9FFA1", "#e66c97", "#ba4fc2"],
	[BackgroundDecorationId.Silver]: ["#d9d9d9", "#ADBBC3", "#656C70"],
	[BackgroundDecorationId.Rainbow]: ["#9C4F96", "#FF6355", "#FBA949", "#FAE442", "#8BD448", "#2AA8F2"],
	[BackgroundDecorationId.FrutigerAero]: ["#edb753ff", "#EDDD53", "#57C785", "#15a7e0ff", "#15a7e0ff"],
	[BackgroundDecorationId.Default]: ["#6C6C93"],
};

const BG_ANGLES: Partial<Record<BackgroundDecorationId, number>> = {
	[BackgroundDecorationId.Rainbow]: 0,
	[BackgroundDecorationId.FrutigerAero]: 10,
};

/**
 * Local Gradient Helper for Registry
 */
function createLinearGradient(ctx: SKRSContext2D, colors: string[], angle = 45, y = 0, height = CARD_HEIGHT) {
	if (colors.length < 2) return colors[0] ?? "#6C6C93";

	const width = CARD_WIDTH;
	const centerX = width / 2;
	const centerY = y + height / 2;
	const radius = Math.sqrt(width ** 2 + height ** 2) / 2;

	const radian = (angle * Math.PI) / 180;
	const x0 = centerX - radius * Math.cos(radian);
	const y0 = centerY - radius * Math.sin(radian);
	const x1 = centerX + radius * Math.cos(radian);
	const y1 = centerY + radius * Math.sin(radian);

	const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
	colors.forEach((color, index) => {
		gradient.addColorStop(index / (colors.length - 1), color);
	});

	return gradient;
}

export class BackgroundPatternRegistry {
	private static patterns = new Map<BackgroundDecorationId, Image>();

	static async initialize() {
		Log.Info("Initializing ranking card background patterns...");
		const startTime = Date.now();

		for (const bg of getBackgroundDecorationList()) {
			const canvas = new Canvas(CARD_WIDTH, CARD_HEIGHT);
			const ctx = canvas.getContext("2d");

			// Clear to transparent
			ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

			const bgId = bg.Id;

			// 1. Base Gradient/Color Rendering
			const colors = this.getBgColors(bgId);
			const angle = this.getBgAngle(bgId);

			if (bgId !== BackgroundDecorationId.Default) {
				const radius = CARD_HEIGHT / 2;
				this.prepareClip(ctx, radius);

				ctx.save();
				ctx.clip();

				ctx.globalAlpha = CARD_BACKGROUND_OPACITY;
				ctx.fillStyle = createLinearGradient(ctx, colors, angle);
				ctx.fill();

				this.renderGloss(ctx);
				this.renderSpecialEffects(ctx, bgId);

				ctx.restore();
				this.renderBorder(ctx, colors, angle, radius);
			}

			// Encode and store as Image for performance
			const buffer = canvas.toBuffer("image/webp");
			const image = await loadImage(buffer);
			this.patterns.set(bgId, image);
		}

		Log.Info(`Background patterns initialized in ${Date.now() - startTime}ms`);
	}

	static get(bgId: BackgroundDecorationId): Image {
		return this.patterns.get(bgId) || this.patterns.get(BackgroundDecorationId.Default)!;
	}

	private static getBgColors(bgId: BackgroundDecorationId): string[] {
		return BG_COLORS[bgId] || BG_COLORS[BackgroundDecorationId.Default];
	}

	private static getBgAngle(bgId: BackgroundDecorationId): number {
		return BG_ANGLES[bgId] ?? 45;
	}

	private static prepareClip(ctx: SKRSContext2D, radius: number) {
		ctx.beginPath();
		ctx.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, radius);
		ctx.closePath();
	}

	private static renderGloss(ctx: SKRSContext2D) {
		const gloss = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
		gloss.addColorStop(0, "rgba(255, 255, 255, 0.15)");
		gloss.addColorStop(0.5, "rgba(255, 255, 255, 0)");
		gloss.addColorStop(1, "rgba(0, 0, 0, 0.2)");
		ctx.fillStyle = gloss;
		ctx.fill();
	}

	private static renderBorder(ctx: SKRSContext2D, colors: string[], angle: number, radius: number) {
		ctx.globalAlpha = 0.5;
		ctx.strokeStyle = createLinearGradient(ctx, colors, angle);
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.roundRect(0, 0, CARD_WIDTH, CARD_HEIGHT, radius);
		ctx.stroke();
	}

	private static renderSpecialEffects(ctx: SKRSContext2D, bgId: BackgroundDecorationId) {
		switch (bgId) {
		case BackgroundDecorationId.FrutigerAero:
			this.renderFrutigerAero(ctx);
			break;
		case BackgroundDecorationId.Silver:
			this.renderSilver(ctx);
			break;
		case BackgroundDecorationId.Cloud:
			this.renderCloud(ctx);
			break;
		}
	}

	private static renderFrutigerAero(ctx: SKRSContext2D) {
		const width = CARD_WIDTH;
		const height = CARD_HEIGHT;
		const y = 0;

		ctx.globalAlpha = 1.0;
		// --- Wave 1 (Soft Large Wave) ---
		ctx.beginPath();
		ctx.moveTo(0, y + height);
		ctx.bezierCurveTo(width * 0.2, y + height * 0.1, width * 0.8, y + height * 1.5, width, y + height * 0.3);
		ctx.lineTo(width, y + height);
		ctx.lineTo(0, y + height);
		ctx.closePath();

		const grad1 = ctx.createLinearGradient(0, y, 0, y + height);
		grad1.addColorStop(0, "rgba(255, 255, 255, 0.5)");
		grad1.addColorStop(0.5, "rgba(255, 255, 255, 0)");
		grad1.addColorStop(1, "rgba(255, 255, 255, 0.2)");
		ctx.fillStyle = grad1;
		ctx.fill();

		// --- Wave 2 (Smaller Sharp Wave) ---
		ctx.beginPath();
		ctx.moveTo(0, y + height * 0.8);
		ctx.bezierCurveTo(width * 0.4, y + height * 0.5, width * 0.2, y + height * -0.2, width, y + height * 0.6);
		ctx.lineTo(width, y + height);
		ctx.lineTo(0, y + height);
		ctx.closePath();

		const grad2 = ctx.createLinearGradient(0, y, width, y + height);
		grad2.addColorStop(0, "rgba(100, 255, 255, 0.2)");
		grad2.addColorStop(1, "rgba(100, 255, 255, 0)");
		ctx.fillStyle = grad2;
		ctx.fill();

		// --- Glowing Edge ---
		ctx.beginPath();
		ctx.moveTo(0, y + height * 0.81);
		ctx.bezierCurveTo(width * 0.4, y + height * 0.51, width * 0.2, y + height * -0.19, width, y + height * 0.61);
		ctx.strokeStyle = "rgba(68, 255, 255, 0.4)";
		ctx.lineWidth = 1;
		ctx.stroke();

		// --- Soft Bottom Glow ---
		const ray = ctx.createLinearGradient(0, y + height, 0, y + height * 0.6);
		ray.addColorStop(0, "rgba(100, 255, 255, 0.25)");
		ray.addColorStop(1, "rgba(100, 255, 255, 0)");
		ctx.fillStyle = ray;
		ctx.fillRect(0, y, width, height);

		// --- Light Ray ---
		const beam = ctx.createRadialGradient(width * 0.8, y + height, 10, width * 0.8, y + height, 400);
		beam.addColorStop(0, "rgba(255, 255, 255, 0.2)");
		beam.addColorStop(1, "rgba(255, 255, 255, 0)");
		ctx.fillStyle = beam;
		ctx.fillRect(0, y, width, height);
	}

	private static renderSilver(ctx: SKRSContext2D) {
		const width = CARD_WIDTH;
		const height = CARD_HEIGHT;
		const y = 0;

		ctx.globalAlpha = 1.0;
		// 1. Specular Shine (Middle)
		const shine = ctx.createLinearGradient(width * 0.6, 0, width * 0.8, 75);
		shine.addColorStop(0, "rgba(255, 255, 255, 0)");
		shine.addColorStop(0.5, "rgba(255, 255, 255, 0.25)");
		shine.addColorStop(1, "rgba(255, 255, 255, 0)");
		ctx.fillStyle = shine;
		ctx.fillRect(0, y, width, height);

		// 2. Procedural "Glitter" Grain
		for (let i = 0; i < 4_000; i++) {
			const px = Math.random() * width;
			const py = y + Math.random() * height;
			const size = Math.random() > 0.98 ? 2 : 1;
			const opacity = Math.random() * 0.15;
			ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
			ctx.fillRect(px, py, size, size);
		}

		// 3. Subtle metallic contrast
		const contrast = ctx.createLinearGradient(0, y, 0, y + height);
		contrast.addColorStop(0, "rgba(255, 255, 255, 0.05)");
		contrast.addColorStop(0.5, "rgba(255, 255, 255, 0)");
		contrast.addColorStop(1, "rgba(0, 0, 0, 0.05)");
		ctx.fillStyle = contrast;
		ctx.fillRect(0, y, width, height);
	}

	private static renderCloud(ctx: SKRSContext2D) {
		ctx.save();
		const width = CARD_WIDTH;
		const height = CARD_HEIGHT;
		const y = 0;
		const cx = width * 0.7;
		const cy = y + height * 0.55;

		// Neon Cloud Styling - Pink Neon
		const neonColor = "#ff94caff";

		// Create a gradient for the stroke to fade it out towards the bottom-right
		const strokeGrad = ctx.createLinearGradient(cx - 50, cy - 50, cx + 50, cy + 50);
		strokeGrad.addColorStop(0, neonColor);
		strokeGrad.addColorStop(0.7, neonColor);
		strokeGrad.addColorStop(1, "rgba(255, 105, 180, 0)");

		ctx.strokeStyle = strokeGrad;
		ctx.lineCap = "round";

		// Draw "fluffy" humps using individual arcs, but only the top/left ones
		// We'll draw them as one continuous path but with the fading stroke
		ctx.beginPath();

		// 1. Left hump
		ctx.arc(cx - 35, cy + 10, 25, Math.PI * 0.5, Math.PI * 1.5);
		// 2. Top-Left hump
		ctx.arc(cx - 15, cy - 15, 28, Math.PI * 1, Math.PI * 1.6);
		// 3. Main Top hump
		ctx.arc(cx + 15, cy - 20, 32, Math.PI * 1.25, Math.PI * 1.9);
		// 4. Start of Top-Right hump (fading out)
		ctx.arc(cx + 40, cy - 5, 25, Math.PI * 1.4, Math.PI * 1.9);

		// Outer Glow (Neon Aura)
		ctx.shadowColor = neonColor;
		ctx.shadowBlur = 12;
		ctx.lineWidth = 4;
		ctx.stroke();

		// Sharp Core (The "tube")
		ctx.shadowBlur = 0;
		ctx.strokeStyle = "#FFFFFF";
		ctx.globalAlpha = 0.8;
		ctx.lineWidth = 1.5;
		ctx.stroke();

		ctx.restore();
	}
}
