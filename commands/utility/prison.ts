import { ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { User } from "../../models/User";
import { Prison } from "../../models/Prison";

module.exports = {
	vip: true,
	data: new SlashCommandBuilder()
		.setName("prison")
		.setDescription("Visit the prison and meet the inmates")
		.setNameLocalization(Locale.PortugueseBR, "prisao")
		.setDescriptionLocalization(Locale.PortugueseBR, "Conheça a prisão e seus presidiários"),

	async execute(interaction: ChatInputCommandInteraction, user: User) {
		const prison = new Prison(user, interaction);

		return await prison.GenerateEmbed();
	},
};