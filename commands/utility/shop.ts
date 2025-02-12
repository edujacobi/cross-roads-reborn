import { ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { checkUser } from "../../utils/logic";
import { Shop } from "../../models/Shop";

module.exports = {
	vip: true,
	data: new SlashCommandBuilder()
		.setName("shop")
		.setDescription("Open the shop to buy something")
		.setNameLocalization(Locale.PortugueseBR, "loja")
		.setDescriptionLocalization(Locale.PortugueseBR, "Abra a loja para comprar alguma coisa"),

	async execute(interaction: ChatInputCommandInteraction) {
		const user = await checkUser(interaction.user.id, interaction);

		if (!user) {
			return;
		}

		const shop = new Shop(user);

		await shop.GenerateEmbed(interaction);

	},
};
