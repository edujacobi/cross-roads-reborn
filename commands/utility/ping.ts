import { ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { defaultEmbed } from "../../utils/ui";
import { replyInteraction } from "../../utils/logic";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("ping")
		.setDescription("Replies with Pong!")
		.setDescriptionLocalization(Locale.PortugueseBR, "Responde com Pong!"),

	async execute(interaction: ChatInputCommandInteraction) {

		const botPing = Math.round(interaction.client.ws.ping);
		const svPing = new Date().getTime();

		const embed = defaultEmbed({
			interaction: interaction,
			description: `:satellite_orbital: ${botPing}ms API.`,
		});

		await replyInteraction(interaction, { embeds: [embed] });

		await replyInteraction(interaction, {
			embeds: [embed.setDescription(`:satellite_orbital: ${botPing}ms API. ${Math.round(new Date().getTime() - svPing)}ms Server.`)],
		});
	},
};
