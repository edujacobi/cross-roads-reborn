import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { CrColors } from "#bot/utils/colors";
import { replyWithContainer } from "#bot/utils/discordInteractions";
import { isUserBoosterInOfficialServer } from "#bot/utils/officialServer";
import { formatMoney, showTime } from "#bot/utils/ui";
import { Language, type Localization } from "#core/models/Language";
import type { User } from "#core/models/User";
import { addDays } from "date-fns";
import { type ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("daily")
		.setNameLocalization(Locale.SpanishES, "diario")
		.setDescription("Receives a small ammount of money. Keep a streak and the money grows!")
		.setDescriptionLocalization(Locale.PortugueseBR, "Recebe uma pequena quantidade de grana. Mantenha uma sequência e a grana aumenta!")
		.setDescriptionLocalization(Locale.SpanishES, "Recibe una pequeña cantidad de dinero. ¡Mantén una racha y el dinero aumenta!"),

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
				.addFooter({
					text: formatMoney(user.Money, language),
				});

			return replyWithContainer(interaction, container);
		}

		const isBooster = await isUserBoosterInOfficialServer(interaction);

		const { money, bonusItems } = await user.ReceiveDaily({ isBooster });

		const texts = [
			s.description(money, user.Daily.CurrentStreak),
		];

		if (bonusItems && bonusItems.length > 0) {
			texts.push(`### ${s.bonusTitle}`);
			bonusItems.forEach(bonus => {
				const duration = bonus.days ? `(${bonus.days} ${s.days(bonus.days)})` : `(${bonus.quantity} ${s.units(bonus.quantity!)})`;
				texts.push(`- ${user.GetItemSkin(bonus.item)} **${bonus.item.Description[language]}** ${duration}`);
			});
		}

		container
			.addTexts(texts)
			.addFooter({
				text: `${formatMoney(user.Money, language)} • ${s.footer(user.Daily.MaxStreak)}`,
			});

		return replyWithContainer(interaction, container);
	},
};

const Strings = {
	[Language.English]: {
		descriptionReceived: (userLastDaily: string) => `You already receive his daily money in the last 24 hours.\n-# Will be able to receive again ${userLastDaily}!`,
		description: (money: number, currentStreak: number) => `You received ${formatMoney(money, Language.English)}.\n-# Your current daily streak is **${currentStreak}**.`,
		footer: (maxStreak: number) => `Max daily streak: ${maxStreak}`,
		bonusTitle: "Bonus items received!",
		days: (quantity: number) => quantity == 1 ? "day" : "days",
		units: (quantity: number) => quantity == 1 ? "unit" : "units",
	},

	[Language.Portuguese]: {
		descriptionReceived: (userLastDaily: string) => `Você já recebeu sua grana diária nas últimas 24 horas.\n-# Poderá receber novamente ${userLastDaily}!`,
		description: (money: number, currentStreak: number) => `Você recebeu ${formatMoney(money, Language.Portuguese)}.\n-# Sua sequência de diários atual é **${currentStreak}**.`,
		footer: (maxStreak: number) => `Sequência máxima: ${maxStreak}`,
		bonusTitle: "Itens bônus recebidos!",
		days: (quantity: number) => quantity == 1 ? "dia" : "dias",
		units: (quantity: number) => quantity == 1 ? "unidade" : "unidades",
	},
	[Language.Spanish]: {
		descriptionReceived: (userLastDaily: string) => `Ya has recibido tu dinero diario en las últimas 24 horas.\n-# Podrá recibirla nuevamente ${userLastDaily}!`,
		description: (money: number, currentStreak: number) => `Usted recibió ${formatMoney(money, Language.Spanish)}.\n-# Tu racha diaria actual es **${currentStreak}**.`,
		footer: (maxStreak: number) => `Racha máxima: ${maxStreak}`,
		bonusTitle: "¡Artículos de bono recibidos!",
		days: (quantity: number) => quantity == 1 ? "día" : "días",
		units: (quantity: number) => quantity == 1 ? "unidad" : "unidades",
	},
} as const satisfies Localization;
