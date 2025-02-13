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

	async execute(interaction: ChatInputCommandInteraction, user: User) {
		const s = Strings[user.Language];

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

-# ${s.disclaimer}`)
			.setDefaultFooter(user.Nickname, interaction.user.avatarURL());

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
		disclaimer: "Some images were made using Image Creator from Microsoft Designer (Bing).",
	},

	[Language.Portuguese]: {
		title: "Sobre",
		credits: "Créditos",
		direction: "Direção",
		programming: "Programação",
		art: "Arte",
		disclaimer: "Algumas imagens foram criadas utilizando o Image Creator do Microsoft Designer (Bing).",
	},

	[Language.Spanish]: {
		title: "Acerca de",
		credits: "Créditos",
		direction: "Dirección",
		programming: "Programación",
		art: "Arte",
		disclaimer: "Algunas imágenes se crearon utilizando Image Creator de Microsoft Designer (Bing).",
	},
} as const;