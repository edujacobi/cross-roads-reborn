"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HorseRacing = exports.BetFailureReason = void 0;
const colors_1 = require("#bot/utils/colors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const emotes_1 = require("#bot/utils/emotes");
const ui_1 = require("#bot/utils/ui");
const HorseRacingRepository_1 = require("#core/repositories/HorseRacingRepository");
const Horses_1 = require("#core/types/Horses");
const log_1 = require("#shared/log");
const addHours_1 = require("date-fns/addHours");
const Casino_1 = require("./Casino");
const Language_1 = require("./Language");
const Notification_1 = require("./Notification");
const User_1 = require("./User");
var BetFailureReason;
(function (BetFailureReason) {
    BetFailureReason[BetFailureReason["NotEnoughMoney"] = 0] = "NotEnoughMoney";
    BetFailureReason[BetFailureReason["BetTooLow"] = 1] = "BetTooLow";
    BetFailureReason[BetFailureReason["BetTooHigh"] = 2] = "BetTooHigh";
    BetFailureReason[BetFailureReason["AlreadyBet"] = 3] = "AlreadyBet";
    BetFailureReason[BetFailureReason["RaceClosed"] = 4] = "RaceClosed";
    BetFailureReason[BetFailureReason["RaceNotFound"] = 5] = "RaceNotFound";
    BetFailureReason[BetFailureReason["CannotPlay"] = 6] = "CannotPlay";
})(BetFailureReason || (exports.BetFailureReason = BetFailureReason = {}));
class HorseRacing {
    User;
    static RACE_INTERVAL_HOURS = 4;
    static MIN_BET = 5_000;
    static MAX_BET_CAP = 1_000_000;
    constructor(user) {
        this.User = user;
    }
    /**
     * Maximum amount this user may bet.
     * @returns The maximum amount this user may bet.
     */
    CalculateMaxBet() {
        return Math.min(this.User.Money, HorseRacing.MAX_BET_CAP);
    }
    /**
     * Get the next upcoming race and the user's existing bet, if any.
     * @returns RaceInfo
     */
    async GetRaceInfo() {
        const race = await HorseRacing.GetNextRace();
        if (!race) {
            return null;
        }
        const userBet = await HorseRacingRepository_1.HorseRacingRepository.FindBet(this.User.Id, race.id);
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
    async PlaceBet(raceId, horseId, amount) {
        const horse = Horses_1.HorseList.find(h => h.Id === horseId);
        if (!horse) {
            return {
                Success: false,
                Reason: BetFailureReason.RaceNotFound,
                Message: `Invalid horse id: ${horseId}`,
            };
        }
        // --- Business-rule validations ---
        const { canPlay, message: canPlayMessage } = await Casino_1.Casino.CanUserPlayGame(this.User, amount);
        if (!canPlay) {
            return { Success: false, Reason: BetFailureReason.CannotPlay, Message: canPlayMessage };
        }
        if (amount < HorseRacing.MIN_BET) {
            return { Success: false, Reason: BetFailureReason.BetTooLow, Message: "" };
        }
        const maxBet = this.CalculateMaxBet();
        if (amount > maxBet) {
            return { Success: false, Reason: BetFailureReason.BetTooHigh, Message: (0, ui_1.formatMoney)(maxBet, this.User.Language) };
        }
        const race = await HorseRacingRepository_1.HorseRacingRepository.FindRaceById(raceId);
        if (!race || race.isFinished) {
            return { Success: false, Reason: BetFailureReason.RaceNotFound, Message: "" };
        }
        if (race.raceTime.getTime() - Date.now() < 5 * 60 * 1_000) {
            return { Success: false, Reason: BetFailureReason.RaceClosed, Message: "" };
        }
        const existing = await HorseRacingRepository_1.HorseRacingRepository.FindBet(this.User.Id, raceId);
        if (existing) {
            return { Success: false, Reason: BetFailureReason.AlreadyBet, Message: "" };
        }
        if (!await Casino_1.Casino.StartUserGame(this.User)) {
            await this.User.GetInfo();
            const currentStatus = await Casino_1.Casino.CanUserPlayGame(this.User, amount);
            return { Success: false, Reason: BetFailureReason.CannotPlay, Message: currentStatus.message || "Você já está jogando no cassino." };
        }
        try {
            await HorseRacingRepository_1.HorseRacingRepository.CreateBet({
                userId: this.User.Id,
                raceId,
                horseNumber: horseId,
                amount,
            });
            await HorseRacingRepository_1.HorseRacingRepository.AddBetToRace(race.id, amount);
            this.User.Money -= amount;
            await this.User.Update({ money: this.User.Money });
            log_1.Log.Info(`User ${this.User.Nickname} bet ${(0, ui_1.formatMoney)(amount, Language_1.Language.English)} on horse ${horse.Name[Language_1.Language.English]} (x${horse.Multiplier}) in race ${raceId}.`);
            return { Success: true, Horse: horse, Amount: amount, RaceTime: race.raceTime };
        }
        finally {
            this.User.Casino.IsInGame = false;
            await this.User.Update({ casinoIsInGame: false });
        }
    }
    /**
     * Returns the next unfinished race, or null if none exists.
     * @returns The next unfinished race.
     */
    static async GetNextRace() {
        return HorseRacingRepository_1.HorseRacingRepository.FindNextRace();
    }
    /**
     * Creates a new race with RACE_INTERVAL_HOURS from now.
     * @returns The scheduled race.
     */
    static async ScheduleNextRace() {
        const raceTime = (0, addHours_1.addHours)(new Date(), HorseRacing.RACE_INTERVAL_HOURS);
        const race = await HorseRacingRepository_1.HorseRacingRepository.CreateRace({ raceTime });
        await HorseRacing.ScheduleRaceNotification(race);
        log_1.Log.Info(`Next horse race scheduled for ${raceTime.toISOString()}.`);
        return race;
    }
    /**
     * Schedules a DM notification 30 minutes before the race for previous participants.
     * @param race The race to schedule notifications for.
     */
    static async ScheduleRaceNotification(race) {
        const previousRace = await HorseRacingRepository_1.HorseRacingRepository.FindPreviousRace(race.id);
        if (!previousRace) {
            log_1.Log.Info(`No previous race found — skipping notifications for race ${race.id}.`);
            return;
        }
        const previousBets = await HorseRacingRepository_1.HorseRacingRepository.FindBetsForRace(previousRace.id);
        if (previousBets.length === 0) {
            log_1.Log.Info(`No previous participants — skipping notifications for race ${race.id}.`);
            return;
        }
        const uniqueUserIds = [...new Set(previousBets.map(b => b.userId))];
        for (const userId of uniqueUserIds) {
            const notification = new Notification_1.Notification();
            notification.UserId = userId;
            notification.Type = Notification_1.NotificationType.HorseRace;
            notification.Date = new Date(race.raceTime.getTime() - 30 * 60 * 1_000);
            await notification.Create();
        }
        log_1.Log.Info(`Scheduled horse race notifications for race ${race.id} for ${uniqueUserIds.length} users.`);
    }
    /**
     * Runs a race: picks a winner by weighted random, pays fixed-odds prizes,
     * notifies all participants, and schedules the next race.
     */
    static async RunRace(raceId) {
        const race = await HorseRacingRepository_1.HorseRacingRepository.FindRaceById(raceId);
        if (!race || race.isFinished) {
            return;
        }
        const allBets = await HorseRacingRepository_1.HorseRacingRepository.FindBetsForRace(raceId);
        // No bets → discard and move on
        if (allBets.length === 0) {
            log_1.Log.Info(`Horse race ${raceId} had no bets — discarding.`);
            await HorseRacingRepository_1.HorseRacingRepository.DestroyAllBets(); // Clear bets
            await HorseRacingRepository_1.HorseRacingRepository.UpdateRace(race.id, { isFinished: true }); // Finish empty race
            await HorseRacing.ScheduleNextRace();
            return;
        }
        // Weighted-random winner selection
        const totalWeight = Horses_1.HorseList.reduce((sum, h) => sum + h.Weight, 0);
        let roll = Math.random() * totalWeight;
        let winningHorse = Horses_1.HorseList[Horses_1.HorseList.length - 1];
        for (const horse of Horses_1.HorseList) {
            roll -= horse.Weight;
            if (roll <= 0) {
                winningHorse = horse;
                break;
            }
        }
        race.winningHorse = winningHorse.Id;
        race.isFinished = true;
        await HorseRacingRepository_1.HorseRacingRepository.UpdateRace(race.id, {
            winningHorse: race.winningHorse,
            isFinished: true,
        });
        const winningBets = allBets.filter(b => b.horseNumber === winningHorse.Id);
        const losingBets = allBets.filter(b => b.horseNumber !== winningHorse.Id);
        log_1.Log.Success(`Horse race ${raceId}: ${winningHorse.Name[Language_1.Language.English]} (x${winningHorse.Multiplier}) won. ${winningBets.length} winner(s), ${losingBets.length} loser(s).`);
        // Collect winner data (shown in notifications)
        const winners = [];
        // --- Pay winners ---
        for (const bet of winningBets) {
            bet.hasWon = true;
            const prize = Math.floor(bet.amount * winningHorse.Multiplier);
            bet.winnings = prize;
            await HorseRacingRepository_1.HorseRacingRepository.UpdateBet(bet.id, {
                hasWon: true,
                winnings: prize,
            });
            const user = await new User_1.User(bet.userId).GetInfo();
            if (!user)
                continue;
            await Casino_1.Casino.FinishUserGameWithWin(user, prize, bet.amount);
            winners.push({ nameWithImage: user.GetNameWithImage(), prize });
            const s = Strings[user.Language];
            const horseName = winningHorse.Name[user.Language];
            const otherWinners = winners.filter(w => w.nameWithImage !== user.GetNameWithImage());
            const winnersSection = otherWinners.length > 0
                ? `\n\n### ${s.otherWinners}\n${otherWinners.map(w => `${w.nameWithImage} (**${(0, ui_1.formatMoney)(w.prize, user.Language)}**)`).join("\n")}`
                : "";
            await (0, discordInteractions_1.sendPrivateMessage)(user.Id, s.raceWon(winningHorse.Emote, horseName, (0, ui_1.formatMoney)(prize, user.Language)) + winnersSection, colors_1.CrColors.Casino);
        }
        // --- Notify losers ---
        for (const bet of losingBets) {
            bet.hasWon = false;
            await HorseRacingRepository_1.HorseRacingRepository.UpdateBet(bet.id, { hasWon: false });
            const user = await new User_1.User(bet.userId).GetInfo();
            if (!user)
                continue;
            await Casino_1.Casino.FinishUserGameWithLossNoSubtraction(user, bet.amount);
            const userHorse = Horses_1.HorseList.find(h => h.Id === bet.horseNumber);
            const winningHorseName = winningHorse.Name[user.Language];
            const userHorseName = userHorse.Name[user.Language];
            const s = Strings[user.Language];
            const winnersSection = winners.length > 0
                ? `\n\n### ${s.winners}\n${winners.map(w => `${w.nameWithImage} (**${(0, ui_1.formatMoney)(w.prize, user.Language)}**)`).join("\n")}`
                : "";
            await (0, discordInteractions_1.sendPrivateMessage)(user.Id, s.raceLost(winningHorse.Emote, winningHorseName, userHorse.Emote, userHorseName) + winnersSection, colors_1.CrColors.Casino);
        }
        await HorseRacing.ScheduleNextRace();
    }
    /**
     * Runs any races that are overdue.
     * Called on startup and by the interval.
     */
    static async CheckPendingRaces() {
        try {
            const now = new Date();
            const pendingRaces = await HorseRacingRepository_1.HorseRacingRepository.FindPendingRaces(now);
            for (const race of pendingRaces) {
                await HorseRacing.RunRace(race.id);
            }
        }
        catch (error) {
            log_1.Log.Error(`Failed to check pending horse races: ${error}`);
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
        log_1.logger.info("Horse racing system initialized.");
    }
}
exports.HorseRacing = HorseRacing;
const Strings = {
    [Language_1.Language.English]: {
        winners: "Winners",
        otherWinners: "Other winners",
        raceWon: (emoji, name, prize) => `# ${emotes_1.EmoteString.HorseRacing} Horse Race Results\n### ${emoji} ${name} won the race!\n\nYou bet on the winning horse and won **${prize}**! 🎉`,
        raceLost: (winEmoji, winName, userEmoji, userName) => `# ${emotes_1.EmoteString.HorseRacing} Horse Race Results\n### ${winEmoji} ${winName} won the race!\n\nYou bet on ${userEmoji} **${userName}** and lost.`,
    },
    [Language_1.Language.Portuguese]: {
        winners: "Vencedores",
        otherWinners: "Outros vencedores",
        raceWon: (emoji, name, prize) => `# ${emotes_1.EmoteString.HorseRacing} Resultados da Corrida\n### ${emoji} ${name} venceu a corrida!\n\nVocê apostou no cavalo vencedor e ganhou **${prize}**! 🎉`,
        raceLost: (winEmoji, winName, userEmoji, userName) => `# ${emotes_1.EmoteString.HorseRacing} Resultados da Corrida\n### ${winEmoji} ${winName} venceu a corrida!\n\nVocê apostou no ${userEmoji} **${userName}** e perdeu.`,
    },
    [Language_1.Language.Spanish]: {
        winners: "Ganadores",
        otherWinners: "Otros ganadores",
        raceWon: (emoji, name, prize) => `# ${emotes_1.EmoteString.HorseRacing} Resultados de la Carrera\n### ${emoji} ${name} ganó la carrera!\n\n¡Apostaste al caballo ganador y ganaste **${prize}**! 🎉`,
        raceLost: (winEmoji, winName, userEmoji, userName) => `# ${emotes_1.EmoteString.HorseRacing} Resultados de la Carrera\n### ${winEmoji} ${winName} ganó la carrera!\n\nApostaste al ${userEmoji} **${userName}** e perdiste.`,
    },
};
//# sourceMappingURL=HorseRacing.js.map