import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	Locale,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import { createButtonCollector, disableButtons, replyWithContainer } from "../../utils/logic";
import { CrColors } from "../../utils/colors";
import { Users } from "../../database/Users";
import { Op } from "sequelize";
import { CustomContainerBuilder } from "../../ui/builders/CustomContainerBuilder";
import { User } from "../../models/User";
import { Language } from "../../models/Language";
import { defaultComponent, formatMoney } from "../../utils/ui";
import Gangs from "../../database/Gangs";
import { EmoteBadgeString } from "../../utils/badges";
import { ClassList } from "../../interfaces/Classes";
import { UserItems } from "../../database/UserItems";
import { RobHistories } from "../../database/RobHistories";
import { Notifications } from "../../database/Notifications";
import GangMembers from "../../database/GangMembers";
import GangRoles from "../../database/GangRoles";
import { EmoteString } from "../../utils/emotes";

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
			await btn.deferUpdate();

			let texts = [];

			container = new CustomContainerBuilder()
				.setAccentColor(CrColors.Admin)
				.setUser(user)
				.addTexts([
					"Starting...",
				], 10);

			if (btn.customId === "confirmRanking") {
				const defaultAttributes = ["nickname", "id", "class"];

				function getFromRanking(orderBy: string, limit = 1) {
					return Users.findAll({
						attributes: [...defaultAttributes, orderBy],
						limit: limit,
						order: [[orderBy, "DESC"]],
						where: {
							[orderBy]: {
								[Op.gt]: 0,
							},
						},
					});
				}

				function getTopGang() {
					return Gangs.findAll({
						attributes: ["id", "name", "level"],
						limit: 1,
						order: [["level", "DESC"]],
						where: {
							level: {
								[Op.gt]: 0,
							},
						},
					});
				}

				function getUserRow(user: Users, info: string | number) {
					return `**${ClassList[user.class].Image.Emote.String} ${user.nickname}**\n${info}\n-# \`ID: ${user.id}\``;
				}

				function getGangRow(gang: Gangs, info: string | number) {
					return `${gang.name} (${info})\n-# \`ID: ${gang.id}\``;
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
					topGang,
				] = await Promise.all([
					getFromRanking("money", 3),
					getFromRanking("casinoWinSum"),
					getFromRanking("shopSpentSum"),
					getFromRanking("robberySuccessRobbedSum"),
					getFromRanking("jobReceivedSum"),
					getFromRanking("beatUpSuccessCount"),
					getFromRanking("scavengeFoundTotal"),
					getFromRanking("hospitalTreatmentSum"),
					getFromRanking("prisonBriberySum"),
					getFromRanking("escapeCount"),
					getFromRanking("drinkHappyHour"),
					getTopGang(),
				]);

				texts.push(
					`## ${EmoteBadgeString.Season1.Top1Money} Top Money`,
					`-# Money at the end of season`,
					topMoney.map(user => getUserRow(user, formatMoney(user.money, Language.English))).join("\n"),
					``,
					`## ${EmoteBadgeString.Season6.EliteTrader} Top Gambler`,
					`-# Money gained at the Casino`,
					topGambler.map(user => getUserRow(user, formatMoney(user.casinoWinSum, Language.English))).join("\n"),
					``,
					`## ${EmoteBadgeString.Season6.Preppy} Top Spender`,
					`-# Money spent in Shops`,
					topSpender.map(user => getUserRow(user, formatMoney(user.shopSpentSum, Language.English))).join("\n"),
					``,
					`## ${EmoteBadgeString.Season6.SillyHand} Top Thief`,
					`-# Money robbed from users and places`,
					topThief.map(user => getUserRow(user, formatMoney(user.robberySuccessRobbedSum, Language.English))).join("\n"),
					``,
					`## ${EmoteBadgeString.Season6.Workaholic} Top Worker`,
					`-# Money received from jobs`,
					topWorker.map(user => getUserRow(user, formatMoney(user.jobReceivedSum, Language.English))).join("\n"),
					``,
					`## ${EmoteBadgeString.Season6.HeadSmasher} Top Beater`,
					`-# Times beat up users`,
					topBeater.map(user => getUserRow(user, user.beatUpSuccessCount)).join("\n"),
					``,
					`## ${EmoteBadgeString.Season6.SherlockHolmes} Top Scavenger`,
					`-# Found in Scavenges`,
					topScavenger.map(user => getUserRow(user, user.scavengeFoundTotal)).join("\n"),
					``,
					`## ${EmoteBadgeString.Season6.Hypochondriac} Top Hospital`,
					`-# Spent in hospital treatments`,
					topHospital.map(user => getUserRow(user, formatMoney(user.hospitalTreatmentSum, Language.English))).join("\n"),
					``,
					`## ${EmoteBadgeString.Season6.Politician} Top Briber`,
					`-# Spent in prison bribes`,
					topBriber.map(user => getUserRow(user, formatMoney(user.prisonBriberySum, Language.English))).join("\n"),
					``,
					`## ${EmoteBadgeString.Season6.Escapist} Top Escaper`,
					`-# Times escaped from prison`,
					topEscaper.map(user => getUserRow(user, user.escapeCount)).join("\n"),
					``,
					`## ${EmoteString.Idle} Top Drunk`,
					`-# Max beers drank before getting drunk during Happy Hour `,
					topDrunk.map(user => getUserRow(user, user.drinkHappyHour)).join("\n"),
					``,
					`## ${EmoteBadgeString.Season6.TopGang} Top Gang`,
					`-# Greater level`,
					topGang.map(gang => getGangRow(gang, gang.level)).join("\n"),
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
				] = await Promise.all([
					Users.count({ where: { class: { [Op.not]: 0 } } }),
					Gangs.count(),
					GangMembers.count(),
					GangRoles.count(),
					UserItems.count(),
					RobHistories.count(),
					Notifications.count(),
				]);

				texts = [
					`### \`${activeUsers}\` Active users`,
					`### \`${activeGangs}\` Active gangs`,
					`### \`${gangMembers}\` Gang members`,
					`### \`${gangRoles}\` Gang roles`,
					`###  \`${howManyItems}\` Items`,
					`###  \`${robberies}\` Robberies`,
					`###  \`${notifications}\` Notifications`,
					``,
					`-# - Clicking "END SEASON" will erase database rows from Gangs, GangMembers, GangRoles, UserItems, RobHistories and Notifications.`,
					`-# - UserBadges, UserBundles and UserAvatarDecorations will NOT be erased.`,
					"-# - Columns `id`, `nickname`, `language`, `specialCoin`, `avatarDecoration`, `vipTime`, `vipEternal` and `createdAt` from Users will NOT be erased.",
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

				await Promise.all([
					GangMembers.destroy({ where: {} }),
					GangRoles.destroy({ where: {} }),
				]);

				const date = new Date();

				await Promise.all([
					Users.update(
						{
							money: 0,
							class: 0,
							dailyStreak: 0,
							maxDailyStreak: 0,
							lastDailyReceived: null,
							casinoLoseCount: 0,
							casinoLoseSum: 0,
							casinoWinCount: 0,
							casinoWinSum: 0,
							escapeCount: 0,
							escapeHasTried: false,
							wantedCount: 0,
							hospitalCount: 0,
							hospitalTreatmentCount: 0,
							hospitalTreatmentSum: 0,
							jobId: null,
							jobReceivedCount: 0,
							jobReceivedSum: 0,
							prisonCount: 0,
							prisonBriberyCount: 0,
							prisonBriberySum: 0,
							prisonHasPaidBribe: false,
							robberyBeingRobbedCount: 0,
							robberyBeingRobbedSum: 0,
							robberyFailureCount: 0,
							robberySuccessCount: 0,
							robberySuccessRobbedSum: 0,
							beatUpSuccessCount: 0,
							beatUpFailureCount: 0,
							beatUpBeatedUpCount: 0,
							shopSpentCount: 0,
							shopSpentSum: 0,
							almsGivenSum: 0,
							almsGivenCount: 0,
							almsReceivedSum: 0,
							almsReceivedCount: 0,
							scavengeCount: 0,
							scavengeFoundTotal: 0,
							scavengeFoundItems: 0,
							scavengeMoneyCount: 0,
							scavengeMoneySum: 0,
							scavengeFailures: 0,
							scavengeFailureWithHospital: 0,
							scavengeFailureWithPrison: 0,
							drinkNormal: 0,
							drinkHappyHour: 0,
							drunkCount: 0,
							// actions
							beingRobbedByUserId: null,
							robbingUserId: null,
							robbingLocationId: null,
							scavengingId: null,
							beatingUserId: null,
							beingBeatUpByUserId: null,
							// timers
							almsGiveTime: date,
							almsReceiveTime: date,
							beatUpTime: date,
							prisonTime: date,
							escapeTime: date,
							wantedTime: date,
							hospitalTime: date,
							jobTime: date,
							scavengeTime: date,
						},
						{ where: { class: { [Op.not]: 0 } } },
					),
					Gangs.destroy({ where: {} }),
					UserItems.destroy({ where: {} }),
					RobHistories.destroy({ where: {} }),
					Notifications.destroy({ where: {} }),
				]);

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