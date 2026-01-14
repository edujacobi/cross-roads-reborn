import { User } from "./User";
import { EmoteString } from "../utils/emotes";
import { formatMoney, showTime } from "../utils/ui";
import { Language } from "./Language";
import {
	ActionRowBuilder,
	ChatInputCommandInteraction,
	Colors,
	ComponentType,
	MessageComponentInteraction,
	MessageFlags,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} from "discord.js";
import { CrColors } from "../utils/colors";
import { disableButtons, replyInteraction, sendPrivateMessage } from "../utils/logic";
import { HorseRaces } from "../database/HorseRaces";
import { HorseRaceBets } from "../database/HorseRaceBets";
import { addHours } from "date-fns/addHours";
import { Op } from "sequelize";
import { Casino } from "./Casino";
import { Notification, NotificationType } from "./Notification";
import { Log } from "../utils/log";
import { ClassList } from "../interfaces/Classes";
import { CustomContainerBuilder } from "../ui/builders/CustomContainerBuilder";

// Number of horses in each race
export const HORSE_COUNT = 5;

// Horse data with names and emojis
export const HorseData = [
	{ id: 1, emoji: "🐎", nameEn: "Lightning", namePt: "Relâmpago", nameEs: "Relámpago" },
	{ id: 2, emoji: "🏇", nameEn: "Thunder", namePt: "Trovão", nameEs: "Trueno" },
	{ id: 3, emoji: "🐴", nameEn: "Shadow", namePt: "Sombra", nameEs: "Sombra" },
	{ id: 4, emoji: "🦄", nameEn: "Mystic", namePt: "Místico", nameEs: "Místico" },
	{ id: 5, emoji: "🦓", nameEn: "Stripes", namePt: "Listrado", nameEs: "Rayado" },
];

export class HorseRacing {
	User: User;

	constructor(user: User) {
		this.User = user;
	}

	// Calculate maximum bet based on ATK: (100 * ATK)^1.5
	CalculateMaxBet(): number {
		const atk = this.User.Attributes.Attack;
		return Math.floor(Math.pow(100 * Math.max(1, atk), 1.5));
	}

	// Get the next upcoming race
	static async GetNextRace(): Promise<HorseRaces | null> {
		return await HorseRaces.findOne({
			where: {
				isFinished: false,
			},
			order: [["raceTime", "ASC"]],
		});
	}

	// Check if a user has already bet on the current race
	async HasUserBetOnRace(raceId: number): Promise<boolean> {
		const bet = await HorseRaceBets.findOne({
			where: {
				userId: this.User.Id,
				raceId: raceId,
			},
		});

		return bet !== null;
	}

	// Place a bet on a horse
	async PlaceBet(raceId: number, horseNumber: number, amount: number): Promise<{
		success: boolean;
		message: string
	}> {
		const s = Strings[this.User.Language];

		// Check if user can bet
		const { canPlay, message } = await Casino.CanUserPlayBet(this.User, amount);
		if (!canPlay) {
			return { success: false, message };
		}

		// Check if horse number is valid
		if (horseNumber < 1 || horseNumber > HORSE_COUNT) {
			return { success: false, message: s.invalidHorse(HORSE_COUNT) };
		}

		// Check if user has already bet on this race
		const hasBet = await this.HasUserBetOnRace(raceId);
		if (hasBet) {
			return { success: false, message: s.alreadyBet };
		}

		// Check if bet amount is within limits
		const maxBet = this.CalculateMaxBet();
		if (amount > maxBet) {
			return { success: false, message: s.betTooHigh(formatMoney(maxBet, this.User.Language)) };
		}

		// Get the race
		const race = await HorseRaces.findByPk(raceId);
		if (!race) {
			return { success: false, message: s.raceNotFound };
		}

		// Check if race is still open for betting
		if (race.raceTime.getTime() - Date.now() < 5 * 60 * 1000) { // 5 minutes before race
			return { success: false, message: s.raceClosed };
		}

		// Create the bet
		await HorseRaceBets.create({
			userId: this.User.Id,
			raceId: raceId,
			horseNumber: horseNumber,
			amount: amount,
		});

		// Update race totals
		race.totalBets += 1;
		race.totalAmount += amount;
		await race.save();

		// Update user's money
		this.User.Money -= amount;
		await this.User.Update();

		return {
			success: true,
			message: s.betPlaced(horseNumber, formatMoney(amount, this.User.Language), showTime(race.raceTime.getTime(), true)),
		};
	}

	// Show the next race information
	async ShowNextRace(interaction: ChatInputCommandInteraction) {
		const s = Strings[this.User.Language];
		const language = this.User.Language;

		const race = await HorseRacing.GetNextRace();
		if (!race) {
			// No race scheduled, create one
			const newRaceTime = addHours(new Date(), 4);
			const newRace = await HorseRaces.create({
				raceTime: newRaceTime,
			});

			// Schedule notification for this race
			await HorseRacing.ScheduleRaceNotification(newRace);

			const container = new CustomContainerBuilder()
				.setUser(this.User)
				.setAccentColor(CrColors.Casino)
				.addSectionComponents(section => section
					.addTexts([
						s.noRaceScheduled(showTime(newRaceTime.getTime(), true)),
					])
					.setThumbnailAccessory(thumb => thumb
						.setURL("https://media.discordapp.net/attachments/1233604589064818808/1370492768803225630/horse-racing_1f3c7.png"),
					),
				)
				.addFooter({
					text: formatMoney(this.User.Money, this.User.Language),
				});

			await replyInteraction(interaction, {
				components: [container],
				flags: MessageFlags.IsComponentsV2,
			});
			return;
		}

		// Check if user has already bet on this race
		const userBet = await HorseRaceBets.findOne({
			where: {
				userId: this.User.Id,
				raceId: race.id,
			},
		});

		const maxBet = this.CalculateMaxBet();

		// Get horse names based on language
		const getHorseName = (horse: typeof HorseData[0]) => {
			switch (language) {
			case Language.Portuguese:
				return horse.namePt;
			case Language.Spanish:
				return horse.nameEs;
			default:
				return horse.nameEn;
			}
		};

		// Create horse list for display
		const horseList = HorseData.map(horse =>
			`${horse.emoji} **${getHorseName(horse)}** (${s.horse} ${horse.id})`,
		).join("\n");

		let betInfo = s.noBet as string;
		if (userBet) {
			const horse = HorseData.find(h => h.id === userBet.horseNumber);
			if (horse) {
				betInfo = `${horse.emoji} ${getHorseName(horse)} - ${formatMoney(userBet.amount, this.User.Language)}`;
			}
			else {
				betInfo = s.userBet(userBet.horseNumber, formatMoney(userBet.amount, this.User.Language));
			}
		}

		const container = new CustomContainerBuilder()
			.setUser(this.User)
			.setAccentColor(CrColors.Casino)
			.addSectionComponents(section => section
				.addTexts([
					s.nextRace(
						race.raceTime,
						formatMoney(race.totalAmount, this.User.Language),
						race.totalBets,
						betInfo,
						formatMoney(maxBet, this.User.Language),
						horseList,
						userBet !== null,
					),
				])
				.setThumbnailAccessory(thumb => thumb
					.setURL("https://media.discordapp.net/attachments/1233604589064818808/1370492768803225630/horse-racing_1f3c7.png"),
				),
			)
			.addFooter({
				text: formatMoney(this.User.Money, this.User.Language),
			});

		// If user already bet or race is closed, don't show betting options
		if (userBet || race.raceTime.getTime() - Date.now() < 5 * 60 * 1000) {
			await replyInteraction(interaction, {
				components: [container],
				flags: MessageFlags.IsComponentsV2,
			});
			return;
		}

		// Create bet amount options
		const betAmounts = [
			1000,
			5000,
			10000,
			Math.min(50000, maxBet),
			Math.min(100000, maxBet),
			maxBet,
		].filter((value, index, self) =>
			// Remove duplicates and ensure values are within limits
			self.indexOf(value) === index && value <= maxBet && value <= this.User.Money,
		);

		// Create horse selection menu
		const horseSelect = new StringSelectMenuBuilder()
			.setCustomId("horse_select")
			.setPlaceholder(s.selectHorse);

		// Add options for each horse
		HorseData.forEach(horse => {
			horseSelect.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel(getHorseName(horse))
					.setValue(horse.id.toString())
					.setEmoji(horse.emoji)
					.setDescription(s.horseOption(horse.id)),
			);
		});

		// Create amount selection menu
		const amountSelect = new StringSelectMenuBuilder()
			.setCustomId("amount_select")
			.setPlaceholder(s.selectAmount);

		// Add options for bet amounts
		betAmounts.forEach(amount => {
			amountSelect.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel(formatMoney(amount, language).replace(/\s/g, ""))
					.setValue(amount.toString())
					.setDescription(s.betAmount),
			);
		});

		// // Create custom amount button
		// const customAmountButton = new ButtonBuilder()
		// 	.setCustomId("custom_amount")
		// 	.setLabel(s.customAmount)
		// 	.setStyle(ButtonStyle.Secondary);

		// Create action rows
		const rowHorseSelect = new ActionRowBuilder<StringSelectMenuBuilder>()
			.setComponents(horseSelect);

		const rowAmountSelect = new ActionRowBuilder<StringSelectMenuBuilder>()
			.setComponents(amountSelect);

		// const rowButton = new ActionRowBuilder<ButtonBuilder>()
		// 	.setComponents(customAmountButton);

		// Only show components if there are bet amounts available
		const components = betAmounts.length > 0
			// ? [rowHorseSelect, rowAmountSelect, rowButton]
			? [rowHorseSelect, rowAmountSelect]
			: [rowHorseSelect];

		const response = await replyInteraction(interaction, {
			components: [container, ...components],
			flags: MessageFlags.IsComponentsV2,
		});

		// Selected values
		let selectedHorse: number | null = null;
		let selectedAmount: number | null = null;

		// Handle horse selection
		const collector = response?.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === interaction.user.id,
			componentType: ComponentType.StringSelect,
			idle: 60_000,
		});

		// Flag to track if bet has been placed
		let betPlaced = false;

		collector?.on("collect", async (select) => {
			// Get fresh user data
			await this.User.GetInfo();

			// Handle horse selection
			if (select.customId === "horse_select") {
				selectedHorse = parseInt(select.values[0]);

				// If both horse and amount are selected, place bet
				if (selectedHorse && selectedAmount && !betPlaced) {
					betPlaced = true;
					await this.PlaceBetFromInteraction(select, race.id, selectedHorse, selectedAmount);
				}
				else if (!betPlaced) {
					horseSelect.setDisabled(true);
					await select.update({
						components: [container, ...components.map(row => row)],
					});
				}
			}

			// Handle amount selection
			else if (select.customId === "amount_select") {
				selectedAmount = parseInt(select.values[0]);

				// If both horse and amount are selected, place bet
				if (selectedHorse && selectedAmount && !betPlaced) {
					betPlaced = true;
					await this.PlaceBetFromInteraction(select, race.id, selectedHorse, selectedAmount);
				}
				else if (!betPlaced) {
					amountSelect.setDisabled(true);
					await select.update({
						components: [container, ...components.map(row => row)],
					});
				}
			}

			// // Handle custom amount button
			// else if (i.customId === "custom_amount") {
			// 	const modal = new ModalBuilder()
			// 		.setCustomId("bet_amount_modal")
			// 		.setTitle(Strings[this.User.Language].customAmount);
			//
			// 	const amountInput = new TextInputBuilder()
			// 		.setCustomId("amount_input")
			// 		.setLabel(Strings[this.User.Language].betAmount)
			// 		.setStyle(TextInputStyle.Short)
			// 		.setPlaceholder(`Max: ${formatMoney(maxBet, this.User.Language)}`)
			// 		.setRequired(true);
			//
			// 	const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(amountInput);
			// 	modal.addComponents(firstActionRow);
			//
			//
			// 	await i.showModal(modal);
			//
			// 	try {
			// 		const modalSubmit = await i.awaitModalSubmit({
			// 			filter: (interaction) => interaction.customId === "bet_amount_modal",
			// 			time: 30_000,
			// 		});
			//
			// 		const inputValue = modalSubmit.fields.getTextInputValue("amount_input");
			// 		// Check if the input contains at least one digit
			// 		if (!/\d/.test(inputValue)) {
			// 			// Input doesn't contain any digits
			// 			const errorEmbed = new CustomEmbedBuilder()
			// 				.setColor(Colors.Red)
			// 				.setDescription(Strings[this.User.Language].invalidAmount)
			// 				.setUserFooter({
			// 					nickname: this.User.Nickname,
			// 					image: modalSubmit.user.avatarURL(),
			// 					text: formatMoney(this.User.Money, this.User.Language),
			// 				});
			//
			// 			await modalSubmit.reply({
			// 				embeds: [errorEmbed],
			// 				flags: [MessageFlags.Ephemeral],
			// 			});
			// 			return;
			// 		}
			//
			// 		const amount = Number(inputValue.replace(/\D/g, ""));
			// 		selectedAmount = Math.min(amount, maxBet);
			//
			// 		if (selectedHorse && selectedAmount && !betPlaced) {
			// 			betPlaced = true;
			// 			await this.PlaceBetFromInteraction(i, race.id, selectedHorse, selectedAmount);
			// 		}
			// 		else if (!betPlaced) {
			// 			amountSelect.setDisabled(true);
			// 			await i.update({
			// 				components: components.map(row => row),
			// 			});
			// 		}
			// 		await modalSubmit.editReply({});
			// 	}
			// 	catch (error) {
			// 		Log.Warning(`Modal timed out or errored: ${error}`);
			// 	}
			// }
		});

		collector?.on("end", async () => {
			await disableButtons(interaction, container);
		});
	}

	// Place bet from interaction
	async PlaceBetFromInteraction(interaction: MessageComponentInteraction, raceId: number, horseNumber: number, amount: number): Promise<void> {
		const result = await this.PlaceBet(raceId, horseNumber, amount);

		const s = Strings[this.User.Language];

		const horse = HorseData.find(h => h.id === horseNumber);
		const horseName = horse ? (this.User.Language === Language.Portuguese ? horse.namePt :
			(this.User.Language === Language.Spanish ? horse.nameEs : horse.nameEn)) : `${s.horse} ${horseNumber}`;

		const container = new CustomContainerBuilder()
			.setUser(this.User)
			.setAccentColor(result.success ? CrColors.Casino : Colors.Red)
			.addTexts([result.success
				? s.betPlacedWithName(
					horse?.emoji || "",
					horseName,
					formatMoney(amount, this.User.Language),
					showTime(
						(await HorseRaces.findByPk(raceId))?.raceTime.getTime() || 0,
						true,
					),
				)
				: result.message])
			.addFooter({
				text: formatMoney(this.User.Money, this.User.Language),
			});

		await replyInteraction(interaction, {
			components: [container],
		});
	}

	// Schedule a notification for a race
	static async ScheduleRaceNotification(race: HorseRaces): Promise<void> {
		// Find the previous race
		const previousRace = await HorseRaces.findOne({
			where: {
				id: { [Op.lt]: race.id },
				isFinished: true,
			},
			order: [["id", "DESC"]],
		});

		// If there's no previous race, don't send notifications
		if (!previousRace) {
			Log.Info(`No previous race found. No notifications scheduled for race ${race.id}.`);
			return;
		}

		// Find users who participated in the previous race
		const previousBets = await HorseRaceBets.findAll({
			where: {
				raceId: previousRace.id,
			},
			attributes: ["userId"],
			group: ["userId"],
		});

		// If no users participated in the previous race, don't send notifications
		if (previousBets.length === 0) {
			Log.Info(`No users participated in the previous race. No notifications scheduled for race ${race.id}.`);
			return;
		}

		// Schedule notification 30 minutes before race for users who participated in the previous race
		for (const bet of previousBets) {
			const notification = new Notification();
			notification.UserId = bet.userId;
			notification.Type = NotificationType.HorseRace;
			notification.Date = new Date(race.raceTime.getTime() - 30 * 60 * 1000);
			await notification.Create();
		}

		Log.Info(`Scheduled horse race notifications for race ${race.id} at ${race.raceTime} for ${previousBets.length} users who participated in the previous race.`);
	}

	// Run a race and determine winners
	static async RunRace(raceId: number): Promise<void> {
		const race = await HorseRaces.findByPk(raceId);
		if (!race || race.isFinished) {
			return;
		}

		// Find all bets for this race
		const allBets = await HorseRaceBets.findAll({
			where: {
				raceId: raceId,
			},
		});

		// If no bets were placed, don't save the race and don't schedule a new one
		if (allBets.length === 0) {
			Log.Info(`Horse race ${raceId} had no bets. Skipping race processing.`);
			// Delete the race from the database
			await race.destroy();
			// Schedule next race
			await HorseRacing.ScheduleNextRace();
			return;
		}

		// Determine winning horse (1 to HORSE_COUNT)
		const winningHorse = Math.floor(Math.random() * HORSE_COUNT) + 1;
		race.winningHorse = winningHorse;
		race.isFinished = true;
		await race.save();

		// Get the winning horse data
		const winningHorseData = HorseData.find(h => h.id === winningHorse);

		// Find all winning bets
		const winningBets = allBets.filter(bet => bet.horseNumber === winningHorse);

		// Find all losing bets
		const losingBets = allBets.filter(bet => bet.horseNumber !== winningHorse);

		// If no winners, casino keeps the money but still notify all bettors
		if (winningBets.length === 0) {
			Log.Info(`Horse race ${raceId} finished with no winners. Horse ${winningHorse} (${winningHorseData?.nameEn}) won.`);

			// Update all bets as lost
			for (const bet of allBets) {
				bet.hasWon = false;
				await bet.save();

				// Send notification to user
				const user = await new User(bet.userId).GetInfo();
				if (user) {
					// Get winning horse name based on user language
					const winningHorseName = user.Language === Language.Portuguese ? winningHorseData?.namePt :
						(user.Language === Language.Spanish ? winningHorseData?.nameEs : winningHorseData?.nameEn);

					// Get user's bet horse data
					const userHorseData = HorseData.find(h => h.id === bet.horseNumber);
					const userHorseName = user.Language === Language.Portuguese ? userHorseData?.namePt :
						(user.Language === Language.Spanish ? userHorseData?.nameEs : userHorseData?.nameEn);

					const s = Strings[user.Language];

					// Send notification with horse names and emojis if available
					if (winningHorseData && userHorseData) {
						await sendPrivateMessage(
							user.Id,
							s.raceLostWithName(
								winningHorseData.emoji,
								winningHorseName || "",
								userHorseData.emoji,
								userHorseName || "",
							),
							CrColors.Casino,
						);
					}
					else {
						await sendPrivateMessage(
							user.Id,
							s.raceLost(winningHorse, bet.horseNumber),
							CrColors.Casino,
						);
					}
				}
			}

			// Schedule next race
			await HorseRacing.ScheduleNextRace();
			return;
		}

		// Calculate winnings for each winner proportionally to their bet amount
		const totalPrize = race.totalAmount;
		const totalWinningBetsAmount = winningBets.reduce((sum, bet) => sum + bet.amount, 0);

		// First, collect information about all winners
		const winners: {
			userId: string;
			nickname: string;
			className: string;
			classEmoji: string;
			proportionalPrize: number;
			bet: HorseRaceBets;
			user: User;
		}[] = [];

		// Collect winner information
		for (const bet of winningBets) {
			// Calculate proportional prize: (user bet / total winning bets) * total prize pool
			const proportionalPrize = Math.floor((bet.amount / totalWinningBetsAmount) * totalPrize);

			// Get user info
			const user = await new User(bet.userId).GetInfo();
			if (user) {
				winners.push({
					userId: user.Id,
					nickname: user.Nickname,
					className: ClassList[user.Class].Name[user.Language],
					classEmoji: ClassList[user.Class].Image.Emote.String,
					proportionalPrize,
					bet,
					user,
				});
			}
		}

		// Now update database and send notifications
		for (const winner of winners) {
			// Update bet record
			winner.bet.hasWon = true;
			winner.bet.winnings = winner.proportionalPrize;
			await winner.bet.save();

			// Update user's money and casino stats
			winner.user.Money += winner.proportionalPrize;
			winner.user.Casino.WinCount += 1;
			winner.user.Casino.WinSum += winner.proportionalPrize;
			await winner.user.Update();

			// Get horse name based on user language
			const horseName = winner.user.Language === Language.Portuguese ? winningHorseData?.namePt :
				(winner.user.Language === Language.Spanish ? winningHorseData?.nameEs : winningHorseData?.nameEn);

			// Send notification to user
			const s = Strings[winner.user.Language];

			// Format winners list for notification
			let winnersText = "";
			if (winners.length > 1) { // Only show winners list if there's more than one winner
				winnersText = "\n\n### " + s.winners + "\n";
				for (const otherWinner of winners) {
					// Skip the current user in the winners list
					if (otherWinner.userId === winner.userId) continue;
					winnersText += `${otherWinner.classEmoji} ${otherWinner.nickname}\n`;
				}
			}

			await sendPrivateMessage(
				winner.user.Id,
				(winningHorseData
					? s.raceWonWithName(winningHorseData.emoji, horseName || "", formatMoney(winner.proportionalPrize, winner.user.Language))
					: s.raceWon(winningHorse, formatMoney(winner.proportionalPrize, winner.user.Language))) + winnersText,
				CrColors.Casino,
			);
		}

		// Notify losers
		for (const bet of losingBets) {
			bet.hasWon = false;
			await bet.save();

			// Send notification to user
			const user = await new User(bet.userId).GetInfo();
			if (user) {
				user.Casino.LoseCount += 1;
				user.Casino.LoseSum += bet.amount;
				// Get winning horse name based on user language
				const winningHorseName = user.Language === Language.Portuguese ? winningHorseData?.namePt :
					(user.Language === Language.Spanish ? winningHorseData?.nameEs : winningHorseData?.nameEn);

				// Get user's bet horse data
				const userHorseData = HorseData.find(h => h.id === bet.horseNumber);
				const userHorseName = user.Language === Language.Portuguese ? userHorseData?.namePt :
					(user.Language === Language.Spanish ? userHorseData?.nameEs : userHorseData?.nameEn);

				const s = Strings[user.Language];

				// Format winners list for notification
				let winnersText = "";
				if (winners.length > 0) {
					winnersText = "\n\n### " + s.winners + "\n";
					for (const winner of winners) {
						winnersText += `${winner.classEmoji} ${winner.nickname}\n`;
					}
				}

				// Send notification with horse names and emojis if available
				if (winningHorseData && userHorseData) {
					await sendPrivateMessage(
						user.Id,
						s.raceLostWithName(
							winningHorseData.emoji,
							winningHorseName || "",
							userHorseData.emoji,
							userHorseName || "",
						) + winnersText,
						CrColors.Casino,
					);
				}
				else {
					await sendPrivateMessage(
						user.Id,
						s.raceLost(winningHorse, bet.horseNumber) + winnersText,
						CrColors.Casino,
					);
				}
			}
		}

		const winningHorseName = winningHorseData?.nameEn || `Horse ${winningHorse}`;
		Log.Info(`Horse race ${raceId} finished. ${winningHorseData?.emoji || ""} ${winningHorseName} won. ${winningBets.length} winners sharing ${formatMoney(totalPrize, Language.English)}.`);

		// Schedule next race
		await HorseRacing.ScheduleNextRace();
	}

	// Schedule the next race
	static async ScheduleNextRace(): Promise<void> {
		const nextRaceTime = addHours(new Date(), 4);
		const newRace = await HorseRaces.create({
			raceTime: nextRaceTime,
		});

		// Schedule notification for this race
		await HorseRacing.ScheduleRaceNotification(newRace);

		Log.Info(`Next horse race scheduled for ${nextRaceTime}.`);
	}

	// Check for races that should have run but haven't
	static async CheckPendingRaces(): Promise<void> {
		const now = new Date();
		const pendingRaces = await HorseRaces.findAll({
			where: {
				raceTime: {
					[Op.lt]: now,
				},
				isFinished: false,
			},
		});

		for (const race of pendingRaces) {
			await HorseRacing.RunRace(race.id);
		}
	}

	// Initialize horse racing system
	static async Initialize(): Promise<void> {
		// Check for any pending races
		await HorseRacing.CheckPendingRaces();

		// Check if there's an upcoming race
		const nextRace = await HorseRacing.GetNextRace();
		if (!nextRace) {
			// Schedule a new race
			await HorseRacing.ScheduleNextRace();
		}

		// Set up interval to check for races that should run
		setInterval(HorseRacing.CheckPendingRaces, 60 * 1000); // Check every minute

		Log.Info("Horse racing system initialized.");
	}
}

const Strings = {
	[Language.English]: {
		invalidHorse: (count: number) => `Invalid horse number. Please choose a horse between 1 and ${count}.`,
		alreadyBet: "You have already placed a bet on this race.",
		betTooHigh: (max: string) => `Your bet is too high. Maximum bet for you is ${max}.`,
		raceNotFound: "Race not found.",
		raceClosed: "Betting for this race is closed. It will start soon.",
		betPlaced: (horse: number, amount: string, time: string) => `You bet ${amount} on horse ${horse}. The race will start ${time}.`,
		betPlacedWithName: (emoji: string, horseName: string, amount: string, time: string) => `You bet ${amount} on ${emoji} **${horseName}**. The race will start ${time}.`,
		winners: "Winners",
		noRaceScheduled: (time: string) => `# Horse Racing
No race is currently scheduled. A new race has been scheduled to start ${time}.

Place your bets using the horse selector below.`,
		nextRace: (time: Date, totalAmount: string, totalBets: number, betInfo: string, maxBet: string, horseList: string, hasUserBet: boolean) => `# Horse Racing
Next race starts ${showTime(time.getTime(), true)}. ${time.getTime() - Date.now() < 5 * 60 * 1000 ? "**Bets closed!**" : ""}
### Race Information
Total pot: ${totalAmount}
Total bets: ${totalBets}
Your bet: ${betInfo}${hasUserBet ? "\n**You have already placed a bet on this race.**" : ""}
Your max bet: ${maxBet}
### Horses in this race
${horseList}

-# ${hasUserBet ? "Your bet has been placed. Wait for the race to start." : "Select a horse and bet amount below to place your bet."}`,
		noBet: "None",
		userBet: (horse: number, amount: string) => `Horse ${horse} - ${amount}`,
		raceWon: (horse: number, amount: string) => `# Horse Racing Results ${EmoteString.Casino}
Horse ${horse} won the race!

You bet on the winning horse and won ${amount}!`,
		raceWonWithName: (emoji: string, horseName: string, amount: string) => `# Horse Racing Results ${EmoteString.Casino}
${emoji} **${horseName}** won the race!

You bet on the winning horse and won ${amount}!`,
		raceLost: (winningHorse: number, userHorse: number) => `# Horse Racing Results ${EmoteString.Casino}
Horse ${winningHorse} won the race!

You bet on horse ${userHorse} and lost your bet.`,
		raceLostWithName: (winningEmoji: string, winningName: string, userEmoji: string, userName: string) => `# Horse Racing Results ${EmoteString.Casino}
${winningEmoji} **${winningName}** won the race!

You bet on ${userEmoji} **${userName}** and lost your bet.`,
		raceStartingSoon: (time: string) => `# Horse Racing
A race is starting ${time}! Place your bets now using the \`/horserace\` command.`,
		horse: "Horse",
		selectHorse: "Select a horse",
		selectAmount: "Select bet amount",
		horseOption: (id: number) => `Horse ${id}`,
		betAmount: "Amount to bet",
		customAmount: "Use custom bet",
		invalidAmount: "Invalid amount. Please enter a valid number.",
	},
	[Language.Portuguese]: {
		invalidHorse: (count: number) => `Número de cavalo inválido. Por favor, escolha um cavalo entre 1 e ${count}.`,
		alreadyBet: "Você já fez uma aposta nesta corrida.",
		betTooHigh: (max: string) => `Sua aposta é muito alta. A aposta máxima para você é ${max}.`,
		raceNotFound: "Corrida não encontrada.",
		raceClosed: "As apostas para esta corrida estão encerradas. Ela começará em breve.",
		betPlaced: (horse: number, amount: string, time: string) => `Você apostou ${amount} no cavalo ${horse}. A corrida começará ${time}.`,
		betPlacedWithName: (emoji: string, horseName: string, amount: string, time: string) => `Você apostou ${amount} no ${emoji} **${horseName}**. A corrida começará ${time}.`,
		winners: "Vencedores",
		noRaceScheduled: (time: string) => `# Corrida de Cavalos
Nenhuma corrida está agendada no momento. Uma nova corrida foi agendada para começar ${time}.

Faça suas apostas usando o seletor de cavalos abaixo.`,
		nextRace: (time: Date, totalAmount: string, totalBets: number, betInfo: string, maxBet: string, horseList: string, hasUserBet: boolean) => `# Corrida de Cavalos
Próxima corrida começa ${showTime(time.getTime(), true)}. ${time.getTime() - Date.now() < 5 * 60 * 1000 ? "**Apostas encerradas!**" : ""}
### Informações da Corrida
Valor total: ${totalAmount}
Total de apostas: ${totalBets}
Sua aposta: ${betInfo}${hasUserBet ? "\n**Você já fez uma aposta nesta corrida.**" : ""}
Sua aposta máxima: ${maxBet}
### Cavalos nesta corrida
${horseList}

-# ${hasUserBet ? "Sua aposta foi feita. Aguarde o início da corrida." : "Selecione um cavalo e um valor de aposta abaixo para fazer sua aposta."}`,
		noBet: "Nenhuma",
		userBet: (horse: number, amount: string) => `Cavalo ${horse} - ${amount}`,
		raceWon: (horse: number, amount: string) => `# Resultados da Corrida de Cavalos ${EmoteString.Casino}
O cavalo ${horse} venceu a corrida!

Você apostou no cavalo vencedor e ganhou ${amount}!`,
		raceWonWithName: (emoji: string, horseName: string, amount: string) => `# Resultados da Corrida de Cavalos ${EmoteString.Casino}
${emoji} **${horseName}** venceu a corrida!

Você apostou no cavalo vencedor e ganhou ${amount}!`,
		raceLost: (winningHorse: number, userHorse: number) => `# Resultados da Corrida de Cavalos ${EmoteString.Casino}
O cavalo ${winningHorse} venceu a corrida!

Você apostou no cavalo ${userHorse} e perdeu sua aposta.`,
		raceLostWithName: (winningEmoji: string, winningName: string, userEmoji: string, userName: string) => `# Resultados da Corrida de Cavalos ${EmoteString.Casino}
${winningEmoji} **${winningName}** venceu a corrida!

Você apostou no ${userEmoji} **${userName}** e perdeu sua aposta.`,
		raceStartingSoon: (time: string) => `# Corrida de Cavalos ${EmoteString.Casino}
Uma corrida está começando ${time}! Faça suas apostas agora usando o comando \`/corridadecavalos\`.`,
		horse: "Cavalo",
		selectHorse: "Selecione um cavalo",
		selectAmount: "Selecione o valor da aposta",
		horseOption: (id: number) => `Cavalo ${id}`,
		betAmount: "Valor para apostar",
		customAmount: "Usar aposta personalizada",
		invalidAmount: "Valor inválido. Por favor, digite um número válido.",
	},
	[Language.Spanish]: {
		invalidHorse: (count: number) => `Número de caballo inválido. Por favor, elige un caballo entre 1 y ${count}.`,
		alreadyBet: "Ya has realizado una apuesta en esta carrera.",
		betTooHigh: (max: string) => `Tu apuesta es demasiado alta. La apuesta máxima para ti es ${max}.`,
		raceNotFound: "Carrera no encontrada.",
		raceClosed: "Las apuestas para esta carrera están cerradas. Comenzará pronto.",
		betPlaced: (horse: number, amount: string, time: string) => `Has apostado ${amount} al caballo ${horse}. La carrera comenzará ${time}.`,
		betPlacedWithName: (emoji: string, horseName: string, amount: string, time: string) => `Has apostado ${amount} al ${emoji} **${horseName}**. La carrera comenzará ${time}.`,
		winners: "Ganadores",
		noRaceScheduled: (time: string) => `# Carrera de Caballos
No hay ninguna carrera programada actualmente. Se ha programado una nueva carrera para comenzar ${time}.

Haz tus apuestas usando el selector de caballos a continuación.`,
		nextRace: (time: Date, totalAmount: string, totalBets: number, betInfo: string, maxBet: string, horseList: string, hasUserBet: boolean) => `# Carrera de Caballos
La próxima carrera comienza ${showTime(time.getTime(), true)}. ${time.getTime() - Date.now() < 5 * 60 * 1000 ? "**Apuestas cerradas!**" : ""}
### Información de la Carrera
Bote total: ${totalAmount}
Total de apuestas: ${totalBets}
Tu apuesta: ${betInfo}${hasUserBet ? "\n**Ya has realizado una apuesta en esta carrera.**" : ""}
Tu apuesta máxima: ${maxBet}
### Caballos en esta carrera
${horseList}

-# ${hasUserBet ? "Tu apuesta ha sido realizada. Espera a que comience la carrera." : "Selecciona un caballo y una cantidad de apuesta a continuación para realizar tu apuesta."}`,
		noBet: "Ninguna",
		userBet: (horse: number, amount: string) => `Caballo ${horse} - ${amount}`,
		raceWon: (horse: number, amount: string) => `# Resultados de la Carrera de Caballos ${EmoteString.Casino}
¡El caballo ${horse} ganó la carrera!

¡Apostaste al caballo ganador y ganaste ${amount}!`,
		raceWonWithName: (emoji: string, horseName: string, amount: string) => `# Resultados de la Carrera de Caballos ${EmoteString.Casino}
${emoji} **${horseName}** ganó la carrera!

¡Apostaste al caballo ganador y ganaste ${amount}!`,
		raceLost: (winningHorse: number, userHorse: number) => `# Resultados de la Carrera de Caballos ${EmoteString.Casino}
¡El caballo ${winningHorse} ganó la carrera!

Apostaste al caballo ${userHorse} y perdiste tu apuesta.`,
		raceLostWithName: (winningEmoji: string, winningName: string, userEmoji: string, userName: string) => `# Resultados de la Carrera de Caballos ${EmoteString.Casino}
${winningEmoji} **${winningName}** ganó la carrera!

Apostaste al ${userEmoji} **${userName}** y perdiste tu apuesta.`,
		raceStartingSoon: (time: string) => `# Carrera de Caballos ${EmoteString.Casino}
¡Una carrera está comenzando ${time}! Haz tus apuestas ahora usando el comando \`/horserace\`.`,
		horse: "Caballo",
		selectHorse: "Selecciona un caballo",
		selectAmount: "Selecciona cantidad de apuesta",
		horseOption: (id: number) => `Caballo ${id}`,
		betAmount: "Cantidad para apostar",
		customAmount: "Usar apuesta personalizada",
		invalidAmount: "Cantidad inválida. Por favor, ingrese un número válido.",
	},
} as const;
