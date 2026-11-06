"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Language_1 = require("#core/models/Language");
const User_1 = require("#core/models/User");
const BackgroundDecorations_1 = require("#core/types/BackgroundDecorations");
const canvas_1 = require("@napi-rs/canvas");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const UserRankingCardCanvasBuilder_1 = require("#bot/ui/builders/UserRankingCardCanvasBuilder");
const BackgroundPatternRegistry_1 = require("#bot/ui/patterns/BackgroundPatternRegistry");
const AvatarDecorationRegistry_1 = require("#bot/ui/patterns/AvatarDecorationRegistry");
canvas_1.GlobalFonts.registerFromPath(node_path_1.default.join(process.cwd(), "src", "bot", "ui", "assets", "fonts", "Inter.ttf"), "Inter");
canvas_1.GlobalFonts.registerFromPath(node_path_1.default.join(process.cwd(), "src", "bot", "ui", "assets", "fonts", "InterSemiBold.ttf"), "InterSemiBold");
canvas_1.GlobalFonts.registerFromPath(node_path_1.default.join(process.cwd(), "src", "bot", "ui", "assets", "fonts", "InterBold.ttf"), "InterBold");
async function testRankingImage() {
    console.log("Starting ranking image test...");
    await BackgroundPatternRegistry_1.BackgroundPatternRegistry.initialize();
    await AvatarDecorationRegistry_1.AvatarDecorationRegistry.initialize();
    const user = new User_1.User("332228051871989761", Language_1.Language.English);
    // Bypassing DB for UI testing
    user.Nickname = "Leon S Kennedy";
    user.Id = "332228051871989761";
    user.GangId = null;
    for (const bg of (0, BackgroundDecorations_1.getBackgroundDecorationList)()) {
        const builder = new UserRankingCardCanvasBuilder_1.UserRankingCardCanvasBuilder(user, 1, "Cr$ 1.500.000 (150)", "https://64.media.tumblr.com/e4c4d8cb95b53cb810d7d0cadf1a5fa1/e4a5be77d55d027d-fe/s1280x1920/874f014800947f2327825bc8ba35026e703bf033.jpg")
            .SetDecoration(bg.Id);
        console.log(`Generating image for ${bg.Description[Language_1.Language.English]}...`);
        const buffer = await builder.GenerateImage();
        const filename = `test_rank_${bg.Description[Language_1.Language.English]}.webp`;
        node_fs_1.default.writeFileSync(filename, buffer);
        console.log(`Image saved to ${filename}`);
    }
}
testRankingImage().catch(console.error);
//# sourceMappingURL=test-ranking-image.js.map