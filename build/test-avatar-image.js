"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = require("#core/models/User");
const UserImageCanvasBuilder_1 = require("#bot/ui/builders/UserImageCanvasBuilder");
const AvatarDecorationRegistry_1 = require("#bot/ui/patterns/AvatarDecorationRegistry");
const BackgroundPatternRegistry_1 = require("#bot/ui/patterns/BackgroundPatternRegistry");
const canvas_1 = require("@napi-rs/canvas");
const Language_1 = require("#core/models/Language");
const Ids_1 = require("#core/types/Ids");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
canvas_1.GlobalFonts.registerFromPath(node_path_1.default.join(process.cwd(), "src", "bot", "ui", "assets", "fonts", "Inter.ttf"), "Inter");
canvas_1.GlobalFonts.registerFromPath(node_path_1.default.join(process.cwd(), "src", "bot", "ui", "assets", "fonts", "InterSemiBold.ttf"), "InterSemiBold");
canvas_1.GlobalFonts.registerFromPath(node_path_1.default.join(process.cwd(), "src", "bot", "ui", "assets", "fonts", "InterBold.ttf"), "InterBold");
async function testAvatarImage() {
    console.log("Starting avatar image test...");
    await BackgroundPatternRegistry_1.BackgroundPatternRegistry.initialize();
    await AvatarDecorationRegistry_1.AvatarDecorationRegistry.initialize();
    const user = new User_1.User("332228051871989761", Language_1.Language.English);
    // Bypassing DB for UI testing
    user.Nickname = "Leon S Kennedy";
    user.Id = "332228051871989761";
    const decorations = [
        Ids_1.AvatarDecorationId.MasterOfArms,
    ];
    for (const decoId of decorations) {
        console.log(`Generating avatar for decoration ID ${decoId}...`);
        const builder = new UserImageCanvasBuilder_1.UserImageCanvasBuilder(user, "https://64.media.tumblr.com/e4c4d8cb95b53cb810d7d0cadf1a5fa1/e4a5be77d55d027d-fe/s1280x1920/874f014800947f2327825bc8ba35026e703bf033.jpg")
            .SetDecoration(decoId);
        const buffer = await builder.GenerateImage();
        const filename = `test_avatar_${decoId}.webp`;
        node_fs_1.default.writeFileSync(filename, buffer);
        console.log(`Image saved to ${filename}`);
    }
}
testAvatarImage().catch(console.error);
//# sourceMappingURL=test-avatar-image.js.map