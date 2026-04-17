import { type ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { replyWithContainer } from "#bot/utils/discordInteractions";
import path from "node:path";
import fs from "node:fs";
import { Language, type Localization } from "#core/models/Language";
import { CrColors } from "#bot/utils/colors";
import type { User } from "#core/models/User";
import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("commands")
		.setDescription("See all the commands and their descriptions!")
		.setNameLocalization(Locale.PortugueseBR, "comandos")
		.setNameLocalization(Locale.SpanishES, "comandos")
		.setDescriptionLocalization(Locale.PortugueseBR, "Veja todos os comandos e suas descrições!")
		.setDescriptionLocalization(Locale.SpanishES, "Ver la lista de comandos disponibles"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {

		const s = Strings[language];

		const commandFiles = fs.readdirSync(__dirname).filter((file: string) => file.endsWith(".ts"));

		let text = "";
		for (const file of commandFiles) {
			const filePath = path.join(__dirname, file);
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const command = require(filePath);

			if ("data" in command && "execute" in command) {
				const commandName = command.data.name_localizations?.[interaction.locale] ?? command.data.name;
				const commandDescription = command.data.description_localizations?.[interaction.locale] ?? command.data.description;

				text += `### /${commandName}\n-# ${commandDescription}\n`;
			}
		}

		const container = new CustomContainerBuilder()
			.setUser(user)
			.setAccentColor(CrColors.Default)
			.addSectionComponents(section => section
				.addTexts([
					`# ${s.title}`,
					text,
				])
				.setThumbnailAccessory(thumb => thumb
					.setURL(interaction.client.user.avatarURL({ size: 512 }) ?? ""),
				),
			)
			.addFooter({
				text: interaction.locale,
			});

		return replyWithContainer(interaction, container);
	},
};

const Strings = {
	[Language.English]: {
		title: "Commands",
	},

	[Language.Portuguese]: {
		title: "Comandos",
	},

	[Language.Spanish]: {
		title: "Comandos",
	},
} as const satisfies Localization;