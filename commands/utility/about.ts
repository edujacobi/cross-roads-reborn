import { ChatInputCommandInteraction, Colors, Locale, SlashCommandBuilder } from "discord.js";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
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

		const embed = new CustomEmbedBuilder()
			.setTitle(s.title)
			.setColor(Colors.Green)
			.setDescription(`# ${s.credits}
### ${s.direction}
Jacobi
### ${s.programming}
Jacobi
### ${s.art}
Jacobi
Cesar
Miguel
Kenny

-# ${s.others}: Quantum, nadalao, CassadorEterno`)
			.setUserFooter({
				nickname: user.Nickname,
				image: interaction.user.avatarURL(),
			});

		await replyInteraction(interaction, { embeds: [embed] });
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