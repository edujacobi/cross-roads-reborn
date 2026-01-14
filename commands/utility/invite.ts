import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	Locale,
	SlashCommandBuilder,
} from "discord.js";
import { defaultComponent } from "../../utils/ui";
import { replyWithContainer } from "../../utils/logic";
import { CrColors } from "../../utils/colors";
import { User } from "../../models/User";
import { Language } from "../../models/Language";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("invite")
		.setDescription("Invite Cross Roads Reborn to your server!")
		.setNameLocalization(Locale.PortugueseBR, "convite")
		.setDescriptionLocalization(Locale.PortugueseBR, "Convide Cross Roads Reborn para o seu servidor!"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {

		const s = Strings[language];

		const buttonInvite = new ButtonBuilder()
			.setLabel(s.addTo)
			.setStyle(ButtonStyle.Link)
			.setURL(`https://discord.com/oauth2/authorize?client_id=${interaction.client.user.id}&permissions=319488&scope=applications.commands+bot`);

		const buttonServer = new ButtonBuilder()
			.setLabel(s.join)
			.setStyle(ButtonStyle.Link)
			.setURL("https://discord.com/invite/sNf8avn");

		const row = new ActionRowBuilder<ButtonBuilder>()
			.setComponents([buttonInvite, buttonServer]);

		const container = defaultComponent({
			user,
			color: CrColors.Default,
			thumbnail: interaction.client.user.avatarURL({ size: 512 }) ?? undefined,
			footer: s.footer,
			description: s.description,
			buttons: row,
		});

		return replyWithContainer(interaction, container);
	},
};

const Strings = {
	[Language.English]: {
		footer: "Just click the buttons below!",
		description: `# Invite\nInvite Cross Roads Reborn to your server or join the official server and challenge new players!`,
		addTo: "Add to server",
		join: "Join the official server",
	},
	[Language.Portuguese]: {
		footer: "Apenas clique nos botões abaixo!",
		description: "# Convite\nConvide Cross Roads Reborn para o seu servidor ou junte-se ao servidor oficial e desafie novos jogadores!",
		addTo: "Adicionar ao servidor",
		join: "Junte-se ao servidor oficial",
	},
	[Language.Spanish]: {
		footer: "¡Simplemente haz clic en los botones de abajo!",
		description: "# Invitación\n¡Invita a Cross Roads Reborn a tu servidor o únete al servidor oficial y desafía a nuevos jugadores!",
		addTo: "Añadir al servidor",
		join: "Únete al servidor oficial",
	},
} as const;