import { type ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { replyWithContainer } from "#bot/utils/discordInteractions";
import { BlackMarket } from "#core/models/BlackMarket";
import { defaultComponent } from "#bot/utils/ui";
import { CrColors } from "#bot/utils/colors";
import type { User } from "#core/models/User";
import type { Language } from "#core/models/Language";
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
			});

			return replyWithContainer(interaction, container);
		}

		await shopCommand.execute(interaction, user, language, blackMarket);
	},
};
