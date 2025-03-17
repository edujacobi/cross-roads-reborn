import {
	ChatInputCommandInteraction,
	Colors,
	Locale,
	SlashCommandBuilder,
	SlashCommandIntegerOption,
} from "discord.js";
import { replyInteraction } from "../../utils/logic";
import { defaultEmbed } from "../../utils/ui";
import { User } from "../../models/User";
import { Language } from "../../models/Language";
import { ClassId, ClassList } from "../../models/Class";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("setclass")
		.setNameLocalization(Locale.PortugueseBR, "mudaclasse")
		.setDescription("Set a class for you")
		.setDescriptionLocalization(Locale.PortugueseBR, "Muda a sua classe")
		.addIntegerOption((option: SlashCommandIntegerOption) =>
			option
				.setName("class")
				.setDescription("Which class")
				.setNameLocalization(Locale.PortugueseBR, "classe")
				.setDescriptionLocalization(Locale.PortugueseBR, "Qual classe")
				.setRequired(true)
				.addChoices([
					{
						name: ClassList[ClassId.Thief].Description[Language.English],
						value: ClassId.Thief,
						name_localizations: {
							[Locale.PortugueseBR]: ClassList[ClassId.Thief].Description[Language.Portuguese]
						}
					},
					{
						name: ClassList[ClassId.Assassin].Description[Language.English],
						value: ClassId.Assassin,
						name_localizations: {
							[Locale.PortugueseBR]: ClassList[ClassId.Assassin].Description[Language.Portuguese]
						}
					},
					{
						name: ClassList[ClassId.Entrepreneur].Description[Language.English],
						value: ClassId.Entrepreneur,
						name_localizations: {
							[Locale.PortugueseBR]: ClassList[ClassId.Entrepreneur].Description[Language.Portuguese]
						}
					},
					{
						name: ClassList[ClassId.Hobo].Description[Language.English],
						value: ClassId.Hobo,
						name_localizations: {
							[Locale.PortugueseBR]: ClassList[ClassId.Hobo].Description[Language.Portuguese]
						}
					},
					{
						name: ClassList[ClassId.Mafioso].Description[Language.English],
						value: ClassId.Mafioso,
						name_localizations: {
							[Locale.PortugueseBR]: ClassList[ClassId.Mafioso].Description[Language.Portuguese]
						}
					},
					{
						name: ClassList[ClassId.Attorney].Description[Language.English],
						value: ClassId.Attorney,
						name_localizations: {
							[Locale.PortugueseBR]: ClassList[ClassId.Attorney].Description[Language.Portuguese]
						}
					},
				]),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const newClass = interaction.options.getInteger("class", true) as ClassId;

		const s = Strings[language];

		const oldClass = user.Class;

		await user.SetClass(newClass);

		const description = s.classChanged(user.Nickname, oldClass, newClass);

		const embed = defaultEmbed({
			nickname: user.Nickname,
			interaction,
			thumbnail: interaction.user.avatarURL() ?? undefined,
			color: Colors.Green,
			description,
		});

		await replyInteraction(interaction, { embeds: [embed] });
	},
};

const Strings = {
	[Language.English]: {
		setting: "Setting class",
		classChanged: (nickname: string, oldClass: ClassId, newClass: ClassId) => `**${nickname}** now has the class ${ClassList[oldClass].Image.Emote.String} → ${ClassList[newClass].Image.Emote.String} **${ClassList[newClass].Description[Language.English]}**!`,
	},
	[Language.Portuguese]: {
		setting: "Configurando classe",
		classChanged: (nickname: string, oldClass: ClassId, newClass: ClassId) => `**${nickname}** agora possui a classe ${ClassList[oldClass].Image.Emote.String} → ${ClassList[newClass].Image.Emote.String} **${ClassList[newClass].Description[Language.Portuguese]}**!`,
	},
	[Language.Spanish]: {
		setting: "Configurando clase",
		classChanged: (nickname: string, oldClass: ClassId, newClass: ClassId) => `**${nickname}** ahora tiene la clase ${ClassList[oldClass].Image.Emote.String} → ${ClassList[newClass].Image.Emote.String} **${ClassList[newClass].Description[Language.Spanish]}**!`,
	},
} as const;