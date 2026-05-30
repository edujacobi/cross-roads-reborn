import { CrColors } from "#bot/utils/colors";
import { sendPrivateMessage } from "#bot/utils/discordInteractions";
import { EmoteString } from "#bot/utils/emotes";
import { formatMoney } from "#bot/utils/ui";
import { HorseRaceBets } from "#core/database/HorseRaceBets";
import { HorseRaces } from "#core/database/HorseRaces";
import { HorseList, type IHorse } from "#core/types/Horses";
import { Log, logger } from "#shared/log";
import { addHours } from "date-fns/addHours";
import { Op } from "sequelize";
import { Casino } from "./Casino";
import { Language, type Localization } from "./Language";
import { Notification, NotificationType } from "./Notification";
import { User } from "./User";

export interface RaceInfo {
	race: HorseRaces;
	userBet: HorseRaceBets | null;
	maxBet: number;
	isBettingOpen: boolean;
}

export enum BetFailureReason {
	NotEnoughMoney,
	BetTooLow,
	BetTooHigh,
	AlreadyBet,
	RaceClosed,
	RaceNotFound,
	CannotPlay,
}

export type BetResult =
	| { Success: true; Horse: IHorse; Amount: number; RaceTime: Date }
	| { Success: false; Reason: BetFailureReason; Message: string };


export class HorseRacing {
	User: User;

	static readonly RACE_INTERVAL_HOURS = 4;
	static readonly MIN_BET = 5_000;
	static readonly MAX_BET_CAP = 1_000_000;

	constructor(user: User) {
		this.User = user;
	}

	/**
	 * Maximum amount this user may bet.
	 * @returns The maximum amount this user may bet.
	 */
	CalculateMaxBet(): number {
		return Math.min(this.User.Money, HorseRacing.MAX_BET_CAP);
	}

	/**
	 * Get the next upcoming race and the user's existing bet, if any.
	 * @returns RaceInfo
	 */
	async GetRaceInfo(): Promise<RaceInfo | null> {
		const race = await HorseRacing.GetNextRace();
		if (!race) {
			return null;
		}

		const userBet = await HorseRaceBets.findOne({
			where: { userId: this.User.Id, raceId: race.id },
		});

		const maxBet = this.CalculateMaxBet();
		const isBettingOpen = race.raceTime.getTime() - Date.now() >= 5 * 60 * 1_000;

		return { race, userBet, maxBet, isBettingOpen };
	}

	/**
	 * Validate and place a bet.
	 * @param raceId The Id of the race to bet on.
	 * @param horseId The Id of the horse to bet on.
	 * @param amount The amount to bet.
	 * @returns BetResult
	 */
	async PlaceBet(raceId: number, horseId: number, amount: number): Promise<BetResult> {
		const horse = HorseList.find(h => h.Id === horseId);
		if (!horse) {
			return {
				Success: false,
				Reason: BetFailureReason.RaceNotFound,
				Message: `Invalid horse id: ${horseId}`,
			};
		}

		// --- Business-rule validations ---
		const { canPlay, message: canPlayMessage } = await Casino.CanUserPlayGame(this.User, amount);
		if (!canPlay) {
			return { Success: false, Reason: BetFailureReason.CannotPlay, Message: canPlayMessage };
		}

		if (amount < HorseRacing.MIN_BET) {
			return { Success: false, Reason: BetFailureReason.BetTooLow, Message: "" };
		}

		const maxBet = this.CalculateMaxBet();
		if (amount > maxBet) {
			return { Success: false, Reason: BetFailureReason.BetTooHigh, Message: formatMoney(maxBet, this.User.Language) };
		}

		const race = await HorseRaces.findByPk(raceId);
		if (!race || race.isFinished) {
			return { Success: false, Reason: BetFailureReason.RaceNotFound, Message: "" };
		}

		if (race.raceTime.getTime() - Date.now() < 5 * 60 * 1_000) {
			return { Success: false, Reason: BetFailureReason.RaceClosed, Message: "" };
		}

		const existing = await HorseRaceBets.findOne({
			where: { userId: this.User.Id, raceId },
		});
		if (existing) {
			return { Success: false, Reason: BetFailureReason.AlreadyBet, Message: "" };
		}

		await HorseRaceBets.create({
			userId: this.User.Id,
			raceId,
			horseNumber: horseId,
			amount,
		});

		race.totalBets += 1;
		race.totalAmount += amount;
		await race.save();

		this.User.Money -= amount;
		await this.User.Update({ money: this.User.Money });

		Log.Info(`User ${this.User.Nickname} bet ${formatMoney(amount, Language.English)} on horse ${horse.Name[Language.English]} (x${horse.Multiplier}) in race ${raceId}.`);

		return { Success: true, Horse: horse, Amount: amount, RaceTime: race.raceTime };
	}

	/**
	 * Returns the next unfinished race, or null if none exists.
	 * @returns The next unfinished race.
	 */
	static async GetNextRace(): Promise<HorseRaces | null> {
		return HorseRaces.findOne({
			where: { isFinished: false },
			order: [["raceTime", "ASC"]],
		});
	}

	/**
	 * Creates a new race with RACE_INTERVAL_HOURS from now.
	 * @returns The scheduled race.
	 */
	static async ScheduleNextRace(): Promise<HorseRaces> {
		const raceTime = addHours(new Date(), HorseRacing.RACE_INTERVAL_HOURS);
		const race = await HorseRaces.create({ raceTime });
		await HorseRacing.ScheduleRaceNotification(race);
		Log.Info(`Next horse race scheduled for ${raceTime.toISOString()}.`);
		return race;
	}

	/**
	 * Schedules a DM notification 30 minutes before the race for previous participants.
	 * @param race The race to schedule notifications for.
	 */
	static async ScheduleRaceNotification(race: HorseRaces) {
		const previousRace = await HorseRaces.findOne({
			where: { id: { [Op.lt]: race.id }, isFinished: true },
			order: [["id", "DESC"]],
		});

		if (!previousRace) {
			Log.Info(`No previous race found — skipping notifications for race ${race.id}.`);
			return;
		}

		const previousBets = await HorseRaceBets.findAll({
			where: { raceId: previousRace.id },
			attributes: ["userId"],
			group: ["userId"],
		});

		if (previousBets.length === 0) {
			Log.Info(`No previous participants — skipping notifications for race ${race.id}.`);
			return;
		}

		for (const bet of previousBets) {
			const notification = new Notification();
			notification.UserId = bet.userId;
			notification.Type = NotificationType.HorseRace;
			notification.Date = new Date(race.raceTime.getTime() - 30 * 60 * 1_000);
			await notification.Create();
		}

		Log.Info(`Scheduled horse race notifications for race ${race.id} for ${previousBets.length} users.`);
	}

	/**
	 * Runs a race: picks a winner by weighted random, pays fixed-odds prizes,
	 * notifies all participants, and schedules the next race.
	 */
	static async RunRace(raceId: number) {
		const race = await HorseRaces.findByPk(raceId);
		if (!race || race.isFinished) {
			return;
		}

		const allBets = await HorseRaceBets.findAll({ where: { raceId } });

		// No bets → discard and move on
		if (allBets.length === 0) {
			Log.Info(`Horse race ${raceId} had no bets — discarding.`);
			await race.destroy();
			await HorseRacing.ScheduleNextRace();
			return;
		}

		// Weighted-random winner selection
		const totalWeight = HorseList.reduce((sum, h) => sum + h.Weight, 0);
		let roll = Math.random() * totalWeight;
		let winningHorse = HorseList[HorseList.length - 1]!;
		for (const horse of HorseList) {
			roll -= horse.Weight;
			if (roll <= 0) {
				winningHorse = horse;
				break;
			}
		}

		race.winningHorse = winningHorse.Id;
		race.isFinished = true;
		await race.save();

		const winningBets = allBets.filter(b => b.horseNumber === winningHorse.Id);
		const losingBets = allBets.filter(b => b.horseNumber !== winningHorse.Id);

		Log.Success(`Horse race ${raceId}: ${winningHorse.Name[Language.English]} (x${winningHorse.Multiplier}) won. ${winningBets.length} winner(s), ${losingBets.length} loser(s).`);

		// Collect winner data (shown in notifications)
		const winners: { nameWithImage: string; prize: number }[] = [];

		// --- Pay winners ---
		for (const bet of winningBets) {
			bet.hasWon = true;
			const prize = Math.floor(bet.amount * winningHorse.Multiplier);
			bet.winnings = prize;
			await bet.save();

			const user = await new User(bet.userId).GetInfo();
			if (!user) continue;

			await Casino.FinishUserGameWithWin(user, prize);

			winners.push({ nameWithImage: user.GetNameWithImage(), prize });

			const s = Strings[user.Language];
			const horseName = winningHorse.Name[user.Language];

			const otherWinners = winners.filter(w => w.nameWithImage !== user.GetNameWithImage());
			const winnersSection = otherWinners.length > 0
				? `\n\n### ${s.otherWinners}\n${otherWinners.map(w => `${w.nameWithImage} (**${formatMoney(w.prize, user.Language)}**)`).join("\n")}`
				: "";

			await sendPrivateMessage(
				user.Id,
				s.raceWon(winningHorse.Emote, horseName, formatMoney(prize, user.Language)) + winnersSection,
				CrColors.Casino,
			);
		}

		// --- Notify losers ---
		for (const bet of losingBets) {
			bet.hasWon = false;
			await bet.save();

			const user = await new User(bet.userId).GetInfo();
			if (!user) continue;

			await Casino.FinishUserGameWithLossNoSubtraction(user, bet.amount);

			const userHorse = HorseList.find(h => h.Id === bet.horseNumber)!;
			const winningHorseName = winningHorse.Name[user.Language];
			const userHorseName = userHorse.Name[user.Language];

			const s = Strings[user.Language];
			const winnersSection = winners.length > 0
				? `\n\n### ${s.winners}\n${winners.map(w => `${w.nameWithImage} (**${formatMoney(w.prize, user.Language)}**)`).join("\n")}`
				: "";

			await sendPrivateMessage(
				user.Id,
				s.raceLost(winningHorse.Emote, winningHorseName, userHorse.Emote, userHorseName) + winnersSection,
				CrColors.Casino,
			);
		}

		await HorseRacing.ScheduleNextRace();
	}

	/**
	 * Runs any races that are overdue.
	 * Called on startup and by the interval.
	 */
	static async CheckPendingRaces() {
		try {
			const pendingRaces = await HorseRaces.findAll({
				where: { raceTime: { [Op.lt]: new Date() }, isFinished: false },
			});
			for (const race of pendingRaces) {
				await HorseRacing.RunRace(race.id);
			}
		}
		catch (error) {
			Log.Error(`Failed to check pending horse races: ${error}`);
		}
	}

	/**
	 * Boot-time initialiser — call once from the ready event.
	 */
	static async Initialize() {
		await HorseRacing.CheckPendingRaces();

		const nextRace = await HorseRacing.GetNextRace();
		if (!nextRace) {
			await HorseRacing.ScheduleNextRace();
		}

		setInterval(HorseRacing.CheckPendingRaces, 60_000);
		logger.info("Horse racing system initialized.");
	}
}

const Strings = {
	[Language.English]: {
		winners: "Winners",
		otherWinners: "Other winners",
		raceWon: (emoji: string, name: string, prize: string) => `# ${EmoteString.HorseRacing} Horse Race Results\n### ${emoji} ${name} won the race!\n\nYou bet on the winning horse and won **${prize}**! 🎉`,
		raceLost: (winEmoji: string, winName: string, userEmoji: string, userName: string) => `# ${EmoteString.HorseRacing} Horse Race Results\n### ${winEmoji} ${winName} won the race!\n\nYou bet on ${userEmoji} **${userName}** and lost.`,
	},
	[Language.Portuguese]: {
		winners: "Vencedores",
		otherWinners: "Outros vencedores",
		raceWon: (emoji: string, name: string, prize: string) => `# ${EmoteString.HorseRacing} Resultados da Corrida\n### ${emoji} ${name} venceu a corrida!\n\nVocê apostou no cavalo vencedor e ganhou **${prize}**! 🎉`,
		raceLost: (winEmoji: string, winName: string, userEmoji: string, userName: string) => `# ${EmoteString.HorseRacing} Resultados da Corrida\n### ${winEmoji} ${winName} venceu a corrida!\n\nVocê apostou no ${userEmoji} **${userName}** e perdeu.`,
	},
	[Language.Spanish]: {
		winners: "Ganadores",
		otherWinners: "Otros ganadores",
		raceWon: (emoji: string, name: string, prize: string) => `# ${EmoteString.HorseRacing} Resultados de la Carrera\n### ${emoji} ${name} ganó la carrera!\n\n¡Apostaste al caballo ganador y ganaste **${prize}**! 🎉`,
		raceLost: (winEmoji: string, winName: string, userEmoji: string, userName: string) => `# ${EmoteString.HorseRacing} Resultados de la Carrera\n### ${winEmoji} ${winName} ganó la carrera!\n\nApostaste al ${userEmoji} **${userName}** e perdiste.`,
	},
} as const satisfies Localization;
