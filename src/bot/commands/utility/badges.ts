import { ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { User } from "@core/models/User";
import { CustomContainerBuilder } from "@bot/ui/builders/CustomContainerBuilder";
import { BadgeId, getBadgeList } from "@core/types/Badges";
import { Language } from "@core/models/Language";
import { UserBadge } from "@core/models/UserBadge";
import { deferReply, replyWithContainer } from "@bot/utils/discordInteractions";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("badges")
		.setDescription("Check all the existing badges")
		.setNameLocalization(Locale.PortugueseBR, "insígnias")
		.setDescriptionLocalization(Locale.PortugueseBR, "Conheça todas as insígnias existentes"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		await deferReply(interaction);

		const specialBadges = [
			BadgeId.VIP,
			BadgeId.Developer,
			BadgeId.Moderator,
			BadgeId.Helper,
			BadgeId.BugCatcher,
			BadgeId.Artist,
			BadgeId.Billionaire,
			BadgeId.ChristmasArt2020,
			BadgeId.EasterGoldenEggs2021,
			BadgeId.HalloweenArt2021,
			BadgeId.ChristmasCookie2021,
			BadgeId.DefeatedCoroamuru,
			BadgeId.KeyishMandrake,
		];

		const seasonalBadges = [
			BadgeId.S_Top1Money,
			BadgeId.S_Top2Money,
			BadgeId.S_Top3Money,
			BadgeId.S_Top1BeatUp,
			BadgeId.S_Top1Scavenge,
			BadgeId.S_Top1Escapes,
			BadgeId.S_Top1CasinoWR,
			BadgeId.S_Top1CasinoProfit,
			BadgeId.S_Top1RobberyQuantity,
			BadgeId.S_Top1RobberyProfit,
			BadgeId.S_Top1Rooster,
			BadgeId.S_Top1Alms,
			BadgeId.S_Top1Investments,
			BadgeId.S_Top1Jobs,
			BadgeId.S_Top1Spender,
			BadgeId.S_Top1Bribery,
			BadgeId.S_Top1Hospital,
			BadgeId.S_Top1Gang,
		];

		const s = Strings[language];

		const textSpecial: string[] = [];
		const textSeasonal: string[] = [];

		for (const badge of getBadgeList()) {
			if (specialBadges.includes(badge.Id)) {
				textSpecial.push(`### ${badge.Emoji.String} ${badge.Name[language]}\n${badge.Description[language]}`);
			}
			if (seasonalBadges.includes(badge.Id)) {
				textSeasonal.push(`### ${badge.Emoji.String} ${badge.Name[language]}\n${badge.Description[language]}`);
			}
		}

		let userBadges = await UserBadge.GetList(user.Id);

		if (user.IsVip()) {
			userBadges = UserBadge.AddVIPBadgeInList(userBadges, user, language);
		}

		let userBadgeText = "";

		userBadges.forEach(badge => userBadgeText += `${badge.Emoji} `);

		const container = new CustomContainerBuilder()
			.setUser(user)
			.addTexts([
				`# ${s.badges}`
			])
			.addLargeSeparator()
			.addTexts([
				`## ${s.special}`,
				textSpecial.join("\n")
			])
			.addLargeSeparator()
			.addTexts([
				`## ${s.seasonal}`,
				textSeasonal.join("\n")
			])
			.addFooter({ text: userBadgeText.length ? `${s.your}: ${userBadgeText}` : undefined });

		return replyWithContainer(interaction, container);
	},
};

const Strings = {
	[Language.English]: {
		badges: "Badges",
		special: "Special badges",
		seasonal: "Seasonal badges",
		your: "Your badges",
	},
	[Language.Portuguese]: {
		badges: "Insígnias",
		special: "Insígnias especiais",
		seasonal: "Insígnias da temporada",
		your: "Suas insígnias",
	},
	[Language.Spanish]: {
		badges: "Insignia",
		special: "Insignia especiales",
		seasonal: "Insignia de temporada",
		your: "Tus insignias",
	},
} as const;