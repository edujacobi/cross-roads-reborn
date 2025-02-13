import { ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { replyInteraction } from "../../utils/logic";
import { BlackMarket } from "../../models/BlackMarket";
import { defaultEmbed } from "../../utils/ui";
import { EmoteString } from "../../utils/emotes";
import { CrColors } from "../../utils/colors";
import { User } from "../../models/User";

module.exports = {
	vip: true,
	data: new SlashCommandBuilder()
		.setName("blackmarket")
		.setDescription("Open the Black market to buy something")
		.setNameLocalization(Locale.PortugueseBR, "mercadonegro")
		.setDescriptionLocalization(Locale.PortugueseBR, "Abra o Mercado negro para comprar alguma coisa"),

	async execute(interaction: ChatInputCommandInteraction, user: User) {

		const blackMarket = new BlackMarket(user);

		const isUserJacobi = interaction.user.id === process.env.JACOBI_ID;

		if (!blackMarket.IsBlackMarketOpen() && !isUserJacobi) {
			return await replyInteraction(interaction, {
				embeds: [defaultEmbed({
					nickname: user.Nickname,
					interaction,
					description: `${EmoteString.BlackMarket} "Hey, psst... Volte aqui às 20h de sexta-feira que eu terei umas coisinhas bem legais pra te mostrar..."`,
					color: CrColors.BlackMarket,
				})]
			});
		}

		await blackMarket.GenerateEmbed(interaction);
	},
};
