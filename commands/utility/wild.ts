import { ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { Wild } from "../../models/Wild";

module.exports = {
	cooldown: 3,
	data: new SlashCommandBuilder()
		.setName("wild")
		.setDescription("Start a wild adventure")
		.setNameLocalization(Locale.PortugueseBR, "selva")
		.setDescriptionLocalization(Locale.PortugueseBR, "Começa uma aventura na selva"),

	async execute(interaction: ChatInputCommandInteraction) {

		const wild = new Wild(interaction);

		if (!await wild.CanStart()) {
			return;
		}

		await wild.StartAdventure();
	},
};