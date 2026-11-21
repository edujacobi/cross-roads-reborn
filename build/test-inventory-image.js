"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
const canvas_1 = require("@napi-rs/canvas");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const InventoryCanvasBuilder_1 = require("./src/bot/ui/builders/InventoryCanvasBuilder");
const AvatarDecorationRegistry_1 = require("./src/bot/ui/patterns/AvatarDecorationRegistry");
const Language_1 = require("./src/core/models/Language");
const User_1 = require("./src/core/models/User");
const Badges_1 = require("./src/core/types/Badges");
const Classes_1 = require("./src/core/types/Classes");
const Ids_1 = require("./src/core/types/Ids");
const Investments_1 = require("./src/core/types/Investments");
const log_1 = require("#shared/log");
// Register fonts
canvas_1.GlobalFonts.registerFromPath(node_path_1.default.join(process.cwd(), "src", "bot", "ui", "assets", "fonts", "Inter.ttf"), "Inter");
canvas_1.GlobalFonts.registerFromPath(node_path_1.default.join(process.cwd(), "src", "bot", "ui", "assets", "fonts", "InterSemiBold.ttf"), "InterSemiBold");
canvas_1.GlobalFonts.registerFromPath(node_path_1.default.join(process.cwd(), "src", "bot", "ui", "assets", "fonts", "InterBold.ttf"), "InterBold");
async function testInventory() {
    console.log("Starting inventory test with footer variations...");
    await AvatarDecorationRegistry_1.AvatarDecorationRegistry.initialize();
    const userId = "332228051871989761";
    const userBase = new User_1.User(userId, Language_1.Language.Portuguese);
    userBase.Nickname = "Jacobi";
    userBase.Money = 50_000;
    userBase.Class = Classes_1.ClassId.Entrepreneur;
    userBase.Attributes = { Attack: 70, Defense: 45 };
    userBase.Situation = {
        Id: User_1.SituationId.Hospital,
        Simple: "Hospitalizado",
        ComplexUI: "Hospitalizado",
        EmoteId: "Hospital"
    };
    userBase.Items = [
        {
            Id: Ids_1.ItemId.Knife,
            Description: { [Language_1.Language.Portuguese]: "Faca" },
            Quantity: 10,
            RemainingTime: new Date(Date.now() + 1_000 * 60 * 60 * 24 * 7)
        },
        {
            Id: Ids_1.ItemId.Sunglasses,
            Description: { [Language_1.Language.Portuguese]: "Óculos de Sol comprido pra caralho" },
            Quantity: 1,
            RemainingTime: new Date(Date.now() + 1_000 * 60 * 60 * 24 * 7)
        }
    ];
    const noInvestment = {
        Id: null,
    };
    const withInvestment = {
        Id: Investments_1.InvestmentId.ChurrosCart,
        ExpiresAt: new Date(Date.now() + 1_000 * 60 * 60 * 24 * 7)
    };
    const badges = [
        { BadgeId: Badges_1.BadgeId.Developer },
        { BadgeId: Badges_1.BadgeId.VIP },
    ];
    const mockDiscordUser = {
        displayAvatarURL: () => "https://64.media.tumblr.com/e4c4d8cb95b53cb810d7d0cadf1a5fa1/e4a5be77d55d027d-fe/s1280x1920/874f014800947f2327825bc8ba35026e703bf033.jpg"
    };
    const mockGang = {
        Id: 1,
        Name: "Os Pamonhas",
        Color: 4,
        Level: 15,
        Image: "https://i.imgur.com/xOUjOlZ.png",
        Members: [{ UserId: userId, RoleName: "Líder" }]
    };
    const testCases = [
        { name: "none_closed", full: false, gang: null, isOnline: false, investment: noInvestment },
        { name: "gang_only_closed", full: false, gang: mockGang, isOnline: false, investment: noInvestment },
        { name: "inv_only_closed", full: false, gang: null, isOnline: false, investment: withInvestment },
        { name: "both_closed", full: false, gang: mockGang, isOnline: false, investment: withInvestment },
        { name: "both_open", full: true, gang: mockGang, isOnline: true, investment: withInvestment },
        { name: "gang_only_open", full: true, gang: mockGang, isOnline: true, investment: noInvestment },
        { name: "inv_only_open", full: true, gang: null, isOnline: true, investment: withInvestment }
    ];
    for (const tc of testCases) {
        log_1.logger.info(`Generating ${tc.name}...`);
        userBase.Investment = tc.investment;
        const builder = new InventoryCanvasBuilder_1.InventoryCanvasBuilder({
            User: userBase,
            Badges: badges,
            DiscordUser: mockDiscordUser,
            Language: userBase.Language,
            FullSize: tc.full,
            Gang: tc.gang,
            IsOnline: tc.isOnline,
        });
        await builder.GetCanvas();
        const buffer = await builder.GenerateImage();
        node_fs_1.default.writeFileSync(`test_inventory_${tc.name}.webp`, buffer);
        log_1.logger.info(`Saved test_inventory_${tc.name}.webp`);
    }
}
testInventory().catch(log_1.logger.error);
//# sourceMappingURL=test-inventory-image.js.map