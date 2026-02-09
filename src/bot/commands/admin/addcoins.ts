import {
	ChatInputCommandInteraction,
	Locale,
	PermissionFlagsBits,
	SlashCommandBuilder,
	SlashCommandIntegerOption,
	SlashCommandStringOption,
} from "discord.js";
import { defaultComponent, formatMoney } from "@bot/utils/ui";
import { replyWithContainer, sendPrivateMessage } from "@bot/utils/discordInteractions";
import { EmoteString } from "@bot/utils/emotes";
import { User } from "@core/models/User";
import { Language } from "@core/models/Language";
import { CrColors } from "@bot/utils/colors";
import { checkUser } from "@bot/utils/userUtils";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("addcoins")
		.setDescription("Add Special Coins to an user!")
		.setDescriptionLocalization(Locale.PortugueseBR, "Adicione Moedas Especiais para um usuário!")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption((option: SlashCommandStringOption) =>
			option
				.setName("userid")
				.setDescription("The userId who will receive the coins")
				.setDescriptionLocalization(Locale.PortugueseBR, "O ID do usuário que vai receber as moedas")
				.setRequired(true),
		)
		.addIntegerOption((option: SlashCommandIntegerOption) =>
			option
				.setName("coins")
				.setDescription("How many coins to add")
				.setDescriptionLocalization(Locale.PortugueseBR, "Quantas moedas adicionar")
				.setRequired(true),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User) {

		const userId = interaction.options.getString("userid", true);
		const coins = interaction.options.getInteger("coins", true);

		const target = await checkUser(userId, interaction);

		if (!target) {
			return;
		}

		await target.AddSpecialCoin(coins);

		const messages = {
			[Language.English]: `You received ${EmoteString.SpecialCoinShop}${formatMoney(coins, Language.English, "")} Special Coins!`,
			[Language.Portuguese]: `Você recebeu ${EmoteString.SpecialCoinShop}${formatMoney(coins, Language.Portuguese, "")} Moedas Especiais!`,
			[Language.Spanish]: `Has recibido ${EmoteString.SpecialCoinShop}${formatMoney(coins, Language.Spanish, "")} Monedas Especiales!`,
		} as const;

		const hiddenMessages = {
			[Language.English]: `You received 💠${formatMoney(coins, Language.English, "")} Special Coins!`,
			[Language.Portuguese]: `Você recebeu 💠${formatMoney(coins, Language.Portuguese, "")} Moedas Especiais!`,
			[Language.Spanish]: `Has recibido 💠${formatMoney(coins, Language.Spanish, "")} Monedas Especiales!`,
		} as const;

		await sendPrivateMessage({
			userId,
			message: messages[target.Language],
			notificationMessage: hiddenMessages[target.Language],
			color: CrColors.SpecialShop,
		});

		const container = defaultComponent({
			user,
			color: CrColors.SpecialShop,
			description: `${EmoteString.SpecialCoinShop}${formatMoney(coins, Language.English, "")} Special Coins added to user **${target.GetNameWithImage()}**`,
		});

		return replyWithContainer(interaction, container);
	},
};
