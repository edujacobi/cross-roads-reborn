import { Language } from "@core/models/Language";
import { User } from "@core/models/User";
import { getBackgroundDecorationList } from "@core/types/BackgroundDecorations";
import { GlobalFonts } from "@napi-rs/canvas";
import fs from "node:fs";
import path from "node:path";
import { UserRankingCardCanvasBuilder } from "@bot/ui/builders/UserRankingCardCanvasBuilder";
import { BackgroundPatternRegistry } from "@bot/ui/patterns/BackgroundPatternRegistry";
import { AvatarDecorationRegistry } from "@bot/ui/patterns/AvatarDecorationRegistry";

GlobalFonts.registerFromPath(path.join(process.cwd(), "src", "bot", "ui", "assets", "fonts", "Inter.ttf"), "Inter");
GlobalFonts.registerFromPath(path.join(process.cwd(), "src", "bot", "ui", "assets", "fonts", "InterSemiBold.ttf"), "InterSemiBold");
GlobalFonts.registerFromPath(path.join(process.cwd(), "src", "bot", "ui", "assets", "fonts", "InterBold.ttf"), "InterBold");

async function testRankingImage() {
	console.log("Starting ranking image test...");
	await BackgroundPatternRegistry.initialize();
	await AvatarDecorationRegistry.initialize();

	const user = new User("332228051871989761", Language.English);
	// Bypassing DB for UI testing
	user.Nickname = "Leon S Kennedy";
	user.Id = "332228051871989761";
	user.GangId = null;

	for (const bg of getBackgroundDecorationList()) {

		const builder = new UserRankingCardCanvasBuilder(
			user,
			1,
			"Cr$ 1.500.000 (150)",
			"https://64.media.tumblr.com/e4c4d8cb95b53cb810d7d0cadf1a5fa1/e4a5be77d55d027d-fe/s1280x1920/874f014800947f2327825bc8ba35026e703bf033.jpg",
		)
			.SetDecoration(bg.Id);

		console.log(`Generating image for ${bg.Description[Language.English]}...`);
		const buffer = await builder.GenerateImage();

		const filename = `test_rank_${bg.Description[Language.English]}.webp`;
		fs.writeFileSync(filename, buffer);
		console.log(`Image saved to ${filename}`);
	}
}

testRankingImage().catch(console.error);
