import { ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { User } from "../../models/User";
import { Hospital } from "../../models/Hospital";

module.exports = {
	vip: true,
	data: new SlashCommandBuilder()
		.setName("hospital")
		.setDescription("Visit the hospital and meet the sick, broken and bedridden")
		.setNameLocalization(Locale.PortugueseBR, "hospital")
		.setDescriptionLocalization(Locale.PortugueseBR, "Visite o hospital e conheça os doentes, os quebrados e os acamados"),

	async execute(interaction: ChatInputCommandInteraction, user: User) {
		const hospital = new Hospital(user, interaction);

		return await hospital.GenerateEmbed();
	},
};