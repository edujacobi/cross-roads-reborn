import { NotificationRepository } from "#core/repositories/NotificationRepository";
import { addDays, addHours } from "date-fns";
import { Log, logger } from "#shared/log";
import { JobList } from "#core/types/Jobs";
import { User } from "./User";
import { Language, type Localization } from "./Language";
import { EmoteString } from "#bot/utils/emotes";
import { formatMoney } from "#bot/utils/ui";
import { sendPrivateMessage } from "#bot/utils/discordInteractions";
import { CrColors } from "#bot/utils/colors";
import { getJobClassModifier } from "#core/types/Classes";

export enum NotificationType {
	Daily = 1,
	Job,
	RobAgain,
	Free,
	Hospital,
	AlmsGive,
	AlmsReceive,
	Scavenge,
	BeatAgain,
	HorseRace,
	GangDepositAgain,
	InvestmentYield,
	InvestmentExpired,
	Vote,
}

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

export class Notification {
	Id = 0;
	UserId = "";
	Type = NotificationType.Daily;
	Date = new Date();

	async Create() {
		if (!this.UserId || !this.Type || !this.Date) {
			return Log.Error(`Cannot create Notification Timer without all values. UserId: ${this.UserId}, Type: ${this.Type}, Date: ${this.Date}`);
		}

		try {
			await NotificationRepository.Create({
				userId: this.UserId,
				type: this.Type,
				date: this.Date,
			});

			Log.Info(`Notification Timer of type ${NotificationMapper[this.Type]} (Id: ${this.Type}) for UserId ${this.UserId} created to notify in ${this.Date}.`);

		}
		catch (err) {
			Log.Warning(`Something went wrong with adding Notification Timer for UserId ${this.UserId} Type ${NotificationMapper[this.Type]} (Id: ${this.Type}).`);
		}
	}

	static async Daily(user: User) {
		await Notification.Dismiss(user.Id, NotificationType.Daily);
		const notification = new Notification();
		notification.UserId = user.Id;
		notification.Type = NotificationType.Daily;
		if (!user.Daily.LastReceived) {
			return;
		}
		notification.Date = addDays(user.Daily.LastReceived, 1);
		await notification.Create();
	}

	static async Job(user: User) {
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

	static async RobAgain(user: User) {
		await Notification.Dismiss(user.Id, NotificationType.RobAgain);
		const notification = new Notification();
		notification.UserId = user.Id;
		notification.Type = NotificationType.RobAgain;
		notification.Date = user.Wanted.Time;
		await notification.Create();
	}

	static async Free(user: User) {
		await Notification.Dismiss(user.Id, NotificationType.Free);
		const notification = new Notification();
		notification.UserId = user.Id;
		notification.Type = NotificationType.Free;
		notification.Date = user.Prison.Time;
		await notification.Create();
	}

	static async Hospital(user: User) {
		await Notification.Dismiss(user.Id, NotificationType.Hospital);
		const notification = new Notification();
		notification.UserId = user.Id;
		notification.Type = NotificationType.Hospital;
		notification.Date = user.Hospital.Time;
		await notification.Create();
	}

	static async AlmsGive(user: User) {
		await Notification.Dismiss(user.Id, NotificationType.AlmsGive);
		const notification = new Notification();
		notification.UserId = user.Id;
		notification.Type = NotificationType.AlmsGive;
		notification.Date = user.Alms.GiveTime;
		await notification.Create();
	}

	static async AlmsReceive(user: User) {
		await Notification.Dismiss(user.Id, NotificationType.AlmsReceive);
		const notification = new Notification();
		notification.UserId = user.Id;
		notification.Type = NotificationType.AlmsReceive;
		notification.Date = user.Alms.ReceiveTime;
		await notification.Create();
	}

	static async Scavenge(user: User) {
		await Notification.Dismiss(user.Id, NotificationType.Scavenge);
		const notification = new Notification();
		notification.UserId = user.Id;
		notification.Type = NotificationType.Scavenge;
		notification.Date = user.Scavenge.Time;
		await notification.Create();
	}

	static async BeatAgain(user: User) {
		await Notification.Dismiss(user.Id, NotificationType.BeatAgain);
		const notification = new Notification();
		notification.UserId = user.Id;
		notification.Type = NotificationType.BeatAgain;
		notification.Date = user.BeatUp.Time;
		await notification.Create();
	}

	static async GangDepositAgain(user: User, nextDeposit: Date) {
		await Notification.Dismiss(user.Id, NotificationType.GangDepositAgain);
		const notification = new Notification();
		notification.UserId = user.Id;
		notification.Type = NotificationType.GangDepositAgain;
		notification.Date = nextDeposit;
		await notification.Create();
	}

	static async Vote(user: User, votedAt: Date) {
		const date = addHours(votedAt, 12);

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

	static async InvestmentYield(user: User, investmentName: string, payout: number, feeAmount?: number, feePercent?: number) {
		const s = Strings[user.Language];
		let text = s.investmentYield(investmentName, formatMoney(payout, user.Language));
		if (feeAmount && feePercent) {
			text += `\n-# ${EmoteString.Henchman} ${s.henchmanFeeInfo(formatMoney(feeAmount, user.Language), feePercent)}`;
		}
		await sendPrivateMessage(user.Id, text, CrColors.Investment, formatMoney(user.Money, user.Language));
	}

	static async InvestmentExpired(user: User, investmentName: string, payout: number, feeAmount?: number, feePercent?: number) {
		const s = Strings[user.Language];
		let text = s.investmentExpired(investmentName, formatMoney(payout, user.Language));
		if (feeAmount && feePercent) {
			text += `\n-# ${EmoteString.Henchman} ${s.henchmanFeeInfo(formatMoney(feeAmount, user.Language), feePercent)}`;
		}
		await sendPrivateMessage(user.Id, text, CrColors.Investment, formatMoney(user.Money, user.Language));
	}

	static async HasNotificationsToSend(time: Date) {
		const count = await NotificationRepository.CountUnsentBefore(time);
		return count > 0;
	}

	static async GetNextNotifications(time: Date) {
		const list = await NotificationRepository.FindUnsentBefore(time);

		const notificationList: Notification[] = [];

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
			await NotificationRepository.MarkAsNotified(this.Id);

			Log.Info(`Notification Timer (Id: ${this.Id}) Type ${NotificationMapper[this.Type]} (Id: ${this.Type}) to user ${this.UserId} notified.`);

		}
		catch (err) {
			Log.Warning(`Something went wrong with updating Notification ${this.Id}.`);
		}
	}

	static async Dismiss(userId: string, type: NotificationType) {
		try {
			await NotificationRepository.DeleteUnsentByUserIdAndType(userId, type);
		}
		catch (err) {
			Log.Warning(`Something went wrong with dismissing Notification Type ${NotificationMapper[type]} (Id: ${type}) of userId ${userId}.`);
		}
	}

	private static isProcessing = false;

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
			const [updatedCount] = await NotificationRepository.MarkAsNotified(ids);

			if (updatedCount === 0) {
				return;
			}

			for (const notification of list) {
				try {
					const user = await new User(notification.UserId).GetInfo();

					if (!user) {
						Log.Warning(`Cannot send private message if the user was deleted (UserId: ${notification.UserId}). Notification (Id: ${notification.Id}) marked as notified.`);
						continue;
					}

					const s = Strings[user.Language];

					if (notification.Type == NotificationType.Daily) {
						await sendPrivateMessage(user.Id, s.daily);
					}

					else if (notification.Type == NotificationType.Job) {
						if (user.Job.Id !== null) {
							const job = JobList[user.Job.Id];
							const userClassModifier = getJobClassModifier(user.Class);
							const salary = Math.floor(job.Salary * userClassModifier);
							await user.EndJob();
							await sendPrivateMessage(user.Id, s.job(job.Description[user.Language], salary), CrColors.Jobs, formatMoney(user.Money, user.Language));
						}
					}

					else if (notification.Type == NotificationType.RobAgain) {
						await sendPrivateMessage(user.Id, s.robAgain, CrColors.Robbery);
					}

					else if (notification.Type == NotificationType.Free) {
						await sendPrivateMessage(user.Id, s.free, CrColors.Police);
					}

					else if (notification.Type == NotificationType.Hospital) {
						await sendPrivateMessage(user.Id, s.hospital, CrColors.Hospital);
					}

					else if (notification.Type == NotificationType.AlmsGive) {
						await sendPrivateMessage(user.Id, s.almsGive, CrColors.Default);
					}

					else if (notification.Type == NotificationType.AlmsReceive) {
						await sendPrivateMessage(user.Id, s.almsReceive, CrColors.Default);
					}

					else if (notification.Type == NotificationType.Scavenge) {
						await sendPrivateMessage(user.Id, s.scavenge, CrColors.Scavenge);
					}

					else if (notification.Type == NotificationType.BeatAgain) {
						await sendPrivateMessage(user.Id, s.beatAgain, CrColors.BeatUp);
					}

					else if (notification.Type == NotificationType.HorseRace) {
						await sendPrivateMessage(user.Id, s.horseRace, CrColors.Casino);
					}

					else if (notification.Type == NotificationType.GangDepositAgain) {
						if (user.GangId !== null) {
							await sendPrivateMessage(user.Id, s.gangDepositAgain);
						}
					}

					else if (notification.Type == NotificationType.Vote) {
						await sendPrivateMessage(user.Id, s.vote, CrColors.Default);
					}

					else {
						Log.Warning(`Notification type ${notification.Type} not implemented.`);
					}

					Log.Info(`Notification Timer (Id: ${notification.Id}) Type ${NotificationMapper[notification.Type]} (Id: ${notification.Type}) to user ${notification.UserId} notified.`);

					// Delete processed notification to keep DB clean
					await NotificationRepository.DeleteById(notification.Id);
				}
				catch (err) {
					logger.error(`Error processing notification ${notification.Id} for user ${notification.UserId}:`, err);
				}
			}
		}
		catch (error) {
			Log.Error(`Critical error in SendTimedNotification procedure: ${error}`);
		}
		finally {
			Notification.isProcessing = false;
		}
	}

	static StartProcedure() {
		setInterval(Notification.SendTimedNotification, 30_000);
	}
}

const Strings = {
	[Language.English]: {
		daily: `You can receive your daily money again! ${EmoteString.Experience}`,
		job: (description: string, salary: number) => `You finished your **${description}** job and received ${formatMoney(salary, Language.English)}! ${EmoteString.Jobs}`,
		robAgain: `You can rob again! ${EmoteString.Robbery}`,
		free: `You are free! ${EmoteString.Prison}`,
		hospital: `You are healed! ${EmoteString.Hospital}`,
		almsGive: `You can give alms again! ${EmoteString.Alms}`,
		almsReceive: `You can receive alms again! ${EmoteString.Alms}`,
		scavenge: `You can scavenge again! ${EmoteString.Scavenge}`,
		beatAgain: `You can beat up again! ${EmoteString.Beat}`,
		horseRace: `A horse race is starting soon! Place your bets now! ${EmoteString.Casino}`,
		gangDepositAgain: `You can deposit again in the gang! ${EmoteString.Gang}`,
		investmentYield: (name: string, amount: string) => `You received **${amount}** from your investment **${name}**! ${EmoteString.InvestmentActive}`,
		investmentExpired: (name: string, amount: string) => `Your investment **${name}** has expired! You received **${amount}** as a final profit. ${EmoteString.InvestmentInactive}`,
		henchmanFeeInfo: (amount: string, percent: number) => `Henchman took **${amount}** (${percent}%) as payment`,
		vote: `You can vote again on Top.gg! Claim your coins now ${EmoteString.SpecialCoinShop}`,
	},
	[Language.Portuguese]: {
		daily: `Você pode receber sua grana diária novamente! ${EmoteString.Experience}`,
		job: (description: string, salary: number) => `Você terminou seu trabalho **${description}** e recebeu ${formatMoney(salary, Language.Portuguese)}! ${EmoteString.Jobs}`,
		robAgain: `Você pode roubar novamente! ${EmoteString.Robbery}`,
		free: `Você está livre! ${EmoteString.Prison}`,
		hospital: `Você está curado! ${EmoteString.Hospital}`,
		almsGive: `Você pode dar esmola novamente! ${EmoteString.Alms}`,
		almsReceive: `Você pode receber esmola novamente! ${EmoteString.Alms}`,
		scavenge: `Você pode vasculhar novamente! ${EmoteString.Scavenge}`,
		beatAgain: `Você pode espancar novamente! ${EmoteString.Beat}`,
		horseRace: `Uma corrida de cavalos está começando em breve! Faça suas apostas agora! ${EmoteString.Casino}`,
		gangDepositAgain: `Você pode depositar novamente na gangue! ${EmoteString.Gang}`,
		investmentYield: (name: string, amount: string) => `Você recebeu **${amount}** do seu investimento **${name}**! ${EmoteString.InvestmentActive}`,
		investmentExpired: (name: string, amount: string) => `Seu investimento **${name}** expirou! Você recebeu **${amount}** como lucro final. ${EmoteString.InvestmentInactive}`,
		henchmanFeeInfo: (amount: string, percent: number) => `O capanga cobrou **${amount}** (${percent}%) como pagamento`,
		vote: `Você pode votar novamente no Top.gg! Reivindique suas moedas agora ${EmoteString.SpecialCoinShop}`,
	},
	[Language.Spanish]: {
		daily: `¡Puedes recibir tu dinero diario de nuevo! ${EmoteString.Experience}`,
		job: (description: string, salary: number) => `Terminaste tu trabajo **${description}** y recibiste ${formatMoney(salary, Language.Spanish)}! ${EmoteString.Jobs}`,
		robAgain: `¡Puedes robar de nuevo! ${EmoteString.Robbery}`,
		free: `¡Estás libre! ${EmoteString.Prison}`,
		hospital: `¡Estás curado! ${EmoteString.Hospital}`,
		almsGive: `¡Puedes dar limosna de nuevo! ${EmoteString.Alms}`,
		almsReceive: `¡Puedes recibir limosna de nuevo! ${EmoteString.Alms}`,
		scavenge: `¡Puedes buscar de nuevo! ${EmoteString.Scavenge}`,
		beatAgain: `¡Puedes golpear de nuevo! ${EmoteString.Beat}`,
		horseRace: `¡Una carrera de caballos está comenzando pronto! ¡Haz tus apuestas ahora! ${EmoteString.Casino}`,
		gangDepositAgain: `¡Puedes depositar de nuevo en la gangue! ${EmoteString.Gang}`,
		investmentYield: (name: string, amount: string) => `¡Recibiste **${amount}** de tu inversión **${name}**! ${EmoteString.InvestmentActive}`,
		investmentExpired: (name: string, amount: string) => `¡Tu inversión **${name}** ha expirado! Recibiste **${amount}** como lucro final. ${EmoteString.InvestmentInactive}`,
		henchmanFeeInfo: (amount: string, percent: number) => `El secuaz cobró **${amount}** (${percent}%) como pago`,
		vote: `¡Puedes votar de nuevo en Top.gg! Reclama tus monedas ahora ${EmoteString.SpecialCoinShop}`,
	},
} as const satisfies Localization;
