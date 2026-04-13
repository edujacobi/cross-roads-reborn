import fs from "node:fs";
import path from "node:path";
import { BadgeList } from "../src/core/types/Badges";
import { ItemList } from "../src/core/types/Items";
import { ClassList } from "../src/core/types/Classes";
import { EmoteId } from "../src/bot/utils/emotes";
import { SituationId } from "../src/core/models/User";
import { BadgeId } from "../src/core/types/Badges";
import { ItemId } from "../src/core/types/Ids";
import { ClassId } from "../src/core/types/Classes";
import { BundleId } from "../src/core/types/Ids";
import { type SkinBundles } from "#core/types/Skins";

const BASE_URL = "https://cdn.discordapp.com/emojis/";
const ASSETS_ROOT = path.join(process.cwd(), "src/bot/ui/assets/images");

async function downloadImage(id: string, folder: string, filename: string) {
	const url = `${BASE_URL}${id}.png?size=128&quality=lossless`;
	const targetDir = path.join(ASSETS_ROOT, folder);
	const targetPath = path.join(targetDir, filename);

	if (!fs.existsSync(targetDir)) {
		fs.mkdirSync(targetDir, { recursive: true });
	}

	try {
		const response = await fetch(url);
		if (!response.ok) throw new Error(`Status ${response.status}`);
		const arrayBuffer = await response.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		fs.writeFileSync(targetPath, buffer);
		console.log(`[OK] ${folder}/${filename}`);
	}
	catch (error) {
		console.error(`[FAIL] ${folder}/${filename} (${id}):`, (error as Error).message);
	}
}

async function run() {
	console.log("Starting asset download...");

	// 1. Situations
	console.log("\nDownloading Situations...");
	const situationEmoteMap: Record<number, string> = {
		[SituationId.Idling]: EmoteId.Lazy,
		[SituationId.Job]: EmoteId.Jobs,
		[SituationId.Robbery]: EmoteId.Robbery,
		[SituationId.Prison]: EmoteId.Prison,
		[SituationId.Hospital]: EmoteId.Hospital,
		[SituationId.Scavenging]: EmoteId.Scavenge,
		[SituationId.Wanted]: EmoteId.Police,
		[SituationId.BeatUp]: EmoteId.Beat,
		[SituationId.Casino]: EmoteId.Casino,
		[SituationId.DefendingInvestment]: EmoteId.InvestmentActive,
		[SituationId.GangAction]: EmoteId.Gang,
	};

	for (const [id, emoteId] of Object.entries(situationEmoteMap)) {
		const filename = `${id}_${SituationId[Number(id)]}.png`;
		await downloadImage(emoteId, "situations", filename);
	}

	// 2. Classes
	console.log("\nDownloading Classes...");
	for (const cls of Object.values(ClassList)) {
		const filename = `${cls.Id}_${ClassId[cls.Id]}.png`;
		await downloadImage(cls.Image.Emote.Id, "classes", filename);
	}

	// 3. Badges
	console.log("\nDownloading Badges...");
	for (const badge of Object.values(BadgeList)) {
		// Handle special names for backward compatibility with current mapper
		let filename = `${BadgeId[badge.Id]}.png`;
		if (badge.Id === BadgeId.VIP || badge.Id === BadgeId.VIPEternal) filename = "vip.png";

		await downloadImage(badge.Emoji.Id, "badges", filename);
	}

	// 4. Items (Including Skins)
	console.log("\nDownloading Items...");
	for (const item of Object.values(ItemList)) {
		for (const [bundleId, skin] of Object.entries(item.Skin) as [string, SkinBundles][]) {
			const bId = Number(bundleId);
			let filename = `${item.Id}_${ItemId[item.Id]}.png`;
			if (bId !== BundleId.Default) {
				filename = `${item.Id}_${ItemId[item.Id]}_${BundleId[bId]}.png`;
			}
			await downloadImage(String(skin.Id), "items", filename);
		}
	}

	console.log("\nDone!");
}

run();
