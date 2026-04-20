import { CrColors } from "#bot/utils/colors";
import { replyWithContainer } from "#bot/utils/discordInteractions";
import { defaultComponent, formatMoney } from "#bot/utils/ui";
import { BlackMarket } from "#core/models/BlackMarket";
import type { Language } from "#core/models/Language";
import type { User } from "#core/models/User";
import { type ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const shopCommand = require("./shop");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("blackmarket")
		.setDescription("Open the Black market to buy something")
		.setNameLocalization(Locale.PortugueseBR, "mercadonegro")
		.setNameLocalization(Locale.SpanishES, "mercadonegro")
		.setDescriptionLocalization(Locale.PortugueseBR, "Abra o Mercado negro para comprar alguma coisa")
		.setDescriptionLocalization(Locale.SpanishES, "Abrir el mercado negro para comprar artículos ilegales"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {

		const blackMarket = new BlackMarket(user);

		const { isOpen, message } = blackMarket.IsBlackMarketOpen();

		if (!isOpen) {
			const container = defaultComponent({
				user,
				color: CrColors.BlackMarket,
				description: message,
				footer: formatMoney(user.Money, language),
			});

			return replyWithContainer(interaction, container);
		}

		await shopCommand.execute(interaction, user, language, blackMarket);
	},
};
