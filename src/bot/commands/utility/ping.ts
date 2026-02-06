import { ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { defaultComponent } from "@bot/utils/ui";
import { replyWithContainer } from "@bot/utils/discordInteractions";
import { User } from "@core/models/User";

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

		await replyWithContainer(interaction, container);

		container.changeTextFromSectionId(1, `:satellite_orbital: ${botPing}ms API. ${Math.round(new Date().getTime() - svPing)}ms Server.`);

		return replyWithContainer(interaction, container);
	},
};
