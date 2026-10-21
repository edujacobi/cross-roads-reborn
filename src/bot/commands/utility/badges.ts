import { type ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import type { User } from "#core/models/User";
import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { getCommandBadgeGroups } from "#core/types/Badges";
import { Language, type Localization } from "#core/models/Language";
import { UserBadge } from "#core/models/UserBadge";
import { deferReply, replyWithContainer } from "#bot/utils/discordInteractions";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("badges")
		.setDescription("Check all the existing badges")
		.setNameLocalization(Locale.PortugueseBR, "insígnias")
		.setNameLocalization(Locale.SpanishES, "insignias")
		.setDescriptionLocalization(Locale.PortugueseBR, "Conheça todas as insígnias existentes")
		.setDescriptionLocalization(Locale.SpanishES, "Conoce todas las insignias existentes"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		await deferReply(interaction);

		const s = Strings[language];
		const badgeGroups = getCommandBadgeGroups();
		const textSpecial = badgeGroups.special.map(
			badge => `### ${badge.Emoji.String} ${badge.Name[language]}\n${badge.Description[language]}`,
		);
		const textSeasonal = badgeGroups.seasonal.map(
			badge => `### ${badge.Emoji.String} ${badge.Name[language]}\n${badge.Description[language]}`,
		);

		let userBadges = await UserBadge.GetList(user.Id);

		if (user.IsVip()) {
			userBadges = UserBadge.AddVIPBadgeInList(userBadges, user, language);
		}

		let userBadgeText = "";

		userBadges.forEach(badge => userBadgeText += `${badge.Emoji} `);

		const container = new CustomContainerBuilder()
			.setUser(user)
			.addTexts([
				`# ${s.badges}`,
			])
			.addLargeSeparator()
			.addTexts([
				`## ${s.special}`,
				textSpecial.join("\n"),
			])
			.addLargeSeparator()
			.addTexts([
				`## ${s.seasonal}`,
				textSeasonal.join("\n"),
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
} as const satisfies Localization;