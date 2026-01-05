import { ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { User } from "../../models/User";
import { Scavenge } from "../../models/Scavenge";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("scavenge")
		.setDescription("Many things to find in the most unexpected places")
		.setNameLocalization(Locale.PortugueseBR, "vasculhar")
		.setDescriptionLocalization(Locale.PortugueseBR, "Muitas coisas para encontrar nos lugares mais inesperados"),

	async execute(interaction: ChatInputCommandInteraction, user: User) {
		const scavenge = new Scavenge(user, interaction);

		return await scavenge.GenerateContainer();
	},
};