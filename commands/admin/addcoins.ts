import {
	ChatInputCommandInteraction,
	Locale,
	MessageFlags,
	PermissionFlagsBits,
	SlashCommandBuilder,
	SlashCommandIntegerOption,
	SlashCommandStringOption,
} from "discord.js";
import { defaultComponent, formatMoney } from "../../utils/ui";
import { checkUser, replyInteraction, sendPrivateMessage } from "../../utils/logic";
import { EmoteString } from "../../utils/emotes";
import { User } from "../../models/User";
import { Language } from "../../models/Language";
import { CrColors } from "../../utils/colors";

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
				.addChoices([{
					name: "Pacotinho (2500)",
					value: 2_500,
				}, {
					name: "Pacote (5500)",
					value: 5_500,
				}, {
					name: "Pacotão (18000)",
					value: 18_000,
				}])
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

		await sendPrivateMessage(userId, messages[target.Language], CrColors.SpecialShop);

		const container = defaultComponent({
			user,
			color: CrColors.SpecialShop,
			description: `${EmoteString.SpecialCoinShop}${formatMoney(coins, Language.English, "")} Special Coins added to user **${target.GetNameWithImage()}**`,
		});

		await replyInteraction(interaction, {
			components: [container],
			flags: MessageFlags.IsComponentsV2,
		});
	},
};
