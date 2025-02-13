import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	Locale,
	SlashCommandBuilder,
} from "discord.js";
import { defaultEmbed } from "../../utils/ui";
import { replyInteraction } from "../../utils/logic";
import { CrColors } from "../../utils/colors";
import { User } from "../../models/User";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("invite")
		.setDescription("Invite Cross Roads Reborn to your server!")
		.setNameLocalization(Locale.PortugueseBR, "convite")
		.setDescriptionLocalization(Locale.PortugueseBR, "Convide Cross Roads Reborn para o seu servidor!"),

	async execute(interaction: ChatInputCommandInteraction, user: User) {

		const embed = defaultEmbed({
			nickname: user.Nickname,
			interaction,
			color: CrColors.Default,
			thumbnail: interaction.client.user.avatarURL({ size: 512 }) ?? undefined,
			footer: "Just click the buttons below!",
			description: `## Invite\nInvite Cross Roads Reborn to your server or join the official server and challenge new players!`,
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
