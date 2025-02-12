import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	Colors,
	Locale,
	SlashCommandBuilder,
} from "discord.js";
import { defaultEmbed } from "../../utils/ui";
import { replyInteraction } from "../../utils/logic";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("invite")
		.setDescription("Invite Battle Roosters Arena to your server!")
		.setNameLocalization(Locale.PortugueseBR, "convite")
		.setDescriptionLocalization(Locale.PortugueseBR, "Convide Battle Roosters Arena para o seu servidor!"),

	async execute(interaction: ChatInputCommandInteraction) {

		const embed = defaultEmbed({
			interaction,
			color: Colors.Red,
			thumbnail: interaction.client.user.avatarURL({ size: 512 }) ?? undefined,
			footer: "Just click the buttons below!",
			description: `## Invite\nInvite Battle Roosters Arena to your server or join the official server and challenge new players!`,
		});

		const buttonInvite = new ButtonBuilder()
			.setLabel("Add to server")
			.setStyle(ButtonStyle.Link)
			.setURL("https://discord.com/oauth2/authorize?client_id=1089602356271927356&permissions=319488&scope=applications.commands+bot");

		const buttonServer = new ButtonBuilder()
			.setLabel("Join the official server")
			.setStyle(ButtonStyle.Link)
			.setURL("https://discord.com/invite/sNf8avn");


		const row = new ActionRowBuilder<ButtonBuilder>()
			.setComponents([buttonInvite, buttonServer]);

		await replyInteraction(interaction, { embeds: [embed], components: [row] });
	},
};
