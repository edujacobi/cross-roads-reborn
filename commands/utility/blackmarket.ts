import { ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { replyWithContainer } from "../../utils/logic";
import { BlackMarket } from "../../models/BlackMarket";
import { defaultComponent } from "../../utils/ui";
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
			const container = defaultComponent({
				user,
				color: CrColors.BlackMarket,
				description: message,
			});

			return replyWithContainer(interaction, container);
		}

		await blackMarket.Start(interaction);
	},
};