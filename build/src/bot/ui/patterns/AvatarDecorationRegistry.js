"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvatarDecorationRegistry = exports.AVATAR_CENTER_Y = exports.AVATAR_CENTER_X = exports.AVATAR_RADIUS = exports.AVATAR_BORDER_WIDTH = exports.AVATAR_CANVAS_SIZE = void 0;
const AvatarDecorations_1 = require("#core/types/AvatarDecorations");
const Ids_1 = require("#core/types/Ids");
const canvas_1 = require("@napi-rs/canvas");
const log_1 = require("#shared/log");
const node_path_1 = __importDefault(require("node:path"));
exports.AVATAR_CANVAS_SIZE = 512;
exports.AVATAR_BORDER_WIDTH = 20;
exports.AVATAR_RADIUS = 214;
exports.AVATAR_CENTER_X = exports.AVATAR_CANVAS_SIZE / 2;
exports.AVATAR_CENTER_Y = exports.AVATAR_CANVAS_SIZE / 2;
const BADGE_MAP = {
    [Ids_1.AvatarDecorationId.Developer]: "Developer.png",
    [Ids_1.AvatarDecorationId.Moderator]: "Moderator.png",
    [Ids_1.AvatarDecorationId.Helper]: "Helper.png",
    [Ids_1.AvatarDecorationId.VIP]: "vip.png",
};
const WEAPON_MAP = {
    [Ids_1.AvatarDecorationId.Pistol]: "1_Pistol.png",
    [Ids_1.AvatarDecorationId.MachinePistol]: "2_MachinePistol.png",
    [Ids_1.AvatarDecorationId.HuntRifle]: "3_HuntRifle.png",
    [Ids_1.AvatarDecorationId.Shotgun]: "4_Shotgun.png",
    [Ids_1.AvatarDecorationId.SMG]: "5_SMG.png",
    [Ids_1.AvatarDecorationId.AssaultRifle]: "6_AssaultRifle.png",
    [Ids_1.AvatarDecorationId.Carbine]: "7_Carbine.png",
    [Ids_1.AvatarDecorationId.Sniper]: "8_Sniper.png",
    [Ids_1.AvatarDecorationId.Katana]: "9_Katana.png",
    [Ids_1.AvatarDecorationId.RPG]: "10_RPG.png",
    [Ids_1.AvatarDecorationId.Minigun]: "11_Minigun.png",
    [Ids_1.AvatarDecorationId.Bazooka]: "12_Bazooka.png",
};
function createLinearGradient(ctx, colors, angle = 90, x = exports.AVATAR_CENTER_X, y = exports.AVATAR_CENTER_Y, radius = exports.AVATAR_RADIUS) {
    const radian = (angle * Math.PI) / 180;
    const dx = Math.cos(radian) * radius;
    const dy = Math.sin(radian) * radius;
    const gradient = ctx.createLinearGradient(x - dx, y - dy, x + dx, y + dy);
    colors.forEach((color, index) => {
        gradient.addColorStop(index / (colors.length - 1), color);
    });
    return gradient;
}
class AvatarDecorationRegistry {
    static patterns = new Map();
    static async initialize() {
        log_1.Log.Info("Initializing avatar decoration frames...");
        const startTime = Date.now();
        const badgePath = node_path_1.default.join(process.cwd(), "src", "bot", "ui", "assets", "images", "badges");
        const itemPath = node_path_1.default.join(process.cwd(), "src", "bot", "ui", "assets", "images", "items");
        for (const decorationId of Object.keys(AvatarDecorations_1.AvatarDecorationList).map(Number)) {
            const canvas = new canvas_1.Canvas(exports.AVATAR_CANVAS_SIZE, exports.AVATAR_CANVAS_SIZE);
            const ctx = canvas.getContext("2d");
            const style = this.getBorderStyle(ctx, decorationId);
            const secondary = this.getSecondaryStyle(decorationId);
            // 1. Primary Border
            ctx.lineWidth = exports.AVATAR_BORDER_WIDTH;
            ctx.strokeStyle = style;
            ctx.globalAlpha = (decorationId === Ids_1.AvatarDecorationId.Default || decorationId in WEAPON_MAP) ? 0.25 : 1.0;
            ctx.beginPath();
            ctx.arc(exports.AVATAR_CENTER_X, exports.AVATAR_CENTER_Y, exports.AVATAR_RADIUS, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1.0;
            // 2. Secondary Border/Effects
            if (secondary) {
                ctx.save();
                ctx.globalAlpha = secondary.alpha;
                ctx.lineWidth = secondary.lineWidth;
                ctx.strokeStyle = typeof secondary.style === "function"
                    ? secondary.style(ctx, exports.AVATAR_CENTER_X, exports.AVATAR_CENTER_Y, exports.AVATAR_RADIUS)
                    : secondary.style;
                ctx.beginPath();
                ctx.arc(exports.AVATAR_CENTER_X, exports.AVATAR_CENTER_Y, exports.AVATAR_RADIUS - secondary.position, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
            // 3. Premium Highlights
            this.renderPremiumEffects(ctx, decorationId);
            // 4. Badge Loading & Baking
            const badgeFile = BADGE_MAP[decorationId];
            if (badgeFile) {
                try {
                    const badgeImg = await (0, canvas_1.loadImage)(node_path_1.default.join(badgePath, badgeFile));
                    const angle = Math.PI / 2;
                    const bx = exports.AVATAR_CENTER_X + exports.AVATAR_RADIUS * Math.cos(angle);
                    const by = exports.AVATAR_CENTER_Y + exports.AVATAR_RADIUS * Math.sin(angle);
                    ctx.fillStyle = ctx.strokeStyle;
                    ctx.beginPath();
                    ctx.arc(bx, by, 36, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.drawImage(badgeImg, bx - 32, by - 32, 64, 64);
                }
                catch (e) {
                    log_1.Log.Warning(`Failed to load badge ${badgeFile} for avatar decoration ${decorationId}`);
                }
            }
            // 5. Weapon Rendering (Baking weapon into the frame)
            const weaponFile = WEAPON_MAP[decorationId];
            if (weaponFile) {
                try {
                    const weaponImg = await (0, canvas_1.loadImage)(node_path_1.default.join(itemPath, weaponFile));
                    const weaponSize = 180;
                    const offsetX = 90;
                    const offsetY = 140;
                    // Right weapon
                    ctx.drawImage(weaponImg, exports.AVATAR_CENTER_X + offsetX - weaponSize / 2, exports.AVATAR_CENTER_Y + offsetY - weaponSize / 2, weaponSize, weaponSize);
                    // Left weapon (flipped)
                    ctx.save();
                    ctx.translate(exports.AVATAR_CENTER_X - offsetX, exports.AVATAR_CENTER_Y + offsetY);
                    ctx.scale(-1, 1);
                    ctx.drawImage(weaponImg, -weaponSize / 2, -weaponSize / 2, weaponSize, weaponSize);
                    ctx.restore();
                }
                catch (e) {
                    log_1.Log.Warning(`Failed to load weapon image ${weaponFile} for avatar decoration ${decorationId}`);
                }
            }
            // 6. Master of Arms Rendering
            if (decorationId === Ids_1.AvatarDecorationId.MasterOfArms) {
                const IMAGE_SIZE = 36;
                const FIRST_ROW_X = 2;
                const SECOND_ROW_X = 10;
                const THIRD_ROW_X = 20;
                const FIRST_ROW_Y = 70;
                const SECOND_ROW_Y = 85;
                const THIRD_ROW_Y = 104;
                const layout = [
                    // left
                    { file: "8_Sniper.png", x: FIRST_ROW_X, y: FIRST_ROW_Y, w: IMAGE_SIZE, h: IMAGE_SIZE, flipped: true },
                    { file: "6_AssaultRifle.png", x: SECOND_ROW_X, y: SECOND_ROW_Y, w: IMAGE_SIZE, h: IMAGE_SIZE, flipped: true },
                    { file: "11_Minigun.png", x: THIRD_ROW_X, y: THIRD_ROW_Y, w: IMAGE_SIZE, h: IMAGE_SIZE, flipped: true },
                    // right
                    { file: "5_SMG.png", x: 100 - FIRST_ROW_X, y: FIRST_ROW_Y, w: IMAGE_SIZE, h: IMAGE_SIZE, flipped: false },
                    { file: "7_Carbine.png", x: 100 - SECOND_ROW_X, y: SECOND_ROW_Y, w: IMAGE_SIZE, h: IMAGE_SIZE, flipped: false },
                    { file: "4_Shotgun.png", x: 100 - THIRD_ROW_X, y: THIRD_ROW_Y, w: IMAGE_SIZE, h: IMAGE_SIZE, flipped: false },
                    // center
                    { file: "18_Grenade.png", x: 53, y: 105, w: IMAGE_SIZE, h: IMAGE_SIZE, flipped: false },
                ];
                const scale = exports.AVATAR_CANVAS_SIZE / 140;
                for (const item of layout) {
                    try {
                        const img = await (0, canvas_1.loadImage)(node_path_1.default.join(itemPath, item.file));
                        const size = item.w * scale;
                        if (item.flipped) {
                            ctx.save();
                            ctx.translate((item.x * scale) + 140, item.y * scale);
                            ctx.scale(-1, 1);
                            ctx.drawImage(img, 0, 0, size, size);
                            ctx.restore();
                        }
                        else {
                            ctx.drawImage(img, item.x * scale, item.y * scale, size, size);
                        }
                    }
                    catch (e) {
                        log_1.Log.Warning(`Failed to load weapon ${item.file} for Master of Arms decoration`);
                    }
                }
            }
            const buffer = canvas.toBuffer("image/webp");
            const image = await (0, canvas_1.loadImage)(buffer);
            this.patterns.set(decorationId, image);
        }
        log_1.Log.Info(`Avatar decoration frames initialized in ${Date.now() - startTime}ms`);
    }
    static get(id) {
        return this.patterns.get(id) || this.patterns.get(Ids_1.AvatarDecorationId.Default);
    }
    static getBorderStyle(ctx, id) {
        switch (id) {
            case Ids_1.AvatarDecorationId.VIP:
                return createLinearGradient(ctx, ["#E0BA20", "#FFA500"], 45);
            case Ids_1.AvatarDecorationId.Developer:
                return "#00B784";
            case Ids_1.AvatarDecorationId.Moderator:
                return "#E43950";
            case Ids_1.AvatarDecorationId.Helper:
                return "#007BFF";
            case Ids_1.AvatarDecorationId.Purple:
                return createLinearGradient(ctx, ["#7345C4", "#3F1EB7"]);
            case Ids_1.AvatarDecorationId.Sunset:
                return createLinearGradient(ctx, ["#FD5949", "#D6249F", "#285AEB"]);
            case Ids_1.AvatarDecorationId.Sunrise:
                return createLinearGradient(ctx, ["#FCB045", "#FD1D1D", "#833AB4"]);
            case Ids_1.AvatarDecorationId.Cloud: {
                const grad = ctx.createRadialGradient(exports.AVATAR_CENTER_X, exports.AVATAR_CENTER_Y, exports.AVATAR_RADIUS - 10, exports.AVATAR_CENTER_X, exports.AVATAR_CENTER_Y, exports.AVATAR_RADIUS + 10);
                grad.addColorStop(0, "#94BBE9");
                grad.addColorStop(1, "#EEAECA");
                return grad;
            }
            case Ids_1.AvatarDecorationId.BotanicalGarden:
                return createLinearGradient(ctx, ["#3E805B", "#AAD47B", "#F9FFA1", "#e66c97", "#ba4fc2"], 30);
            case Ids_1.AvatarDecorationId.FrutigerAero:
                return createLinearGradient(ctx, ["#EDDD53", "#57C785", "#2A7B9B"], 115);
            case Ids_1.AvatarDecorationId.Silver:
                return createLinearGradient(ctx, ["#d9d9d9", "#ADBBC3", "#656C70"], 115);
            case Ids_1.AvatarDecorationId.Rainbow:
                return createLinearGradient(ctx, ["#9C4F96", "#FF6355", "#FBA949", "#FAE442", "#8BD448", "#2AA8F2"], 45);
            case Ids_1.AvatarDecorationId.Cat:
                return "#6A4931";
            case Ids_1.AvatarDecorationId.MasterOfArms:
                return createLinearGradient(ctx, ["#5C6444", "#3C4814"]);
            default:
                return "#6C6C93";
        }
    }
    static getSecondaryStyle(id) {
        const B = exports.AVATAR_BORDER_WIDTH;
        switch (id) {
            case Ids_1.AvatarDecorationId.FrutigerAero:
                return {
                    style: "#EDDD53",
                    alpha: 0.25,
                    lineWidth: B / 2,
                    position: B / 4,
                };
            case Ids_1.AvatarDecorationId.Silver:
                return {
                    style: (ctx, x, y, r) => createLinearGradient(ctx, ["#000", "#FFF"], 115, x, y, r),
                    alpha: 0.35,
                    lineWidth: B / 2,
                    position: B / 4,
                };
            default:
                return null;
        }
    }
    static renderPremiumEffects(ctx, id) {
        if (id === Ids_1.AvatarDecorationId.Silver) {
            ctx.save();
            for (let i = 0; i < 800; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = exports.AVATAR_RADIUS + (Math.random() - 0.5) * exports.AVATAR_BORDER_WIDTH;
                const px = exports.AVATAR_CENTER_X + Math.cos(angle) * dist;
                const py = exports.AVATAR_CENTER_Y + Math.sin(angle) * dist;
                const opacity = Math.random() * 0.3;
                ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                ctx.fillRect(px, py, 1, 1);
            }
            ctx.restore();
        }
        if (id === Ids_1.AvatarDecorationId.FrutigerAero) {
            ctx.save();
            const shine = ctx.createRadialGradient(exports.AVATAR_CENTER_X - 100, exports.AVATAR_CENTER_Y - 100, 10, exports.AVATAR_CENTER_X, exports.AVATAR_CENTER_Y, exports.AVATAR_RADIUS);
            shine.addColorStop(0, "rgba(255, 255, 255, 0.2)");
            shine.addColorStop(1, "rgba(255, 255, 255, 0)");
            ctx.fillStyle = shine;
            ctx.beginPath();
            ctx.arc(exports.AVATAR_CENTER_X, exports.AVATAR_CENTER_Y, exports.AVATAR_RADIUS + exports.AVATAR_BORDER_WIDTH / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
}
exports.AvatarDecorationRegistry = AvatarDecorationRegistry;
//# sourceMappingURL=AvatarDecorationRegistry.js.map