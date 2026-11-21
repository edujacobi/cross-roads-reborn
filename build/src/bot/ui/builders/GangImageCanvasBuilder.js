"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GangImageCanvasBuilder = exports.DEFAULT_GANG_IMAGE = void 0;
exports.testImage = testImage;
const ui_1 = require("#bot/utils/ui");
const Language_1 = require("#core/models/Language");
const User_1 = require("#core/models/User");
const log_1 = require("#shared/log");
const canvas_1 = require("@napi-rs/canvas");
const node_fs_1 = __importDefault(require("node:fs"));
const BaseCanvasBuilder_1 = require("./BaseCanvasBuilder");
const GangColors_1 = require("#core/types/GangColors");
exports.DEFAULT_GANG_IMAGE = "https://i.imgur.com/xOUjOlZ.png";
class GangImageCanvasBuilder extends BaseCanvasBuilder_1.BaseCanvasBuilder {
    User;
    Gang;
    IsFullSize;
    constructor(user, gang, language, isFullSize = false) {
        const width = 1184;
        const height = isFullSize ? 64 : 32;
        super(width, height, language);
        this.User = user;
        this.Gang = gang;
        this.IsFullSize = isFullSize;
    }
    static GangImageCache = new Map();
    async GetCanvas() {
        const ctx = this.Ctx;
        await this.DrawGangInfo(ctx, 0, 0);
        return this.Canvas;
    }
    async DrawGangInfo(ctx, x, y) {
        const Strings = {
            [Language_1.Language.English]: {
                of: "of",
                level: "Level",
            },
            [Language_1.Language.Portuguese]: {
                of: "de",
                level: "Nível",
            },
            [Language_1.Language.Spanish]: {
                of: "de",
                level: "Nivel",
            },
        };
        let image;
        const imageUrl = this.Gang.Image ?? exports.DEFAULT_GANG_IMAGE;
        const cached = GangImageCanvasBuilder.GangImageCache.get(imageUrl);
        if (cached) {
            image = cached;
        }
        else {
            try {
                image = await (0, canvas_1.loadImage)(imageUrl);
                GangImageCanvasBuilder.GangImageCache.set(imageUrl, image);
            }
            catch (error) {
                log_1.logger.error(`Error loading gang image. Default image used instead.`, error);
                const defaultCached = GangImageCanvasBuilder.GangImageCache.get(exports.DEFAULT_GANG_IMAGE);
                if (defaultCached) {
                    image = defaultCached;
                }
                else {
                    image = await (0, canvas_1.loadImage)(exports.DEFAULT_GANG_IMAGE);
                    GangImageCanvasBuilder.GangImageCache.set(exports.DEFAULT_GANG_IMAGE, image);
                }
            }
        }
        const colorString = (0, ui_1.convertHexNumberToString)(GangColors_1.GangColor[this.Gang.Color].Color);
        const color = (0, ui_1.hexToRGB)(colorString);
        if (this.IsFullSize) {
            ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.15)`;
            ctx.beginPath();
            ctx.roundRect(x, y, this.Width, this.Height, 18);
            ctx.fill();
        }
        const radius = 16;
        const imageSize = radius * 2;
        const circleY = y + this.Height / 2;
        if (this.IsFullSize) {
            const padding = 8;
            const circleX = x + padding + radius;
            ctx.beginPath();
            ctx.arc(circleX, circleY, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.5)`;
            ctx.fill();
            ctx.save();
            ctx.clip();
            ctx.drawImage(image, circleX - radius, circleY - radius, imageSize, imageSize);
            ctx.restore();
            ctx.font = "600 20px InterSemiBold";
            ctx.fillStyle = "#E3E3E6";
            ctx.textBaseline = "middle";
            ctx.textAlign = "start";
            const textMargin = circleX + radius + 16;
            const roleText = `${this.Gang.Members.find(member => member.UserId === this.User.Id).RoleName} ${Strings[this.Language].of} `;
            ctx.shadowBlur = 8;
            ctx.fillText(roleText, textMargin, circleY);
            const roleWidth = ctx.measureText(roleText).width;
            ctx.fillStyle = colorString;
            ctx.fillText(this.Gang.Name, textMargin + roleWidth, circleY);
            ctx.fillStyle = "#E3E3E6";
            ctx.textAlign = "end";
            ctx.fillText(`${Strings[this.Language].level} ${this.Gang.Level}`, this.Width - 8, circleY);
        }
        else {
            // Compact mode: [Icon] [Text] (Right aligned as a group)
            ctx.font = "600 20px InterSemiBold";
            ctx.textBaseline = "middle";
            const roleName = this.Gang.Members.find(member => member.UserId === this.User.Id).RoleName;
            const roleText = `${roleName} ${Strings[this.Language].of} `;
            const textWidth = ctx.measureText(roleText).width + ctx.measureText(this.Gang.Name).width;
            const groupWidth = imageSize + 10 + textWidth;
            const startX = x + this.Width - groupWidth;
            const circleX = startX + radius;
            ctx.beginPath();
            ctx.arc(circleX, circleY, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.15)`;
            ctx.fill();
            ctx.save();
            ctx.clip();
            ctx.drawImage(image, circleX - radius, circleY - radius, imageSize, imageSize);
            ctx.restore();
            const textMargin = startX + imageSize + 10;
            ctx.textAlign = "left";
            ctx.fillStyle = "#E3E3E6";
            ctx.shadowBlur = 8;
            ctx.fillText(roleText, textMargin, circleY);
            ctx.fillStyle = colorString;
            ctx.fillText(this.Gang.Name, textMargin + ctx.measureText(roleText).width, circleY);
        }
        ctx.shadowBlur = 0;
    }
}
exports.GangImageCanvasBuilder = GangImageCanvasBuilder;
async function testImage() {
    const user = await new User_1.User("332228051871989761").GetInfo();
    if (!user)
        return;
    const gang = await user.GetGang();
    if (!gang)
        return;
    const image = await new GangImageCanvasBuilder(user, gang, Language_1.Language.English).GenerateImage();
    node_fs_1.default.writeFile("image.webp", image, (err) => {
        if (err)
            log_1.logger.error(err);
    });
}
//# sourceMappingURL=GangImageCanvasBuilder.js.map