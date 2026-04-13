/* eslint-disable @typescript-eslint/no-explicit-any */
import { GlobalFonts } from "@napi-rs/canvas";
import fs from "node:fs";
import path from "node:path";
import { InventoryCanvasBuilder } from "./src/bot/ui/builders/InventoryCanvasBuilder";
import { AvatarDecorationRegistry } from "./src/bot/ui/patterns/AvatarDecorationRegistry";
import { Language } from "./src/core/models/Language";
import { SituationId, User } from "./src/core/models/User";
import { BadgeId } from "./src/core/types/Badges";
import { ClassId } from "./src/core/types/Classes";
import { ItemId } from "./src/core/types/Ids";
import { InvestmentId } from "./src/core/types/Investments";

// Register fonts
GlobalFonts.registerFromPath(path.join(process.cwd(), "src", "bot", "ui", "assets", "fonts", "Inter.ttf"), "Inter");
GlobalFonts.registerFromPath(path.join(process.cwd(), "src", "bot", "ui", "assets", "fonts", "InterSemiBold.ttf"), "InterSemiBold");
GlobalFonts.registerFromPath(path.join(process.cwd(), "src", "bot", "ui", "assets", "fonts", "InterBold.ttf"), "InterBold");

async function testInventory() {
	console.log("Starting inventory test with footer variations...");
	await AvatarDecorationRegistry.initialize();

	const userId = "332228051871989761";

	const userBase = new User(userId, Language.Portuguese);
	userBase.Nickname = "Jacobi";
	userBase.Money = 50_000;
	userBase.Class = ClassId.Entrepreneur;
	userBase.Attributes = { Attack: 70, Defense: 45 } as any;
	userBase.Situation = {
		Id: SituationId.Hospital,
		Simple: "Hospitalizado",
		ComplexUI: "Hospitalizado",
		EmoteId: "Hospital"
	} as any;
	userBase.Items = [{
		ItemId: ItemId.Knife,
		Description: { [Language.Portuguese]: "Faca" },
		Quantity: 10,
		RemainingTime: new Date(Date.now() + 1_000 * 60 * 60 * 24 * 7)
	} as any];
	userBase.Investment = {
		Id: InvestmentId.ChurrosCart,
		ExpiresAt: new Date(Date.now() + 1_000 * 60 * 60 * 24 * 7)
	} as any;

	const badges = [
		{ BadgeId: BadgeId.Developer },
		{ BadgeId: BadgeId.VIP },
	] as any;


	const mockDiscordUser = {
		displayAvatarURL: () => "https://64.media.tumblr.com/e4c4d8cb95b53cb810d7d0cadf1a5fa1/e4a5be77d55d027d-fe/s1280x1920/874f014800947f2327825bc8ba35026e703bf033.jpg"
	} as any;

	const mockGang = {
		Id: 1,
		Name: "Os Pamonhas",
		Color: 4,
		Level: 15,
		Image: "https://i.imgur.com/xOUjOlZ.png",
		Members: [{ UserId: userId, RoleName: "Líder" }]
	} as any;

	const testCases = [
		{ name: "none_closed", full: false, gang: null, isOnline: false },
		{ name: "gang_only_closed", full: false, gang: mockGang, isOnline: false },
		{ name: "inv_only_closed", full: false, gang: null, isOnline: false },
		{ name: "both_closed", full: false, gang: mockGang, isOnline: false },
		{ name: "both_open", full: true, gang: mockGang, isOnline: true },
		{ name: "gang_only_open", full: true, gang: mockGang, isOnline: true },
		{ name: "inv_only_open", full: true, gang: null, isOnline: true }
	];

	for (const tc of testCases) {
		console.log(`Generating ${tc.name}...`);
		const builder = new InventoryCanvasBuilder({
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
		fs.writeFileSync(`test_inventory_${tc.name}.webp`, buffer);
		console.log(`Saved test_inventory_${tc.name}.webp`);
	}
}

testInventory().catch(console.error);
