import { ChatInputCommandInteraction, Locale, MessageFlags, SlashCommandBuilder } from "discord.js";
import { defaultComponent } from "../../utils/ui";
import { replyInteraction } from "../../utils/logic";
import { User } from "../../models/User";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("ping")
		.setDescription("Replies with Pong!")
		.setDescriptionLocalization(Locale.PortugueseBR, "Responde com Pong!"),

	async execute(interaction: ChatInputCommandInteraction, user: User) {

		const botPing = Math.round(interaction.client.ws.ping);
		const svPing = new Date().getTime();

		const container = defaultComponent({
			user,
			description: `:satellite_orbital: ${botPing}ms API.`,
		});

		await replyInteraction(interaction, {
			components: [container],
			flags: MessageFlags.IsComponentsV2,
		});

		container.changeTextFromSectionId(1, `:satellite_orbital: ${botPing}ms API. ${Math.round(new Date().getTime() - svPing)}ms Server.`);

		await replyInteraction(interaction, {
			components: [container],
			flags: MessageFlags.IsComponentsV2,
		});
	},
};
