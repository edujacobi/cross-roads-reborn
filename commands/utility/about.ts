import {
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	Colors,
	Locale,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import { replyInteraction } from "../../utils/logic";
import { Language } from "../../models/Language";
import { User } from "../../models/User";
import { CustomContainerBuilder } from "../../ui/builders/CustomContainerBuilder";

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
			.addMediaGalleryComponents(gallery => gallery
				.addItems(image => image
					.setURL("https://media.discordapp.net/attachments/1233604589064818808/1374807950438170675/Header_About.png?ex=682f652e&is=682e13ae&hm=c96de10ef200a0502bf105d6a00a0b182d683ba4313cbb59820990401169f3a8&=&format=webp&quality=lossless"),
				),
			)
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

		return replyInteraction(interaction, {
			components: [container],
			flags: MessageFlags.IsComponentsV2,
		});
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