import { type ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import type { User } from "#core/models/User";
import { HorseRacing } from "#core/models/HorseRacing";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("horserace")
		.setDescription("View and bet on horse races")
		.setNameLocalization(Locale.PortugueseBR, "corridadecavalos")
		.setNameLocalization(Locale.SpanishES, "carreradecaballos")
		.setDescriptionLocalization(Locale.PortugueseBR, "Veja e aposte em corridas de cavalos")
		.setDescriptionLocalization(Locale.SpanishES, "Ver y apostar en carreras de caballos"),

	async execute(interaction: ChatInputCommandInteraction, user: User) {
		// Initialize horse racing for this user
		const horseRacing = new HorseRacing(user);

		// Show race information and betting options
		await horseRacing.ShowNextRace(interaction);
	},
};
