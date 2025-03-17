import { ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { replyInteraction } from "../../utils/logic";
import { formatMoney, showTime } from "../../utils/ui";
import { addDays } from "date-fns";
import { Language } from "../../models/Language";
import { CrColors } from "../../utils/colors";
import { User } from "../../models/User";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";

module.exports = {
	vip: true,
	data: new SlashCommandBuilder()
		.setName("daily")
		.setDescription("Receives a small ammount of money. Keep a streak and the money grows!")
		.setDescriptionLocalization(Locale.PortugueseBR, "Recebe uma pequena quantidade de grana. Mantenha uma sequência e a grana aumenta!"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const s = Strings[language];

		const embed = new CustomEmbedBuilder()
			.setColor(CrColors.Default)
			.setUserFooter({
				nickname: user.Nickname,
				image: interaction.user.avatarURL()
			});

		if (!user.CanReceiveDaily()) {

			if (!user.Daily.LastReceived) {
				return;
			}

			embed.setDescription(s.descriptionReceived(showTime(addDays(user.Daily.LastReceived, 1).getTime(), true)));

			return await replyInteraction(interaction, { embeds: [embed] });
		}

		const money = await user.ReceiveDaily();

		embed
			.setDescription(s.description(money, user.Daily.CurrentStreak))
			.setUserFooter({
				nickname: user.Nickname,
				image: interaction.user.avatarURL(),
				text: s.footer(user.Daily.MaxStreak)
			});

		await replyInteraction(interaction, { embeds: [embed] });
	},
};

const Strings = {
	[Language.English]: {
		descriptionReceived: (userLastDaily: string) => `You already receive his daily money in the last 24 hours.\n-# Will be able to receive again ${userLastDaily}!`,
		description: (money: number, currentStreak: number) => `You received ${formatMoney(money, Language.English)}.\n-# Your current daily streak is **${currentStreak}**.`,
		footer: (maxStreak: number) => `Max daily streak: ${maxStreak}`,
	},

	[Language.Portuguese]: {
		descriptionReceived: (userLastDaily: string) => `Você já recebeu sua grana diária nas últimas 24 horas.\n-# Poderá receber novamente ${userLastDaily}!`,
		description: (money: number, currentStreak: number) => `Você recebeu ${formatMoney(money, Language.Portuguese)}.\n-# Sua sequência de diários atual é **${currentStreak}**.`,
		footer: (maxStreak: number) => `Sequência máxima: ${maxStreak}`,
	},
	[Language.Spanish]: {
		descriptionReceived: (userLastDaily: string) => `Ya has recibido tu dinero diario en las últimas 24 horas.\n-# Podrá recibirla nuevamente ${userLastDaily}!`,
		description: (money: number, currentStreak: number) => `Usted recibió ${formatMoney(money, Language.Spanish)}.\n-# Tu racha diaria actual es **${currentStreak}**.`,
		footer: (maxStreak: number) => `Racha máxima: ${maxStreak}`,
	},
} as const;