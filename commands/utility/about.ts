import {
	ButtonBuilder, ButtonStyle,
	ChatInputCommandInteraction,
	Colors,
	ContainerBuilder,
	Locale, MediaGalleryBuilder, MediaGalleryItemBuilder, MessageFlags, SectionBuilder,
	SeparatorSpacingSize,
	SlashCommandBuilder,
	TextDisplayBuilder, ThumbnailBuilder,
} from "discord.js";
import { replyInteraction } from "../../utils/logic";
import { Language } from "../../models/Language";
import { User } from "../../models/User";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("about")
		.setDescription("Informations about Cross Roads Reborn!")
		.setNameLocalization(Locale.PortugueseBR, "sobre")
		.setDescriptionLocalization(Locale.PortugueseBR, "Informações sobre Cross Roads Reborn!"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const s = Strings[language];

		const container = new ContainerBuilder()
			.setAccentColor(Colors.Green)
			.addTextDisplayComponents(new TextDisplayBuilder()
				.setContent(`# ${s.title}`))
			.addMediaGalleryComponents(new MediaGalleryBuilder()
				.addItems(new MediaGalleryItemBuilder()
					.setURL("https://media.discordapp.net/attachments/1233604589064818808/1374807950438170675/Header_About.png?ex=682f652e&is=682e13ae&hm=c96de10ef200a0502bf105d6a00a0b182d683ba4313cbb59820990401169f3a8&=&format=webp&quality=lossless")))
			.addTextDisplayComponents(new TextDisplayBuilder()
				.setContent([
					`### ${s.direction}`,
					`Jacobi`,
				].join("\n")))
			.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large))
			.addTextDisplayComponents(new TextDisplayBuilder()
				.setContent(`### ${s.programming}`))
			.addSectionComponents(new SectionBuilder()
				.addTextDisplayComponents(new TextDisplayBuilder()
					.setContent(`Jacobi`,))
				.setButtonAccessory(new ButtonBuilder()
					.setLabel("GitHub")
					.setStyle(ButtonStyle.Link)
					.setURL("https://github.com/edujacobi/")),
			)
			.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large))
			.addSectionComponents(new SectionBuilder()
				.addTextDisplayComponents(new TextDisplayBuilder()
					.setContent([
						`### ${s.art}`,
						`Jacobi`,
						`Cesar`,
						`Miguel`,
						`Kenny`,
					].join("\n")))
				.setThumbnailAccessory(new ThumbnailBuilder()
					.setURL("https://media.discordapp.net/attachments/1233604589064818808/1378075287518187591/Artist2.png")),
			)
			.addSeparatorComponents(separator => separator.setSpacing(SeparatorSpacingSize.Large))
			.addTextDisplayComponents(new TextDisplayBuilder()
				.setContent(`-# ${s.others}: Quantum, nadalao, CassadorEterno`));

		await replyInteraction(interaction, {
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