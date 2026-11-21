"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const Badges_1 = require("../src/core/types/Badges");
const Items_1 = require("../src/core/types/Items");
const Classes_1 = require("../src/core/types/Classes");
const emotes_1 = require("../src/bot/utils/emotes");
const User_1 = require("../src/core/models/User");
const Badges_2 = require("../src/core/types/Badges");
const Ids_1 = require("../src/core/types/Ids");
const Classes_2 = require("../src/core/types/Classes");
const Ids_2 = require("../src/core/types/Ids");
const BASE_URL = "https://cdn.discordapp.com/emojis/";
const ASSETS_ROOT = node_path_1.default.join(process.cwd(), "src/bot/ui/assets/images");
async function downloadImage(id, folder, filename) {
    const url = `${BASE_URL}${id}.png?size=128&quality=lossless`;
    const targetDir = node_path_1.default.join(ASSETS_ROOT, folder);
    const targetPath = node_path_1.default.join(targetDir, filename);
    if (!node_fs_1.default.existsSync(targetDir)) {
        node_fs_1.default.mkdirSync(targetDir, { recursive: true });
    }
    try {
        const response = await fetch(url);
        if (!response.ok)
            throw new Error(`Status ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        node_fs_1.default.writeFileSync(targetPath, buffer);
        console.log(`[OK] ${folder}/${filename}`);
    }
    catch (error) {
        console.error(`[FAIL] ${folder}/${filename} (${id}):`, error.message);
    }
}
async function run() {
    console.log("Starting asset download...");
    // 1. Situations
    console.log("\nDownloading Situations...");
    const situationEmoteMap = {
        [User_1.SituationId.Idling]: emotes_1.EmoteId.Lazy,
        [User_1.SituationId.Job]: emotes_1.EmoteId.Jobs,
        [User_1.SituationId.Robbery]: emotes_1.EmoteId.Robbery,
        [User_1.SituationId.Prison]: emotes_1.EmoteId.Prison,
        [User_1.SituationId.Hospital]: emotes_1.EmoteId.Hospital,
        [User_1.SituationId.Scavenging]: emotes_1.EmoteId.Scavenge,
        [User_1.SituationId.Wanted]: emotes_1.EmoteId.Police,
        [User_1.SituationId.BeatUp]: emotes_1.EmoteId.Beat,
        [User_1.SituationId.Casino]: emotes_1.EmoteId.Casino,
        [User_1.SituationId.DefendingInvestment]: emotes_1.EmoteId.InvestmentActive,
        [User_1.SituationId.GangAction]: emotes_1.EmoteId.Gang,
    };
    for (const [id, emoteId] of Object.entries(situationEmoteMap)) {
        const filename = `${id}_${User_1.SituationId[Number(id)]}.png`;
        await downloadImage(emoteId, "situations", filename);
    }
    // 2. Classes
    console.log("\nDownloading Classes...");
    for (const cls of Object.values(Classes_1.ClassList)) {
        const filename = `${cls.Id}_${Classes_2.ClassId[cls.Id]}.png`;
        await downloadImage(cls.Image.Emote.Id, "classes", filename);
    }
    // 3. Badges
    console.log("\nDownloading Badges...");
    for (const badge of Object.values(Badges_1.BadgeList)) {
        // Handle special names for backward compatibility with current mapper
        let filename = `${Badges_2.BadgeId[badge.Id]}.png`;
        if (badge.Id === Badges_2.BadgeId.VIP || badge.Id === Badges_2.BadgeId.VIPEternal)
            filename = "vip.png";
        await downloadImage(badge.Emoji.Id, "badges", filename);
    }
    // 4. Items (Including Skins)
    console.log("\nDownloading Items...");
    for (const item of Object.values(Items_1.ItemList)) {
        for (const [bundleId, skin] of Object.entries(item.Skin)) {
            const bId = Number(bundleId);
            let filename = `${item.Id}_${Ids_1.ItemId[item.Id]}.png`;
            if (bId !== Ids_2.BundleId.Default) {
                filename = `${item.Id}_${Ids_1.ItemId[item.Id]}_${Ids_2.BundleId[bId]}.png`;
            }
            await downloadImage(String(skin.Id), "items", filename);
        }
    }
    console.log("\nDone!");
}
run();
//# sourceMappingURL=update-assets.js.map