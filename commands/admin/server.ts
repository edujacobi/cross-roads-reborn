import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { replyInteraction } from "../../utils/logic";

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName("server")
		.setDescription("Provides information about the server."),

	async execute(interaction: ChatInputCommandInteraction) {
		// interaction.guild is the object representing the Guild in which the command was run
		if (!interaction.guild) {
			return;
		}
		await replyInteraction(interaction, `This server is ${interaction.guild.name} and has ${interaction.guild.memberCount} members.`);
	},
};