"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressBarCanvasBuilder = void 0;
const BaseCanvasBuilder_1 = require("./BaseCanvasBuilder");
class ProgressBarCanvasBuilder extends BaseCanvasBuilder_1.BaseCanvasBuilder {
    Ratio;
    IconPath;
    ColorHex;
    constructor(width, height, ratio, iconPath, colorHex, language) {
        super(width, height, language);
        this.Ratio = Math.max(0, Math.min(1, ratio));
        this.IconPath = iconPath;
        this.ColorHex = colorHex;
    }
    async GenerateImage() {
        const ctx = this.Ctx;
        const barHeight = this.Height * 0.4;
        const barY = (this.Height - barHeight) / 2;
        const radius = barHeight / 2;
        // Empty track
        ctx.fillStyle = "rgba(91, 91, 107, 0.25)";
        ctx.beginPath();
        ctx.roundRect(0, barY, this.Width, barHeight, radius);
        ctx.fill();
        // Filled track
        if (this.Ratio > 0) {
            ctx.fillStyle = this.ColorHex;
            const filledWidth = Math.max(barHeight, this.Width * this.Ratio);
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(0, barY, this.Width, barHeight, radius);
            ctx.clip();
            ctx.beginPath();
            ctx.roundRect(0, barY, filledWidth, barHeight, radius);
            ctx.fill();
            ctx.restore();
        }
        // Cursor Icon
        if (this.IconPath) {
            const cursorSize = this.Height;
            const cursorY = 0;
            // Ensure cursor doesn't overflow bounds
            const cursorX = Math.max(0, Math.min(this.Width - cursorSize, (this.Width * this.Ratio) - (cursorSize / 2)));
            try {
                const img = await this.LoadLocalImage(this.IconPath);
                ctx.drawImage(img, cursorX, cursorY, cursorSize, cursorSize);
            }
            catch (err) {
                // Fallback if icon loading fails
                ctx.fillStyle = "#FFFFFF";
                ctx.beginPath();
                ctx.arc(cursorX + cursorSize / 2, this.Height / 2, barHeight / 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        return super.GenerateImage();
    }
}
exports.ProgressBarCanvasBuilder = ProgressBarCanvasBuilder;
//# sourceMappingURL=ProgressBarCanvasBuilder.js.map