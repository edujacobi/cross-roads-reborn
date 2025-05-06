import { ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { replyInteraction } from "../../utils/logic";
import { BlackMarket } from "../../models/BlackMarket";
import { defaultEmbed } from "../../utils/ui";
import { EmoteString } from "../../utils/emotes";
import { CrColors } from "../../utils/colors";
import { User } from "../../models/User";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("blackmarket")
		.setDescription("Open the Black market to buy something")
		.setNameLocalization(Locale.PortugueseBR, "mercadonegro")
		.setDescriptionLocalization(Locale.PortugueseBR, "Abra o Mercado negro para comprar alguma coisa"),

	async execute(interaction: ChatInputCommandInteraction, user: User) {

		const blackMarket = new BlackMarket(user);

		const { isOpen, message } = blackMarket.IsBlackMarketOpen();

		if (!isOpen) {
			return await replyInteraction(interaction, {
				embeds: [defaultEmbed({
					nickname: user.Nickname,
					interaction,
					description: `${EmoteString.BlackMarket} _"${message}"_`,
					color: CrColors.BlackMarket,
				})],
			});
		}

		await blackMarket.Start(interaction);
	},
};