import {
	ChatInputCommandInteraction,
	Locale,
	PermissionFlagsBits,
	SlashCommandBuilder,
	SlashCommandIntegerOption,
	SlashCommandStringOption,
} from "discord.js";
import { defaultComponent, formatMoney } from "@bot/utils/ui";
import { replyInteraction, replyWithContainer, sendPrivateMessage } from "@bot/utils/discordInteractions";
import { User } from "@core/models/User";
import { CrColors } from "@bot/utils/colors";
import { checkUser } from "@bot/utils/userUtils";

enum SetMoneyConfiguration {
	Add,
	Set,
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName("setmoney")
		.setDescription("Set money to an user!")
		.setDescriptionLocalization(Locale.PortugueseBR, "Adicione dinheiro para um usuário!")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption((option: SlashCommandStringOption) =>
			option
				.setName("userid")
				.setDescription("The userId who will receive the money")
				.setDescriptionLocalization(Locale.PortugueseBR, "O ID do usuário que vai receber o dinheiro")
				.setRequired(true),
		)
		.addIntegerOption((option: SlashCommandIntegerOption) =>
			option
				.setName("money")
				.setDescription("How many money")
				.setDescriptionLocalization(Locale.PortugueseBR, "Quanto de dinheiro")
				.setRequired(true),
		)
		.addIntegerOption((option: SlashCommandIntegerOption) =>
			option
				.setName("add_or_set")
				.setDescription("Add or Set the money")
				.setDescriptionLocalization(Locale.PortugueseBR, "Adicionar ou definir o dinheiro")
				.setRequired(true)
				.addChoices([
					{
						name: "Add",
						value: SetMoneyConfiguration.Add,
					},
					{
						name: "Set",
						value: SetMoneyConfiguration.Set,
					},
				]),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User) {

		const userId = interaction.options.getString("userid", true);
		const money = interaction.options.getInteger("money", true);
		const addOrSet = interaction.options.getInteger("add_or_set", true);

		const target = await checkUser(userId, interaction);

		if (!target) {
			return replyInteraction(interaction, "Didn't find this user");
		}

		let description = "";

		if (addOrSet === SetMoneyConfiguration.Add) {
			target.Money += money;
			await sendPrivateMessage(userId, `You received ${formatMoney(money, user.Language)}.`, CrColors.Admin);
			description = `${formatMoney(money, user.Language)} added to user **${target.GetNameWithImage()}**`;

		}
		else {
			target.Money = money;
			await sendPrivateMessage(userId, `Your money is now ${formatMoney(money, user.Language)}.`, CrColors.Admin);
			description = `User **${target.GetNameWithImage()}** now has ${formatMoney(money, user.Language)}`;
		}

		const container = defaultComponent({
			user,
			color: CrColors.Admin,
			description,
		});

		await target.Update({
			money: target.Money,
		});

		await replyWithContainer(interaction, container);
	},
};
