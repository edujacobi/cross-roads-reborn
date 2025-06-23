import { ChatInputCommandInteraction, Locale, MessageFlags, SlashCommandBuilder } from "discord.js";
import { User } from "../../models/User";
import { CustomContainerBuilder } from "../../ui/builders/CustomContainerBuilder";
import { BadgeId, getBadgeList } from "../../interfaces/Badges";
import { Language } from "../../models/Language";
import { UserBadge } from "../../models/UserBadge";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("badges")
		.setDescription("Check all the existing badges")
		.setNameLocalization(Locale.PortugueseBR, "insígnias")
		.setDescriptionLocalization(Locale.PortugueseBR, "Conheça todas as insígnias existentes"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {

		await interaction.deferReply();

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
			.addTextDisplayComponents(header => header
				.setContent(`# ${s.badges}`),
			)
			.addLargeSeparator()
			.addTextDisplayComponents(content => content
				.setContent(`## ${s.special}`),
			)
			.addTextDisplayComponents(content => content
				.setContent(textSpecial.join("\n")),
			)
			.addLargeSeparator()
			.addTextDisplayComponents(content => content
				.setContent(`## ${s.seasonal}`),
			)
			.addTextDisplayComponents(content => content
				.setContent(textSeasonal.join("\n")),
			)
			.addFooter({ text: userBadgeText.length ? `${s.your}: ${userBadgeText}` : undefined });

		await interaction.editReply({
			components: [container],
			flags: MessageFlags.IsComponentsV2,
		});
	},
};

const Strings = {
	[Language.English]: {
		badges: "Badges",
		special: "Special badges",
		seasonal: "Seasonal badges",
		your: "Your badges"
	},
	[Language.Portuguese]: {
		badges: "Insígnias",
		special: "Insígnias especiais",
		seasonal: "Insígnias da temporada",
		your: "Suas insígnias"
	},
	[Language.Spanish]: {
		badges: "Insingas",
		special: "Insingas especiales",
		seasonal: "Insingas de temporada",
		your: "Tus insingas"
	},
} as const;