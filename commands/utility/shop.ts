import { ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { Shop } from "../../models/Shop";
import { User } from "../../models/User";

module.exports = {
	vip: true,
	data: new SlashCommandBuilder()
		.setName("shop")
		.setDescription("Open the shop to buy something")
		.setNameLocalization(Locale.PortugueseBR, "loja")
		.setDescriptionLocalization(Locale.PortugueseBR, "Abra a loja para comprar alguma coisa"),

	async execute(interaction: ChatInputCommandInteraction, user: User) {
		const shop = new Shop(user);

		await shop.GenerateEmbed(interaction);

	},
};
