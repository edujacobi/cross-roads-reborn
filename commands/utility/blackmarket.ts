import { ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { replyInteraction } from "../../utils/logic";
import { BlackMarket } from "../../models/BlackMarket";
import { defaultEmbed } from "../../utils/ui";
import { EmoteString } from "../../utils/emotes";
import { CrColors } from "../../utils/colors";
import { User } from "../../models/User";
import { Language } from "../../models/Language";

module.exports = {
	vip: true,
	data: new SlashCommandBuilder()
		.setName("blackmarket")
		.setDescription("Open the Black market to buy something")
		.setNameLocalization(Locale.PortugueseBR, "mercadonegro")
		.setDescriptionLocalization(Locale.PortugueseBR, "Abra o Mercado negro para comprar alguma coisa"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {

		const blackMarket = new BlackMarket(user);

		const isUserJacobi = interaction.user.id === process.env.JACOBI_ID;

		const s = Strings[language];

		if (!blackMarket.IsBlackMarketOpen() && !isUserJacobi) {
			return await replyInteraction(interaction, {
				embeds: [defaultEmbed({
					nickname: user.Nickname,
					interaction,
					description: `${EmoteString.BlackMarket} _"${s.hey}"_`,
					color: CrColors.BlackMarket,
				})],
			});
		}

		await blackMarket.Start(interaction);
	},
};

const Strings = {
	[Language.English]: {
		hey: "Hey, psst... Come back here at 8 PM on Friday and I will have some cool stuff to show you...",
	},
	[Language.Portuguese]: {
		hey: "Hey, psst... Volte aqui às 20h de sexta-feira que eu terei umas coisinhas bem legais pra te mostrar...",
	},
	[Language.Spanish]: {
		hey: "Oye, psst... Vuelve aquí a las 8 PM del viernes y tendré algunas cosas geniales para mostrarte...",
	},
} as const;