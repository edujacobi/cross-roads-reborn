import { User } from "@core/models/User";
import { UserImageCanvasBuilder } from "@bot/ui/builders/UserImageCanvasBuilder";
import { AvatarDecorationRegistry } from "@bot/ui/patterns/AvatarDecorationRegistry";
import { BackgroundPatternRegistry } from "@bot/ui/patterns/BackgroundPatternRegistry";
import { GlobalFonts } from "@napi-rs/canvas";
import { Language } from "@core/models/Language";
import { AvatarDecorationId } from "@core/types/Ids";
import fs from "node:fs";
import path from "node:path";

GlobalFonts.registerFromPath(path.join(process.cwd(), "src", "bot", "ui", "assets", "fonts", "Inter.ttf"), "Inter");
GlobalFonts.registerFromPath(path.join(process.cwd(), "src", "bot", "ui", "assets", "fonts", "InterSemiBold.ttf"), "InterSemiBold");
GlobalFonts.registerFromPath(path.join(process.cwd(), "src", "bot", "ui", "assets", "fonts", "InterBold.ttf"), "InterBold");

async function testAvatarImage() {
	console.log("Starting avatar image test...");
	await BackgroundPatternRegistry.initialize();
	await AvatarDecorationRegistry.initialize();

	const user = new User("332228051871989761", Language.English);
	// Bypassing DB for UI testing
	user.Nickname = "Leon S Kennedy";
	user.Id = "332228051871989761";

	const decorations = [
		AvatarDecorationId.Default,
		AvatarDecorationId.VIP,
		AvatarDecorationId.FrutigerAero,
		AvatarDecorationId.Silver,
		AvatarDecorationId.BotanicalGarden,
	];

	for (const decoId of decorations) {
		console.log(`Generating avatar for decoration ID ${decoId}...`);
		const builder = new UserImageCanvasBuilder(
			user,
			"https://64.media.tumblr.com/e4c4d8cb95b53cb810d7d0cadf1a5fa1/e4a5be77d55d027d-fe/s1280x1920/874f014800947f2327825bc8ba35026e703bf033.jpg",
		)
			.SetDecoration(decoId);

		const buffer = await builder.GenerateImage();

		const filename = `test_avatar_${decoId}.webp`;
		fs.writeFileSync(filename, buffer);
		console.log(`Image saved to ${filename}`);
	}
}

testAvatarImage().catch(console.error);
