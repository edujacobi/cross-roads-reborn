import { ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { replyInteraction } from "../../utils/logic";
import path from "node:path";
import fs from "node:fs";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { Language } from "../../models/Language";
import { CrColors } from "../../utils/colors";
import { User } from "../../models/User";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("commands")
		.setDescription("See all the commands and their descriptions!")
		.setNameLocalization(Locale.PortugueseBR, "comandos")
		.setDescriptionLocalization(Locale.PortugueseBR, "Veja todos os comandos e suas descrições!"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {

		const s = Strings[language];

		const commandFiles = fs.readdirSync(__dirname).filter((file: string) => file.endsWith(".js"));

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

		const embed = new CustomEmbedBuilder()
			.setColor(CrColors.Default)
			.setTitle(s.title)
			.setThumbnail(interaction.client.user.avatarURL({ size: 512 }))
			.setDescription(text)
			.setUserFooter({
				nickname: user.Nickname,
				image: interaction.user.avatarURL(),
				text: interaction.locale
			});

		await replyInteraction(interaction, {
			embeds: [embed],
		});
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
} as const;