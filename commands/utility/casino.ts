import { ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { User } from "../../models/User";
import { Casino } from "../../models/Casino";

module.exports = {
	vip: true,
	data: new SlashCommandBuilder()
		.setName("casino")
		.setDescription("Check the casino games")
		.setNameLocalization(Locale.PortugueseBR, "cassino")
		.setDescriptionLocalization(Locale.PortugueseBR, "Conheça os jogos do cassino"),

	async execute(interaction: ChatInputCommandInteraction, user: User) {

		const casino = new Casino(user);

		await casino.Start(interaction);
	},
};