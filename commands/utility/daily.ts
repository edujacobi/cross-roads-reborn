import { ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { checkRooster, checkUser, replyInteraction } from "../../utils/logic";
import { defaultEmbed, getRarityColor, showTime } from "../../utils/ui";
import { addDays } from "date-fns";
import { Language } from "../../models/Language";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("daily")
		.setDescription("Receives a small ammount of EXP. Keep a streak and the EXP grows!")
		.setDescriptionLocalization(Locale.PortugueseBR, "Recebe uma pequena quantidade de Exp. Mantenha uma sequência e o Exp aumenta!"),

	async execute(interaction: ChatInputCommandInteraction) {

		const user = await checkUser(interaction.user.id, interaction);

		if (!user) {
			return;
		}

		const s = Strings[user.Language];

		if (!rooster.CanReceiveDaily()) {

			if (!rooster.Daily.LastReceived) {
				return;
			}

			const embed = defaultEmbed({
				interaction,
				description: s.descriptionReceived(rooster.GetNameWithImage(), showTime(addDays(rooster.Daily.LastReceived, 1).getTime(), true)),
				thumbnail: rooster.GetImage(),
				color: getRarityColor(rooster.Rarity),
			});

			return await replyInteraction(interaction, { embeds: [embed] });
		}

		const exp = await rooster.ReceiveDaily();

		const embed = defaultEmbed({
			interaction,
			description: s.description(rooster.GetNameWithImage(), exp, rooster.Daily.CurrentStreak),
			footer: s.footer(rooster.Daily.MaxStreak),
			thumbnail: rooster.GetImage(),
			color: getRarityColor(rooster.Rarity),
		});

		await replyInteraction(interaction, { embeds: [embed] });
	},
};

const Strings = {
	[Language.English]: {
		descriptionReceived: (roosterName: string, roosterLastDaily: string) => `**${roosterName}** already receive his daily Exp in the last 24 hours.\nHe will be able to receive again ${roosterLastDaily}!`,
		description: (roosterName: string, exp: number, currentStreak: number) => `**${roosterName}** received ${exp} Exp. Your current daily streak is **${currentStreak}**.`,
		footer: (maxStreak: number) => `Max daily streak: ${maxStreak}`,
	},

	[Language.Portuguese]: {
		descriptionReceived: (roosterName: string, roosterLastDaily: string) => `**${roosterName}** já recebeu seu Exp diário nas últimas 24 horas.\nEle poderá receber novamente ${roosterLastDaily}!`,
		description: (roosterName: string, exp: number, currentStreak: number) => `**${roosterName}** recebeu ${exp} Exp. Sua sequência de diários atual é **${currentStreak}**.`,
		footer: (maxStreak: number) => `Sequência máxima: ${maxStreak}`,
	},
	[Language.Spanish]: {
		descriptionReceived: (roosterName: string, roosterLastDaily: string) => `**${roosterName}** ya recibió su Exp diaria en las últimas 24 horas.\nPodrá recibirla nuevamente ${roosterLastDaily}!`,
		description: (roosterName: string, exp: number, currentStreak: number) => `**${roosterName}** recibió ${exp} Exp. Tu racha diaria actual es **${currentStreak}**.`,
		footer: (maxStreak: number) => `Racha máxima: ${maxStreak}`,
	},
} as const;