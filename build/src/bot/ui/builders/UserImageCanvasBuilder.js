"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserImageCanvasBuilder = void 0;
exports.testImage = testImage;
const Language_1 = require("#core/models/Language");
const User_1 = require("#core/models/User");
const Classes_1 = require("#core/types/Classes");
const Ids_1 = require("#core/types/Ids");
const log_1 = require("#shared/log");
const canvas_1 = require("@napi-rs/canvas");
const node_fs_1 = __importDefault(require("node:fs"));
const AvatarDecorationRegistry_1 = require("../patterns/AvatarDecorationRegistry");
const BaseCanvasBuilder_1 = require("./BaseCanvasBuilder");
const GangImageCanvasBuilder_1 = require("./GangImageCanvasBuilder");
const AVATAR_CENTER = { x: 284, y: 228 }; // Center position of the avatar on the canvas - Control padding changing center
class UserImageCanvasBuilder extends BaseCanvasBuilder_1.BaseCanvasBuilder {
    User;
    AvatarUrl;
    Badges = null;
    Decoration = Ids_1.AvatarDecorationId.Default;
    constructor(user, avatarUrl, language = Language_1.Language.English) {
        super(AvatarDecorationRegistry_1.AVATAR_CANVAS_SIZE, AvatarDecorationRegistry_1.AVATAR_CANVAS_SIZE, language);
        this.User = user;
        this.AvatarUrl = avatarUrl ?? Classes_1.ClassList[this.User.Class].Image.Url;
    }
    SetDecoration(decoration) {
        this.Decoration = decoration;
        if (decoration === Ids_1.AvatarDecorationId.VIP && !this.User.IsVip()) {
            this.Decoration = Ids_1.AvatarDecorationId.Default;
        }
        return this;
    }
    SetBadges(badges) {
        this.Badges = badges;
        return this;
    }
    // Cache for fully rendered decorated avatars as Buffers
    static AvatarCache = new Map();
    async GetCanvas() {
        // Cache Key: Unique combination of avatar source and aesthetic choices
        const cacheKey = `${this.AvatarUrl}_${this.Decoration}`;
        const cachedBuffer = UserImageCanvasBuilder.AvatarCache.get(cacheKey);
        if (cachedBuffer) {
            const cachedImage = await (0, canvas_1.loadImage)(cachedBuffer);
            this.Ctx.drawImage(cachedImage, 0, 0);
            return this.Canvas;
        }
        const ctx = this.Ctx;
        // 1. Create a temporary layer for the avatar and its decoration
        const userCanvas = new canvas_1.Canvas(AvatarDecorationRegistry_1.AVATAR_CANVAS_SIZE, AvatarDecorationRegistry_1.AVATAR_CANVAS_SIZE);
        const userCtx = userCanvas.getContext("2d");
        const LAYER_CENTER_X = AvatarDecorationRegistry_1.AVATAR_CANVAS_SIZE / 2;
        const LAYER_CENTER_Y = AvatarDecorationRegistry_1.AVATAR_CANVAS_SIZE / 2;
        let image;
        try {
            image = await (0, canvas_1.loadImage)(this.AvatarUrl);
        }
        catch (error) {
            log_1.logger.error(`Error loading user image. Default image used instead.`, error);
            image = await (0, canvas_1.loadImage)(GangImageCanvasBuilder_1.DEFAULT_GANG_IMAGE);
        }
        const imageDrawSize = (AvatarDecorationRegistry_1.AVATAR_RADIUS - AvatarDecorationRegistry_1.AVATAR_BORDER_WIDTH / 2) * 2 + 4;
        // 2. Clip and draw the user's avatar
        userCtx.save();
        userCtx.beginPath();
        userCtx.arc(LAYER_CENTER_X, LAYER_CENTER_Y, AvatarDecorationRegistry_1.AVATAR_RADIUS - AvatarDecorationRegistry_1.AVATAR_BORDER_WIDTH / 2, 0, Math.PI * 2);
        userCtx.closePath();
        userCtx.clip();
        userCtx.drawImage(image, LAYER_CENTER_X - imageDrawSize / 2, LAYER_CENTER_Y - imageDrawSize / 2, imageDrawSize, imageDrawSize);
        userCtx.restore();
        // 3. Draw the decoration frame on top
        const frame = AvatarDecorationRegistry_1.AvatarDecorationRegistry.get(this.Decoration);
        userCtx.drawImage(frame, 0, 0, AvatarDecorationRegistry_1.AVATAR_CANVAS_SIZE, AvatarDecorationRegistry_1.AVATAR_CANVAS_SIZE);
        // 4. Draw the layer onto our main canvas
        const offsetX = AVATAR_CENTER.x - LAYER_CENTER_X;
        const offsetY = AVATAR_CENTER.y - LAYER_CENTER_Y;
        ctx.drawImage(userCanvas, offsetX, offsetY);
        const resultBuffer = await this.Canvas.encode("webp", 80);
        UserImageCanvasBuilder.AvatarCache.set(cacheKey, resultBuffer);
        return this.Canvas;
    }
}
exports.UserImageCanvasBuilder = UserImageCanvasBuilder;
async function testImage() {
    const user = await new User_1.User("332228051871989761").GetInfo();
    if (!user) {
        return;
    }
    const image = await new UserImageCanvasBuilder(user, "https://64.media.tumblr.com/e4c4d8cb95b53cb810d7d0cadf1a5fa1/e4a5be77d55d027d-fe/s1280x1920/874f014800947f2327825bc8ba35026e703bf033.jpg")
        .SetDecoration(Ids_1.AvatarDecorationId.BotanicalGarden)
        .GenerateImage();
    node_fs_1.default.writeFile("image.webp", image, (err) => {
        log_1.logger.error(err);
    });
}
//# sourceMappingURL=UserImageCanvasBuilder.js.map