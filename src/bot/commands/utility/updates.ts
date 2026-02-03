import {
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	Locale,
	NewsChannel,
	SlashCommandBuilder,
} from "discord.js";
import { deferReply, replyInteraction, replyWithContainer } from "@bot/utils/discordInteractions";
import { User } from "@core/models/User";
import { CustomContainerBuilder } from "@bot/ui/builders/CustomContainerBuilder";
import { EmoteBadgeString } from "@bot/utils/badges";
import { Language, Localization } from "@core/models/Language";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("updates")
		.setDescription("Latest updates from Cross Roads!")
		.setNameLocalization(Locale.PortugueseBR, "atualizações")
		.setDescriptionLocalization(Locale.PortugueseBR, "Últimas atualizações do Cross Roads!")
		.setNameLocalization(Locale.SpanishES, "actualizaciones")
		.setDescriptionLocalization(Locale.SpanishES, "¡Últimas actualizaciones de Cross Roads!")
	,

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		await deferReply(interaction);

		const server = interaction.client.guilds.cache.get("529674666692837378");
		if (!server) {
			return replyInteraction(interaction, Strings[language].errorServer);
		}

		const channel = server.channels.cache.get("529676748422512661") as NewsChannel;
		if (!channel) {
			return replyInteraction(interaction, Strings[language].errorChannel);
		}

		const container = new CustomContainerBuilder()
			.addTexts([
				`# ${EmoteBadgeString.General.Developer} ${Strings[language].title}`,
			])
			.addLargeSeparator()
			.addTexts([
				Strings[language].description,
				String(channel),
			])
			.addFooter({
				text: `${interaction.client.user.username} • ${Strings[language].footer}`,
				button: new ButtonBuilder()
					.setStyle(ButtonStyle.Link)
					.setLabel(Strings[language].buttonLabel)
					.setURL("https://discord.com/invite/sNf8avn"),
			});

		await replyWithContainer(interaction, container);

	},
};

const Strings = {
	[Language.English]: {
		errorServer: "Error retrieving server",
		errorChannel: "Error retrieving updates channel",
		title: "Updates",
		description: "To follow the updates, check the specific channel on the official server:",
		footer: "If you can't access it, join the server!",
		buttonLabel: "Join official server",
	},
	[Language.Portuguese]: {
		errorServer: "Erro ao recuperar o servidor",
		errorChannel: "Erro ao recuperar o canal de atualizações",
		title: "Atualizações",
		description: "Para acompanhar as atualizações, veja o canal específico, no servidor oficial:",
		footer: "Caso não consiga acessar, entre no servidor!",
		buttonLabel: "Entrar no servidor oficial",
	},
	[Language.Spanish]: {
		errorServer: "Error al recuperar el servidor",
		errorChannel: "Error al recuperar el canal de actualizaciones",
		title: "Actualizaciones",
		description: "Para seguir las actualizaciones, consulta el canal específico en el servidor oficial:",
		footer: "Si no puedes acceder, ¡únete al servidor!",
		buttonLabel: "Unirse al servidor oficial",
	},
} as const satisfies Localization;
