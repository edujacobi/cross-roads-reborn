import { ChatInputCommandInteraction, Colors, Locale, SlashCommandBuilder } from "discord.js";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { checkUser, replyInteraction } from "../../utils/logic";
import { Language } from "../../models/Language";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("about")
		.setDescription("Informations about Battle Roosters Arena!")
		.setNameLocalization(Locale.PortugueseBR, "sobre")
		.setDescriptionLocalization(Locale.PortugueseBR, "Informações sobre Battle Roosters Arena!"),

	async execute(interaction: ChatInputCommandInteraction) {

		const user = await checkUser(interaction.user.id, interaction);

		if (!user) {
			return;
		}

		const s = Strings[user.Language];

		const embed = new CustomEmbedBuilder()
			.setTitle(s.title)
			.setColor(Colors.Green)
			.setDescription(`# ${s.credits}
### ${s.direction}
Jacobi
### ${s.programming}
Jacobi
Bode de Bigode
### ${s.art}
Jacobi
Cesar
Miguel

-# ${s.disclaimer}`)
			.setDefaultFooter(interaction);

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