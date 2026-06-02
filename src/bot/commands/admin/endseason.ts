import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { EmoteBadgeString } from "#bot/utils/badges";
import { createButtonCollector, disableButtons } from "#bot/utils/collectors";
import { CrColors } from "#bot/utils/colors";
import { deferUpdate, replyWithContainer } from "#bot/utils/discordInteractions";
import { EmoteString } from "#bot/utils/emotes";
import { defaultComponent, formatMoney } from "#bot/utils/ui";
import { UserRepository } from "#core/repositories/UserRepository";
import type { Users } from "#core/database/Users";
import type { Gangs } from "#core/database/Gangs";
import { Language } from "#core/models/Language";
import type { User } from "#core/models/User";
import { ClassList } from "#core/types/Classes";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	type ChatInputCommandInteraction,
	Locale,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("endseason")
		.setDescription("End the current season")
		.setDescriptionLocalization(Locale.PortugueseBR, "Termina a temporada atual")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	async execute(interaction: ChatInputCommandInteraction, user: User) {
		let container = defaultComponent({
			user,
			description: "Confirm end of current season?",
			color: CrColors.Admin,
			buttons: new ActionRowBuilder<ButtonBuilder>()
				.setComponents(new ButtonBuilder()
					.setLabel("Confirm")
					.setStyle(ButtonStyle.Success)
					.setCustomId("confirmRanking"),
				),
		});

		const response = await replyWithContainer(interaction, container);

		const collector = createButtonCollector(interaction, response);

		collector?.on("end", async () => {
			await disableButtons(interaction, container);
		});

		collector?.on("collect", async btn => {
			await deferUpdate(btn);

			let texts = [];

			container = new CustomContainerBuilder()
				.setAccentColor(CrColors.Admin)
				.setUser(user)
				.addTexts([
					"Starting...",
				], 10);

			if (btn.customId === "confirmRanking") {

				function getUserRow(u: Users, info: string | number) {
					return `**${ClassList[u.class].Image.Emote.String} ${u.nickname}**\n${info}\n-# \`Id: ${u.id}\``;
				}

				function getGangRow(gang: Gangs, info: string | number) {
					return `${gang.name} (${info})\n-# \`Id: ${gang.id}\``;
				}

				texts.push("Getting top ranking values...");
				container.changeTextFromSectionId(10, texts.join("\n"));

				await replyWithContainer(interaction, container);

				const [
					topMoney,
					topGambler,
					topSpender,
					topThief,
					topWorker,
					topBeater,
					topScavenger,
					topHospital,
					topBriber,
					topEscaper,
					topDrunk,
					topInvestor,
					topGang,
				] = await UserRepository.GetEndSeasonRankingData();

				texts.push(
					`## ${EmoteBadgeString.Season1.Top1Money} Top Money`,
					`-# Money at the end of season`,
					topMoney.map(u => getUserRow(u, formatMoney(u.money, Language.English))).join("\n"),
					``,
					`## ${EmoteBadgeString.Season6.EliteTrader} Top Gambler`,
					`-# Money gained at the Casino`,
					topGambler.map(u => getUserRow(u, formatMoney(u.casinoWinSum, Language.English))).join("\n"),
					``,
					`## ${EmoteBadgeString.Season6.Preppy} Top Spender`,
					`-# Money spent in Shops`,
					topSpender.map(u => getUserRow(u, formatMoney(u.shopSpentSum, Language.English))).join("\n"),
					``,
					`## ${EmoteBadgeString.Season6.SillyHand} Top Thief`,
					`-# Money robbed from users and places`,
					topThief.map(u => getUserRow(u, formatMoney(u.robberySuccessRobbedSum, Language.English))).join("\n"),
					``,
					`## ${EmoteBadgeString.Season6.Workaholic} Top Worker`,
					`-# Money received from jobs`,
					topWorker.map(u => getUserRow(u, formatMoney(u.jobReceivedSum, Language.English))).join("\n"),
					``,
					`## ${EmoteBadgeString.Season6.HeadSmasher} Top Beater`,
					`-# Times beat up users`,
					topBeater.map(u => getUserRow(u, u.beatUpSuccessCount)).join("\n"),
					``,
					`## ${EmoteBadgeString.Season6.SherlockHolmes} Top Scavenger`,
					`-# Found in Scavenges`,
					topScavenger.map(u => getUserRow(u, u.scavengeFoundTotal)).join("\n"),
					``,
					`## ${EmoteBadgeString.Season6.Hypochondriac} Top Hospital`,
					`-# Spent in hospital treatments`,
					topHospital.map(u => getUserRow(u, formatMoney(u.hospitalTreatmentSum, Language.English))).join("\n"),
					``,
					`## ${EmoteBadgeString.Season6.Politician} Top Briber`,
					`-# Spent in prison bribes`,
					topBriber.map(u => getUserRow(u, formatMoney(u.prisonBriberySum, Language.English))).join("\n"),
					``,
					`## ${EmoteBadgeString.Season6.Escapist} Top Escaper`,
					`-# Times escaped from prison`,
					topEscaper.map(u => getUserRow(u, u.escapeCount)).join("\n"),
					``,
					`## ${EmoteString.Idle} Top Drunk`,
					`-# Max beers drank before getting drunk during Happy Hour `,
					topDrunk.map(u => getUserRow(u, u.drinkHappyHour)).join("\n"),
					``,
					`## ${EmoteBadgeString.Season6.Invester} Top Investor`,
					`-# Total profit from investments`,
					topInvestor.map(u => getUserRow(u, formatMoney(u.investmentTotalProfit, Language.English))).join("\n"),
					``,
					`## ${EmoteBadgeString.Season6.TopGang} Top Gang`,
					`-# Greater level`,
					topGang.map(gang => getGangRow(gang as Gangs, (gang as Gangs).level)).join("\n"),
				);

				container
					.changeTextFromSectionId(10, texts.join("\n"))
					.addButtonRow(btn => btn
						.setLabel("Continue")
						.setStyle(ButtonStyle.Primary)
						.setCustomId("confirmCheckValues"),
					);

				return replyWithContainer(interaction, container);
			}

			else if (btn.customId === "confirmCheckValues") {

				container.changeTextFromSectionId(10, "Getting current values...");

				await replyWithContainer(interaction, container);

				const [
					activeUsers,
					activeGangs,
					gangMembers,
					gangRoles,
					howManyItems,
					robberies,
					notifications,
					lotteryTickets,
					investments,
					horseRaceBets,
				] = await UserRepository.GetEndSeasonStats();

				texts = [
					`### \`${activeUsers}\` Active users`,
					`### \`${activeGangs}\` Active gangs`,
					`### \`${gangMembers}\` Gang members`,
					`### \`${gangRoles}\` Gang roles`,
					`###  \`${howManyItems}\` Items`,
					`###  \`${robberies}\` Robberies`,
					`###  \`${notifications}\` Notifications`,
					`###  \`${lotteryTickets}\` Lottery tickets`,
					`###  \`${investments}\` Investments`,
					`###  \`${horseRaceBets}\` Horse race bets`,
					``,
					`-# - Clicking "END SEASON" will erase database rows from Gangs, GangMembers, GangRoles, UserItems, RobHistories, Notifications, LotteryTickets, UserInvestments, HorseRaceBets and HorseRaces.`,
					`-# - UserBadges, UserBundles, UserAvatarDecorations and UserBackgroundDecorations will NOT be erased.`,
					"-# - Columns `id`, `nickname`, `language`, `specialCoin`, `avatarDecoration`, `backgroundDecoration`, `vipTime`, `vipEternal`, `lastVoteClaim`, `voteCount`, `notifyInvestmentYield` and `createdAt` from Users will NOT be erased.",
				];

				container
					.changeTextFromSectionId(10, texts.join("\n"))
					.addButtonRow(btn => btn
						.setLabel("END SEASON")
						.setStyle(ButtonStyle.Danger)
						.setCustomId("clearValues"),
					);

				return replyWithContainer(interaction, container);
			}

			else if (btn.customId === "clearValues") {

				container.changeTextFromSectionId(10, "Clearing values...");

				await replyWithContainer(interaction, container);

				await UserRepository.ResetSeasonDatabase();

				texts = [
					`# SEASON ENDED!`,
					`Good luck out there`,
				];

				container.changeTextFromSectionId(10, texts.join("\n"));

				return replyWithContainer(interaction, container);
			}
		});
	},
};