import { ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { replyInteraction } from "../../utils/logic";
import { defaultEmbed, formatMoney, showTime } from "../../utils/ui";
import { addDays } from "date-fns";
import { Language } from "../../models/Language";
import { CrColors } from "../../utils/colors";
import { User } from "../../models/User";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("daily")
		.setDescription("Receives a small ammount of money. Keep a streak and the money grows!")
		.setDescriptionLocalization(Locale.PortugueseBR, "Recebe uma pequena quantidade de grana. Mantenha uma sequência e a grana aumenta!"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const s = Strings[language];

		if (!user.CanReceiveDaily()) {

			if (!user.Daily.LastReceived) {
				return;
			}

			const embed = defaultEmbed({
				nickname: user.Nickname,
				interaction,
				description: s.descriptionReceived(user.Nickname, showTime(addDays(user.Daily.LastReceived, 1).getTime(), true)),
				thumbnail: interaction.user.avatarURL() ?? "",
				color: CrColors.Default,
			});

			return await replyInteraction(interaction, { embeds: [embed] });
		}

		const money = await user.ReceiveDaily();

		const embed = defaultEmbed({
			nickname: user.Nickname,
			interaction,
			description: s.description(user, money),
			footer: s.footer(user.Daily.MaxStreak),
			thumbnail: interaction.user.avatarURL() ?? "",
			color: CrColors.Default,
		});

		await replyInteraction(interaction, { embeds: [embed] });
	},
};

const Strings = {
	[Language.English]: {
		descriptionReceived: (nickname: string, userLastDaily: string) => `**${nickname}** already receive his daily Exp in the last 24 hours.\n-# You will be able to receive again ${userLastDaily}!`,
		description: (user: User, money: number) => `**${user.Nickname}** received ${formatMoney(money, user.Language)}.\n-# Your current daily streak is **${user.Daily.CurrentStreak}**.`,
		footer: (maxStreak: number) => `Max daily streak: ${maxStreak}`,
	},

	[Language.Portuguese]: {
		descriptionReceived: (nickname: string, userLastDaily: string) => `**${nickname}** já recebeu seu Exp diário nas últimas 24 horas.\n-# Você poderá receber novamente ${userLastDaily}!`,
		description: (user: User, money: number) => `**${user.Nickname}** recebeu ${formatMoney(money, user.Language)}.\n-# Sua sequência de diários atual é **${user.Daily.CurrentStreak}**.`,
		footer: (maxStreak: number) => `Sequência máxima: ${maxStreak}`,
	},
	[Language.Spanish]: {
		descriptionReceived: (nickname: string, userLastDaily: string) => `**${nickname}** ya recibió su Exp diaria en las últimas 24 horas.\n-# Podrá recibirla nuevamente ${userLastDaily}!`,
		description: (user: User, money: number) => `**${user.Nickname}** recibió ${formatMoney(money, user.Language)}.\n-# Tu racha diaria actual es **${user.Daily.CurrentStreak}**.`,
		footer: (maxStreak: number) => `Racha máxima: ${maxStreak}`,
	},
} as const;