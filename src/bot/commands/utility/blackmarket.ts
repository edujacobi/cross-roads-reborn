import { ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { replyWithContainer } from "@bot/utils/logic";
import { BlackMarket } from "@core/models/BlackMarket";
import { defaultComponent } from "@bot/utils/ui";
import { CrColors } from "@bot/utils/colors";
import { User } from "@core/models/User";
import { Language } from "@core/models/Language";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const shopCommand = require("./shop");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("blackmarket")
		.setDescription("Open the Black market to buy something")
		.setNameLocalization(Locale.PortugueseBR, "mercadonegro")
		.setDescriptionLocalization(Locale.PortugueseBR, "Abra o Mercado negro para comprar alguma coisa"),

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
