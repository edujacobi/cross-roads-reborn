"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = exports.NotificationType = void 0;
const NotificationRepository_1 = require("#core/repositories/NotificationRepository");
const date_fns_1 = require("date-fns");
const log_1 = require("#shared/log");
const Jobs_1 = require("#core/types/Jobs");
const User_1 = require("./User");
const Language_1 = require("./Language");
const emotes_1 = require("#bot/utils/emotes");
const ui_1 = require("#bot/utils/ui");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const colors_1 = require("#bot/utils/colors");
const Classes_1 = require("#core/types/Classes");
const discord_js_1 = require("discord.js");
var NotificationType;
(function (NotificationType) {
    NotificationType[NotificationType["Daily"] = 1] = "Daily";
    NotificationType[NotificationType["Job"] = 2] = "Job";
    NotificationType[NotificationType["RobAgain"] = 3] = "RobAgain";
    NotificationType[NotificationType["Free"] = 4] = "Free";
    NotificationType[NotificationType["Hospital"] = 5] = "Hospital";
    NotificationType[NotificationType["AlmsGive"] = 6] = "AlmsGive";
    NotificationType[NotificationType["AlmsReceive"] = 7] = "AlmsReceive";
    NotificationType[NotificationType["Scavenge"] = 8] = "Scavenge";
    NotificationType[NotificationType["BeatAgain"] = 9] = "BeatAgain";
    NotificationType[NotificationType["HorseRace"] = 10] = "HorseRace";
    NotificationType[NotificationType["GangDepositAgain"] = 11] = "GangDepositAgain";
    NotificationType[NotificationType["InvestmentYield"] = 12] = "InvestmentYield";
    NotificationType[NotificationType["InvestmentExpired"] = 13] = "InvestmentExpired";
    NotificationType[NotificationType["Vote"] = 14] = "Vote";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
const NotificationMapper = {
    [NotificationType.Daily]: "Daily",
    [NotificationType.Job]: "Job",
    [NotificationType.RobAgain]: "Rob Again",
    [NotificationType.Free]: "Free",
    [NotificationType.Hospital]: "Hospital",
    [NotificationType.AlmsGive]: "Alms Give",
    [NotificationType.AlmsReceive]: "Alms Receive",
    [NotificationType.Scavenge]: "Scavenge",
    [NotificationType.BeatAgain]: "Beat Again",
    [NotificationType.HorseRace]: "Horse Race",
    [NotificationType.GangDepositAgain]: "Gang Deposit Again",
    [NotificationType.InvestmentYield]: "Investment Yield",
    [NotificationType.InvestmentExpired]: "Investment Expired",
    [NotificationType.Vote]: "Top.gg Vote",
};
class Notification {
    Id = 0;
    UserId = "";
    Type = NotificationType.Daily;
    Date = new Date();
    async Create() {
        if (!this.UserId || !this.Type || !this.Date) {
            return log_1.Log.Error(`Cannot create Notification Timer without all values. UserId: ${this.UserId}, Type: ${this.Type}, Date: ${this.Date}`);
        }
        try {
            await NotificationRepository_1.NotificationRepository.Create({
                userId: this.UserId,
                type: this.Type,
                date: this.Date,
            });
            log_1.Log.Info(`Notification Timer of type ${NotificationMapper[this.Type]} (Id: ${this.Type}) for UserId ${this.UserId} created to notify in ${this.Date}.`);
        }
        catch (err) {
            log_1.Log.Warning(`Something went wrong with adding Notification Timer for UserId ${this.UserId} Type ${NotificationMapper[this.Type]} (Id: ${this.Type}).`);
        }
    }
    static async Daily(user) {
        await Notification.Dismiss(user.Id, NotificationType.Daily);
        const notification = new Notification();
        notification.UserId = user.Id;
        notification.Type = NotificationType.Daily;
        if (!user.Daily.LastReceived) {
            return;
        }
        notification.Date = (0, date_fns_1.addDays)(user.Daily.LastReceived, 1);
        await notification.Create();
    }
    static async Job(user) {
        await Notification.Dismiss(user.Id, NotificationType.Job);
        const notification = new Notification();
        notification.UserId = user.Id;
        notification.Type = NotificationType.Job;
        if (user.Job.Id === null) {
            return;
        }
        notification.Date = user.Job.EndsIn;
        await notification.Create();
    }
    static async RobAgain(user) {
        await Notification.Dismiss(user.Id, NotificationType.RobAgain);
        const notification = new Notification();
        notification.UserId = user.Id;
        notification.Type = NotificationType.RobAgain;
        notification.Date = user.Wanted.Time;
        await notification.Create();
    }
    static async Free(user) {
        await Notification.Dismiss(user.Id, NotificationType.Free);
        const notification = new Notification();
        notification.UserId = user.Id;
        notification.Type = NotificationType.Free;
        notification.Date = user.Prison.Time;
        await notification.Create();
    }
    static async Hospital(user) {
        await Notification.Dismiss(user.Id, NotificationType.Hospital);
        const notification = new Notification();
        notification.UserId = user.Id;
        notification.Type = NotificationType.Hospital;
        notification.Date = user.Hospital.Time;
        await notification.Create();
    }
    static async AlmsGive(user) {
        await Notification.Dismiss(user.Id, NotificationType.AlmsGive);
        const notification = new Notification();
        notification.UserId = user.Id;
        notification.Type = NotificationType.AlmsGive;
        notification.Date = user.Alms.GiveTime;
        await notification.Create();
    }
    static async AlmsReceive(user) {
        await Notification.Dismiss(user.Id, NotificationType.AlmsReceive);
        const notification = new Notification();
        notification.UserId = user.Id;
        notification.Type = NotificationType.AlmsReceive;
        notification.Date = user.Alms.ReceiveTime;
        await notification.Create();
    }
    static async Scavenge(user) {
        await Notification.Dismiss(user.Id, NotificationType.Scavenge);
        const notification = new Notification();
        notification.UserId = user.Id;
        notification.Type = NotificationType.Scavenge;
        notification.Date = user.Scavenge.Time;
        await notification.Create();
    }
    static async BeatAgain(user) {
        await Notification.Dismiss(user.Id, NotificationType.BeatAgain);
        const notification = new Notification();
        notification.UserId = user.Id;
        notification.Type = NotificationType.BeatAgain;
        notification.Date = user.BeatUp.Time;
        await notification.Create();
    }
    static async GangDepositAgain(user, nextDeposit) {
        await Notification.Dismiss(user.Id, NotificationType.GangDepositAgain);
        const notification = new Notification();
        notification.UserId = user.Id;
        notification.Type = NotificationType.GangDepositAgain;
        notification.Date = nextDeposit;
        await notification.Create();
    }
    static async Vote(user, votedAt) {
        const date = (0, date_fns_1.addHours)(votedAt, 12);
        if (date <= new Date()) {
            return;
        }
        await Notification.Dismiss(user.Id, NotificationType.Vote);
        const notification = new Notification();
        notification.UserId = user.Id;
        notification.Type = NotificationType.Vote;
        notification.Date = date;
        await notification.Create();
    }
    static async InvestmentYield(user, investmentName, payout, feeAmount, feePercent) {
        const s = Strings[user.Language];
        let text = s.investmentYield(investmentName, (0, ui_1.formatMoney)(payout, user.Language));
        if (feeAmount && feePercent) {
            text += `\n-# ${emotes_1.EmoteString.Henchman} ${s.henchmanFeeInfo((0, ui_1.formatMoney)(feeAmount, user.Language), feePercent)}`;
        }
        await (0, discordInteractions_1.sendPrivateMessage)(user.Id, text, colors_1.CrColors.Investment, (0, ui_1.formatMoney)(user.Money, user.Language));
    }
    static async InvestmentExpired(user, investmentName, payout, feeAmount, feePercent) {
        const s = Strings[user.Language];
        let text = s.investmentExpired(investmentName, (0, ui_1.formatMoney)(payout, user.Language));
        if (feeAmount && feePercent) {
            text += `\n-# ${emotes_1.EmoteString.Henchman} ${s.henchmanFeeInfo((0, ui_1.formatMoney)(feeAmount, user.Language), feePercent)}`;
        }
        await (0, discordInteractions_1.sendPrivateMessage)(user.Id, text, colors_1.CrColors.Investment, (0, ui_1.formatMoney)(user.Money, user.Language));
    }
    static async VipGift(receiver, giver, days) {
        const s = Strings[receiver.Language];
        await (0, discordInteractions_1.sendPrivateMessage)(receiver.Id, s.vipGift(giver.Nickname, days), discord_js_1.Colors.Gold);
    }
    static async HasNotificationsToSend(time) {
        const count = await NotificationRepository_1.NotificationRepository.CountUnsentBefore(time);
        return count > 0;
    }
    static async GetNextNotifications(time) {
        const list = await NotificationRepository_1.NotificationRepository.FindUnsentBefore(time);
        const notificationList = [];
        for (const notification of list) {
            const notificationTimer = new Notification();
            notificationTimer.Id = notification.id;
            notificationTimer.UserId = notification.userId;
            notificationTimer.Type = notification.type;
            notificationTimer.Date = notification.date;
            notificationList.push(notificationTimer);
        }
        return notificationList;
    }
    async SetAsNotified() {
        try {
            await NotificationRepository_1.NotificationRepository.MarkAsNotified(this.Id);
            log_1.Log.Info(`Notification Timer (Id: ${this.Id}) Type ${NotificationMapper[this.Type]} (Id: ${this.Type}) to user ${this.UserId} notified.`);
        }
        catch (err) {
            log_1.Log.Warning(`Something went wrong with updating Notification ${this.Id}.`);
        }
    }
    static async Dismiss(userId, type) {
        try {
            await NotificationRepository_1.NotificationRepository.DeleteUnsentByUserIdAndType(userId, type);
        }
        catch (err) {
            log_1.Log.Warning(`Something went wrong with dismissing Notification Type ${NotificationMapper[type]} (Id: ${type}) of userId ${userId}.`);
        }
    }
    static isProcessing = false;
    static async SendTimedNotification() {
        if (Notification.isProcessing) {
            return;
        }
        Notification.isProcessing = true;
        try {
            const now = new Date();
            const list = await Notification.GetNextNotifications(now);
            if (list.length === 0) {
                return;
            }
            // Mark all fetched notifications as notified immediately to prevent duplication
            // in case of overlapping intervals or fast restarts.
            const ids = list.map(n => n.Id);
            const [updatedCount] = await NotificationRepository_1.NotificationRepository.MarkAsNotified(ids);
            if (updatedCount === 0) {
                return;
            }
            for (const notification of list) {
                try {
                    const user = await new User_1.User(notification.UserId).GetInfo();
                    if (!user) {
                        log_1.Log.Warning(`Cannot send private message if the user was deleted (UserId: ${notification.UserId}). Notification (Id: ${notification.Id}) marked as notified.`);
                        continue;
                    }
                    const s = Strings[user.Language];
                    if (notification.Type == NotificationType.Daily) {
                        await (0, discordInteractions_1.sendPrivateMessage)(user.Id, s.daily);
                    }
                    else if (notification.Type == NotificationType.Job) {
                        if (user.Job.Id !== null) {
                            const job = Jobs_1.JobList[user.Job.Id];
                            const userClassModifier = (0, Classes_1.getJobClassModifier)(user.Class);
                            const salary = Math.floor(job.Salary * userClassModifier);
                            await user.EndJob();
                            await (0, discordInteractions_1.sendPrivateMessage)(user.Id, s.job(job.Description[user.Language], salary), colors_1.CrColors.Jobs, (0, ui_1.formatMoney)(user.Money, user.Language));
                        }
                    }
                    else if (notification.Type == NotificationType.RobAgain) {
                        await (0, discordInteractions_1.sendPrivateMessage)(user.Id, s.robAgain, colors_1.CrColors.Robbery);
                    }
                    else if (notification.Type == NotificationType.Free) {
                        await (0, discordInteractions_1.sendPrivateMessage)(user.Id, s.free, colors_1.CrColors.Police);
                    }
                    else if (notification.Type == NotificationType.Hospital) {
                        await (0, discordInteractions_1.sendPrivateMessage)(user.Id, s.hospital, colors_1.CrColors.Hospital);
                    }
                    else if (notification.Type == NotificationType.AlmsGive) {
                        await (0, discordInteractions_1.sendPrivateMessage)(user.Id, s.almsGive, colors_1.CrColors.Default);
                    }
                    else if (notification.Type == NotificationType.AlmsReceive) {
                        await (0, discordInteractions_1.sendPrivateMessage)(user.Id, s.almsReceive, colors_1.CrColors.Default);
                    }
                    else if (notification.Type == NotificationType.Scavenge) {
                        await (0, discordInteractions_1.sendPrivateMessage)(user.Id, s.scavenge, colors_1.CrColors.Scavenge);
                    }
                    else if (notification.Type == NotificationType.BeatAgain) {
                        await (0, discordInteractions_1.sendPrivateMessage)(user.Id, s.beatAgain, colors_1.CrColors.BeatUp);
                    }
                    else if (notification.Type == NotificationType.HorseRace) {
                        await (0, discordInteractions_1.sendPrivateMessage)(user.Id, s.horseRace, colors_1.CrColors.Casino);
                    }
                    else if (notification.Type == NotificationType.GangDepositAgain) {
                        if (user.GangId !== null) {
                            await (0, discordInteractions_1.sendPrivateMessage)(user.Id, s.gangDepositAgain);
                        }
                    }
                    else if (notification.Type == NotificationType.Vote) {
                        await (0, discordInteractions_1.sendPrivateMessage)(user.Id, s.vote, colors_1.CrColors.Default);
                    }
                    else {
                        log_1.Log.Warning(`Notification type ${notification.Type} not implemented.`);
                    }
                    log_1.Log.Info(`Notification Timer (Id: ${notification.Id}) Type ${NotificationMapper[notification.Type]} (Id: ${notification.Type}) to user ${notification.UserId} notified.`);
                    // Delete processed notification to keep DB clean
                    await NotificationRepository_1.NotificationRepository.DeleteById(notification.Id);
                }
                catch (err) {
                    log_1.logger.error(`Error processing notification ${notification.Id} for user ${notification.UserId}:`, err);
                }
            }
        }
        catch (error) {
            log_1.Log.Error(`Critical error in SendTimedNotification procedure: ${error}`);
        }
        finally {
            Notification.isProcessing = false;
        }
    }
    static StartProcedure() {
        setInterval(Notification.SendTimedNotification, 30_000);
    }
}
exports.Notification = Notification;
const Strings = {
    [Language_1.Language.English]: {
        daily: `You can receive your daily money again! ${emotes_1.EmoteString.Experience}`,
        job: (description, salary) => `You finished your **${description}** job and received ${(0, ui_1.formatMoney)(salary, Language_1.Language.English)}! ${emotes_1.EmoteString.Jobs}`,
        robAgain: `You can rob again! ${emotes_1.EmoteString.Robbery}`,
        free: `You are free! ${emotes_1.EmoteString.Prison}`,
        hospital: `You are healed! ${emotes_1.EmoteString.Hospital}`,
        almsGive: `You can give alms again! ${emotes_1.EmoteString.Alms}`,
        almsReceive: `You can receive alms again! ${emotes_1.EmoteString.Alms}`,
        scavenge: `You can scavenge again! ${emotes_1.EmoteString.Scavenge}`,
        beatAgain: `You can beat up again! ${emotes_1.EmoteString.Beat}`,
        horseRace: `A horse race is starting soon! Place your bets now! ${emotes_1.EmoteString.Casino}`,
        gangDepositAgain: `You can deposit again in the gang! ${emotes_1.EmoteString.Gang}`,
        investmentYield: (name, amount) => `You received **${amount}** from your investment **${name}**! ${emotes_1.EmoteString.InvestmentActive}`,
        investmentExpired: (name, amount) => `Your investment **${name}** has expired! You received **${amount}** as a final profit. ${emotes_1.EmoteString.InvestmentInactive}`,
        henchmanFeeInfo: (amount, percent) => `Henchman took **${amount}** (${percent}%) as payment`,
        vipGift: (giver, days) => `You received **${days} days of VIP** from **${giver}**! ${emotes_1.EmoteString.VIP}`,
        vote: `You can vote again on Top.gg! Claim your coins now ${emotes_1.EmoteString.SpecialCoinShop}`,
    },
    [Language_1.Language.Portuguese]: {
        daily: `Você pode receber sua grana diária novamente! ${emotes_1.EmoteString.Experience}`,
        job: (description, salary) => `Você terminou seu trabalho **${description}** e recebeu ${(0, ui_1.formatMoney)(salary, Language_1.Language.Portuguese)}! ${emotes_1.EmoteString.Jobs}`,
        robAgain: `Você pode roubar novamente! ${emotes_1.EmoteString.Robbery}`,
        free: `Você está livre! ${emotes_1.EmoteString.Prison}`,
        hospital: `Você está curado! ${emotes_1.EmoteString.Hospital}`,
        almsGive: `Você pode dar esmola novamente! ${emotes_1.EmoteString.Alms}`,
        almsReceive: `Você pode receber esmola novamente! ${emotes_1.EmoteString.Alms}`,
        scavenge: `Você pode vasculhar novamente! ${emotes_1.EmoteString.Scavenge}`,
        beatAgain: `Você pode espancar novamente! ${emotes_1.EmoteString.Beat}`,
        horseRace: `Uma corrida de cavalos está começando em breve! Faça suas apostas agora! ${emotes_1.EmoteString.Casino}`,
        gangDepositAgain: `Você pode depositar novamente na gangue! ${emotes_1.EmoteString.Gang}`,
        investmentYield: (name, amount) => `Você recebeu **${amount}** do seu investimento **${name}**! ${emotes_1.EmoteString.InvestmentActive}`,
        investmentExpired: (name, amount) => `Seu investimento **${name}** expirou! Você recebeu **${amount}** como lucro final. ${emotes_1.EmoteString.InvestmentInactive}`,
        henchmanFeeInfo: (amount, percent) => `O capanga cobrou **${amount}** (${percent}%) como pagamento`,
        vipGift: (giver, days) => `Você recebeu **${days} dias de VIP** de **${giver}**! ${emotes_1.EmoteString.VIP}`,
        vote: `Você pode votar novamente no Top.gg! Reivindique suas moedas agora ${emotes_1.EmoteString.SpecialCoinShop}`,
    },
    [Language_1.Language.Spanish]: {
        daily: `¡Puedes recibir tu dinero diario de nuevo! ${emotes_1.EmoteString.Experience}`,
        job: (description, salary) => `Terminaste tu trabajo **${description}** y recibiste ${(0, ui_1.formatMoney)(salary, Language_1.Language.Spanish)}! ${emotes_1.EmoteString.Jobs}`,
        robAgain: `¡Puedes robar de nuevo! ${emotes_1.EmoteString.Robbery}`,
        free: `¡Estás libre! ${emotes_1.EmoteString.Prison}`,
        hospital: `¡Estás curado! ${emotes_1.EmoteString.Hospital}`,
        almsGive: `¡Puedes dar limosna de nuevo! ${emotes_1.EmoteString.Alms}`,
        almsReceive: `¡Puedes recibir limosna de nuevo! ${emotes_1.EmoteString.Alms}`,
        scavenge: `¡Puedes buscar de nuevo! ${emotes_1.EmoteString.Scavenge}`,
        beatAgain: `¡Puedes golpear de nuevo! ${emotes_1.EmoteString.Beat}`,
        horseRace: `¡Una carrera de caballos está comenzando pronto! ¡Haz tus apuestas ahora! ${emotes_1.EmoteString.Casino}`,
        gangDepositAgain: `¡Puedes depositar de nuevo en la gangue! ${emotes_1.EmoteString.Gang}`,
        investmentYield: (name, amount) => `¡Recibiste **${amount}** de tu inversión **${name}**! ${emotes_1.EmoteString.InvestmentActive}`,
        investmentExpired: (name, amount) => `¡Tu inversión **${name}** ha expirado! Recibiste **${amount}** como lucro final. ${emotes_1.EmoteString.InvestmentInactive}`,
        henchmanFeeInfo: (amount, percent) => `El secuaz cobró **${amount}** (${percent}%) como pago`,
        vipGift: (giver, days) => `¡Recibiste **${days} días de VIP** de **${giver}**! ${emotes_1.EmoteString.VIP}`,
        vote: `¡Puedes votar de nuevo en Top.gg! Reclama tus monedas ahora ${emotes_1.EmoteString.SpecialCoinShop}`,
    },
};
//# sourceMappingURL=Notification.js.map