import { CrColors } from "#bot/utils/colors";
import { replyInteraction, replyWithContainer } from "#bot/utils/discordInteractions";
import { EmoteString } from "#bot/utils/emotes";
import { defaultComponent, formatMoney } from "#bot/utils/ui";
import { Gang } from "#core/models/Gang";
import { Language } from "#core/models/Language";
import type { User } from "#core/models/User";
import {
	type ChatInputCommandInteraction,
	Locale,
	PermissionFlagsBits,
	SlashCommandBuilder
} from "discord.js";

enum SetMoneyConfiguration {
	Add,
	Set,
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName("setgangmoney")
		.setDescription("Set or add money to a gang!")
		.setDescriptionLocalization(Locale.PortugueseBR, "Defina ou adicione dinheiro a uma gangue!")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addIntegerOption(option => option
			.setName("gangid")
			.setDescription("The Gang Id to modify the money")
			.setDescriptionLocalization(Locale.PortugueseBR, "O Id da Gangue para modificar o dinheiro")
			.setRequired(true),
		)
		.addIntegerOption(option => option
			.setName("money")
			.setDescription("The money amount")
			.setDescriptionLocalization(Locale.PortugueseBR, "A quantia de dinheiro")
			.setRequired(true),
		)
		.addIntegerOption(option => option
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
		const gangId = interaction.options.getInteger("gangid", true);
		const money = interaction.options.getInteger("money", true);
		const addOrSet = interaction.options.getInteger("add_or_set", true);

		const gang = await Gang.GetById(gangId);

		if (!gang) {
			return replyInteraction(interaction, "Didn't find this gang");
		}

		let description = "";

		if (addOrSet === SetMoneyConfiguration.Add) {
			gang.Money += money;
			description = `${formatMoney(money, Language.English, "")} added to ${EmoteString.Gang} Gang **${gang.Name}** (${gang.Acronym}). Total: ${formatMoney(gang.Money, Language.English, "")}`;
		}
		else {
			const oldMoney = gang.Money;
			gang.Money = money;
			description = `${EmoteString.Gang} Gang **${gang.Name}** (${gang.Acronym}) money has been set to ${formatMoney(gang.Money, Language.English, "")} (was ${formatMoney(oldMoney, Language.English, "")}).`;
		}

		const container = defaultComponent({
			user,
			color: CrColors.Admin,
			description,
		});

		await gang.Update();

		await replyWithContainer(interaction, container);
	},
};
