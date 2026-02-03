import { ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { replyWithContainer } from "@bot/utils/discordInteractions";
import { formatMoney, showTime } from "@bot/utils/ui";
import { addDays } from "date-fns";
import { Language, Localization } from "@core/models/Language";
import { CrColors } from "@bot/utils/colors";
import { User } from "@core/models/User";
import { CustomContainerBuilder } from "@bot/ui/builders/CustomContainerBuilder";
import { isUserBoosterInOfficialServer } from "@bot/utils/officialServer";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("daily")
		.setDescription("Receives a small ammount of money. Keep a streak and the money grows!")
		.setDescriptionLocalization(Locale.PortugueseBR, "Recebe uma pequena quantidade de grana. Mantenha uma sequência e a grana aumenta!"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const s = Strings[language];

		const container = new CustomContainerBuilder()
			.setUser(user)
			.setAccentColor(CrColors.Default);

		if (!user.CanReceiveDaily()) {

			if (!user.Daily.LastReceived) {
				return;
			}

			container
				.addTexts([
					s.descriptionReceived(showTime(addDays(user.Daily.LastReceived, 1).getTime(), true)),
				])
				.addFooter();

			return replyWithContainer(interaction, container);
		}

		const isBooster = await isUserBoosterInOfficialServer(interaction);

		const money = await user.ReceiveDaily({ isBooster });

		container
			.addTexts([
				s.description(money, user.Daily.CurrentStreak),
			])
			.addFooter({
				text: s.footer(user.Daily.MaxStreak),
			});

		return replyWithContainer(interaction, container);
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
} as const satisfies Localization;