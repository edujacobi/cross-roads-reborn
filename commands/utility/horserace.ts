import { ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { User } from "../../models/User";
import { HorseRacing } from "../../models/HorseRacing";

module.exports = {
	vip: true,
	data: new SlashCommandBuilder()
		.setName("horserace")
		.setDescription("View and bet on horse races")
		.setNameLocalization(Locale.PortugueseBR, "corridadecavalos")
		.setDescriptionLocalization(Locale.PortugueseBR, "Veja e aposte em corridas de cavalos"),

	async execute(interaction: ChatInputCommandInteraction, user: User) {
		// Initialize horse racing for this user
		const horseRacing = new HorseRacing(user);

		// Show race information and betting options
		await horseRacing.ShowNextRace(interaction);
	},
};
