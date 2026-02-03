import {
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	Colors,
	Locale,
	SlashCommandBuilder,
} from "discord.js";
import { replyWithContainer } from "@bot/utils/logic";
import { Language } from "@core/models/Language";
import { User } from "@core/models/User";
import { CustomContainerBuilder } from "@bot/ui/builders/CustomContainerBuilder";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("about")
		.setDescription("Informations about Cross Roads Reborn!")
		.setNameLocalization(Locale.PortugueseBR, "sobre")
		.setDescriptionLocalization(Locale.PortugueseBR, "Informações sobre Cross Roads Reborn!"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const s = Strings[language];

		const container = new CustomContainerBuilder()
			.setAccentColor(Colors.Green)
			.addTexts([
				`# ${s.title}`,
			])
			.addImage("https://media.discordapp.net/attachments/1233604589064818808/1374807950438170675/Header_About.png")
			.addTexts([
				`### ${s.direction}`,
				`Jacobi`,
			])
			.addLargeSeparator()
			.addTexts([
				`### ${s.programming}`,
			])
			.addSectionComponents(section => section
				.addTexts([
					`Jacobi`,
				])
				.setButtonAccessory(new ButtonBuilder()
					.setLabel("GitHub")
					.setStyle(ButtonStyle.Link)
					.setURL("https://github.com/edujacobi/")),
			)
			.addLargeSeparator()
			.addSectionComponents(section => section
				.addTexts([
					`### ${s.art}`,
					`Jacobi`,
					`Miguel`,
					`Cesar`,
					`Kenny`,
				])
				.setThumbnailAccessory(thumb => thumb
					.setURL("https://media.discordapp.net/attachments/1233604589064818808/1378075287518187591/Artist2.png"),
				),
			)
			.addLargeSeparator()
			.addTexts([
				`-# ${s.others}: Quantum, nadalao, CassadorEterno`,
			]);

		return replyWithContainer(interaction, container);
	},
};

const Strings = {
	[Language.English]: {
		title: "About",
		credits: "Credits",
		direction: "Direction",
		programming: "Programming",
		art: "Art",
		others: "Others",
	},

	[Language.Portuguese]: {
		title: "Sobre",
		credits: "Créditos",
		direction: "Direção",
		programming: "Programação",
		art: "Arte",
		others: "Outros",
	},

	[Language.Spanish]: {
		title: "Acerca de",
		credits: "Créditos",
		direction: "Dirección",
		programming: "Programación",
		art: "Arte",
		others: "Otros",
	},
} as const;