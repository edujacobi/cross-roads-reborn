import { ChatInputCommandInteraction, Colors, Locale, SlashCommandBuilder } from "discord.js";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { checkUser, replyInteraction } from "../../utils/logic";
import { EmoteString } from "../../utils/ui";
import { Language } from "../../models/Language";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("demigods")
		.setDescription("Know more about the demigod roosters")
		.setNameLocalization(Locale.PortugueseBR, "semideuses")
		.setDescriptionLocalization(Locale.PortugueseBR, "Saiba mais sobre os galos semideuses"),

	async execute(interaction: ChatInputCommandInteraction) {
		const user = await checkUser(interaction.user.id, interaction);

		if (!user) {
			return;
		}

		const s = Strings[user.Language];

		const embed = new CustomEmbedBuilder()
			.setColor(Colors.Blue)
			.setImage("https://i.imgur.com/79XxrUH.jpeg")
			.setDescription(s.descriptionEnd)
			.addFields([
				{
					name: `${EmoteString.Caramuru} Caramuru`,
					value: s.valueCaramuru,
				},
				{
					name: `${EmoteString.Coroamuru} Coroamuru`,
					value: s.valueCoroamuru,
				},
			])
			.setDefaultFooter(interaction);

		await replyInteraction(interaction, { embeds: [embed] });
	},
};

const Strings = {
	[Language.English]: {
		descriptionEnd: `# ${EmoteString.Caramuru} Caramuru and ${EmoteString.Coroamuru} Coroamuru\nTwo brothers born at the dawn of time. The embodied Yin and Yang. Two sides of the same coin.`,
		valueCaramuru: "His name means: \"The heads side of the coin\". Caramuru is active, repelling and expansive. Represents the light and justice.",
		valueCoroamuru: "His name means: \"The tails side of the coin\". Coroamuru is retractive, passive and receptive. Represent the darkness and betrayal.",
	},
	[Language.Portuguese]: {
		descriptionEnd: `# ${EmoteString.Caramuru} Caramuru e ${EmoteString.Coroamuru} Coroamuru\nDois irmãos nascidos no alvorecer dos tempos. As encarnações de Yin e Yang. Dois lados da mesma moeda.`,
		valueCaramuru: "Seu nome significa: \"O lado cara da moeda\". Caramuru é ativo, repelidor e expansivo. Representa a luz e a justiça",
		valueCoroamuru: "Seu nome significa: \"O lado coroa da moeda\". Coroamuru é retrativo, apático and receptivo. Representa a escuridão e a traição.",
	},
	[Language.Spanish]: {
		descriptionEnd: `# ${EmoteString.Caramuru} Caramuru y ${EmoteString.Coroamuru} Coroamuru\nDos hermanos nacidos en el amanecer de los tiempos. El Yin y el Yang encarnados. Dos lados de una moneda.`,
		valueCaramuru: "Su nombre significa: \"La cara de la moneda\". Caramuru es activo, repelente y expansivo. Representa la luz y la justicia.",
		valueCoroamuru: "Su nombre significa: \"La cruz de la moneda\". Coroamuru es retractivo, apático and receptivo. Representa la oscuridad y la traición.",
	},
};
