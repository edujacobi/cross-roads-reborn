import { Notifications } from "@core/database/Notifications";
import { Op } from "sequelize";
import { addDays } from "date-fns";
import { Log } from "@shared/log";
import { JobList } from "@core/types/Jobs";
import { User } from "./User";
import { Language, Localization } from "./Language";
import { EmoteString } from "@bot/utils/emotes";
import { formatMoney } from "@bot/utils/ui";
import { sendPrivateMessage } from "@bot/utils/discordInteractions";
import { CrColors } from "@bot/utils/colors";
import { getJobClassModifier } from "@core/types/Classes";

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
}

const NotificationMapper = {
	[NotificationType.Daily]: "daily",
	[NotificationType.Job]: "job",
	[NotificationType.RobAgain]: "robAgain",
	[NotificationType.Free]: "free",
	[NotificationType.Hospital]: "hospital",
	[NotificationType.AlmsGive]: "almsGive",
	[NotificationType.AlmsReceive]: "almsReceive",
	[NotificationType.Scavenge]: "scavenge",
	[NotificationType.BeatAgain]: "beatAgain",
	[NotificationType.HorseRace]: "horseRace",
	[NotificationType.GangDepositAgain]: "gangDepositAgain",
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
			await Notifications.create({
				userId: this.UserId,
				type: this.Type,
				date: this.Date,
			});

			Log.Info(`Notification Timer of type ${NotificationMapper[this.Type]} (Id: ${this.Type}) for UserId ${this.UserId} created to notify in ${this.Date}.`);

		}
		catch (err) {
			Log.Warning(`Something went wrong with adding Notification Timer for ${this.UserId}.`);
		}
	}

	static async Daily(user: User) {
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
		const notification = new Notification();
		notification.UserId = user.Id;
		notification.Type = NotificationType.RobAgain;
		notification.Date = user.Wanted.Time;
		await notification.Create();
	}

	static async Free(user: User) {
		const notification = new Notification();
		notification.UserId = user.Id;
		notification.Type = NotificationType.Free;
		notification.Date = user.Prison.Time;
		await notification.Create();
	}

	static async Hospital(user: User) {
		const notification = new Notification();
		notification.UserId = user.Id;
		notification.Type = NotificationType.Hospital;
		notification.Date = user.Hospital.Time;
		await notification.Create();
	}

	static async AlmsGive(user: User) {
		const notification = new Notification();
		notification.UserId = user.Id;
		notification.Type = NotificationType.AlmsGive;
		notification.Date = user.Alms.GiveTime;
		await notification.Create();
	}

	static async AlmsReceive(user: User) {
		const notification = new Notification();
		notification.UserId = user.Id;
		notification.Type = NotificationType.AlmsReceive;
		notification.Date = user.Alms.ReceiveTime;
		await notification.Create();
	}

	static async Scavenge(user: User) {
		const notification = new Notification();
		notification.UserId = user.Id;
		notification.Type = NotificationType.Scavenge;
		notification.Date = user.Scavenge.Time;
		await notification.Create();
	}

	static async BeatAgain(user: User) {
		const notification = new Notification();
		notification.UserId = user.Id;
		notification.Type = NotificationType.BeatAgain;
		notification.Date = user.BeatUp.Time;
		await notification.Create();
	}

	static async GangDepositAgain(user: User, nextDeposit: Date) {
		const notification = new Notification();
		notification.UserId = user.Id;
		notification.Type = NotificationType.GangDepositAgain;
		notification.Date = nextDeposit;
		await notification.Create();
	}

	static async HasNotificationsToSend(time: Date) {
		const list = await Notifications.count({
			where: {
				date: {
					[Op.lt]: time,
				},
				notified: false,
			},
		});

		return list > 0;
	}

	static async GetNextNotifications(time: Date) {
		const list = await Notifications.findAll({
			where: {
				date: {
					[Op.lt]: time,
				},
				notified: false,
			},
		});

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
			await Notifications.update({
				notified: true,
			}, {
				where: { id: this.Id },
			});

			Log.Info(`Notification Timer (Id: ${this.Id}) (Type:${NotificationMapper[this.Type]} (${this.Type})) to user ${this.UserId} notified.`);

		}
		catch (err) {
			Log.Warning(`Something went wrong with updating Notification ${this.Id}.`);
		}
	}

	static async Dismiss(userId: string, type: NotificationType) {
		try {
			const notification = await Notifications.findOne({
				where: {
					userId,
					type,
					notified: false,
				},
			});

			if (!notification) {
				return;
			}

			const notificationTimer = new Notification();

			notificationTimer.Id = notification.id;
			await notificationTimer.SetAsNotified();

			Log.Info(`Notification Timer ${notification.id} dismissed.`);
		}
		catch (err) {
			Log.Warning(`Something went wrong with dismissing Notification type ${type} of userId ${userId}.`);
		}
	}

	static async SendTimedNotification() {
		const now = new Date();
		const hasNotification = await Notification.HasNotificationsToSend(now);

		// return Log.Info(`No notifications to send. Ignoring procedure.`);
		if (!hasNotification) {
			return;
		}

		// Log.Info(`Starting notification procedure ↓`);
		const list = await Notification.GetNextNotifications(now);

		for (const notification of list) {
			const user = await new User(notification.UserId).GetInfo();

			if (!user) {
				Log.Warning(`Cannot send private message if the user was deleted (UserId: ${notification.UserId}).`);
				await notification.SetAsNotified();
				continue;
			}

			const s = Strings[user.Language];

			if (notification.Type == NotificationType.Daily) {
				await sendPrivateMessage({
					userId: user.Id,
					message: `${s.daily} ${EmoteString.Experience}`,
					notificationMessage: `${s.daily} 💰`,
				});
			}

			else if (notification.Type == NotificationType.Job) {
				if (user.Job.Id !== null) {
					const job = JobList[user.Job.Id];
					const userClassModifier = getJobClassModifier(user.Class);
					const salary = Math.floor(job.Salary * userClassModifier);
					await user.EndJob();
					await sendPrivateMessage({
						userId: user.Id,
						message: s.job(job.Description[user.Language], salary),
						notificationMessage: s.jobHidden(job.Description[user.Language], salary),
						color: CrColors.Jobs,
						footer: formatMoney(user.Money, user.Language),
					});
				}
			}

			else if (notification.Type == NotificationType.RobAgain) {
				await sendPrivateMessage({
					userId: user.Id,
					message: `${s.robAgain} ${EmoteString.Robbery}`,
					notificationMessage: `${s.robAgain} 🔫`,
					color: CrColors.Robbery,
				});
			}

			else if (notification.Type == NotificationType.Free) {
				await sendPrivateMessage({
					userId: user.Id,
					message: `${s.free} ${EmoteString.Prison}`,
					notificationMessage: `${s.free} 🚓`,
					color: CrColors.Police,
				});

			}

			else if (notification.Type == NotificationType.Hospital) {
				await sendPrivateMessage({
					userId: user.Id,
					message: `${s.hospital} ${EmoteString.Hospital}`,
					notificationMessage: `${s.hospital} 🏥`,
					color: CrColors.Hospital,
				});
			}

			else if (notification.Type == NotificationType.AlmsGive) {
				await sendPrivateMessage({
					userId: user.Id,
					message: `${s.almsGive} ${EmoteString.Alms}`,
					notificationMessage: `${s.almsGive} 🪙`,
					color: CrColors.Default,
				});
			}

			else if (notification.Type == NotificationType.AlmsReceive) {
				await sendPrivateMessage({
					userId: user.Id,
					message: `${s.almsReceive} ${EmoteString.Alms}`,
					notificationMessage: `${s.almsReceive} 🪙`,
					color: CrColors.Default,
				});
			}

			else if (notification.Type == NotificationType.Scavenge) {
				await sendPrivateMessage({
					userId: user.Id,
					message: `${s.scavenge} ${EmoteString.Scavenge}`,
					notificationMessage: `${s.scavenge} 🔎`,
					color: CrColors.Scavenge,
				});
			}

			else if (notification.Type == NotificationType.BeatAgain) {
				await sendPrivateMessage({
					userId: user.Id,
					message: `${s.beatAgain} ${EmoteString.Beat}`,
					notificationMessage: `${s.beatAgain} 🤜`,
					color: CrColors.BeatUp,
				});
			}

			else if (notification.Type == NotificationType.HorseRace) {
				await sendPrivateMessage({
					userId: user.Id,
					message: `${s.horseRace} ${EmoteString.Casino}`,
					notificationMessage: `${s.horseRace} 🎲`,
					color: CrColors.Casino,
				});
			}

			else if (notification.Type == NotificationType.GangDepositAgain) {
				if (user.GangId !== null) {
					await sendPrivateMessage({
						userId: user.Id,
						message: `${s.gangDepositAgain} ${EmoteString.Gang}`,
						notificationMessage: `${s.gangDepositAgain} 👨‍👩‍👧‍👦`,
					});
				}
			}

			else {
				Log.Warning(`Notification type ${notification.Type} not implemented.`);
			}

			await notification.SetAsNotified();
		}
		// Log.Info(`Notification procedure complete ↑`);
	}

	static StartProcedure() {
		setInterval(this.SendTimedNotification, 20_000);
	}
}

const Strings = {
	[Language.English]: {
		daily: `You can receive your daily money again!`,
		job: (description: string, salary: number) => `You finished your **${description}** job and received ${formatMoney(salary, Language.English)}! ${EmoteString.Jobs}`,
		jobHidden: (description: string, salary: number) => `You finished your ${description} job and received ${formatMoney(salary, Language.English)}! 👷`,
		robAgain: `You can rob again!`,
		free: `You are free!`,
		hospital: `You are healed!`,
		almsGive: `You can give alms again!`,
		almsReceive: `You can receive alms again!`,
		scavenge: `You can scavenge again!`,
		beatAgain: `You can beat up again!`,
		horseRace: `A horse race is starting soon! Place your bets now!`,
		gangDepositAgain: `You can deposit again in the gang!`,
	},
	[Language.Portuguese]: {
		daily: `Você pode receber sua grana diária novamente!`,
		job: (description: string, salary: number) => `Você terminou seu trabalho **${description}** e recebeu ${formatMoney(salary, Language.Portuguese)}! ${EmoteString.Jobs}`,
		jobHidden: (description: string, salary: number) => `Você terminou seu trabalho ${description} e recebeu ${formatMoney(salary, Language.Portuguese)}! 👷`,
		robAgain: `Você pode roubar novamente!`,
		free: `Você está livre!`,
		hospital: `Você está curado!`,
		almsGive: `Você pode dar esmola novamente!`,
		almsReceive: `Você pode receber esmola novamente!`,
		scavenge: `Você pode vasculhar novamente!`,
		beatAgain: `Você pode espancar novamente!`,
		horseRace: `Uma corrida de cavalos está começando em breve! Faça suas apostas agora!`,
		gangDepositAgain: `Você pode depositar novamente na gangue!`,
	},
	[Language.Spanish]: {
		daily: `¡Puedes recibir tu dinero diario de nuevo!`,
		job: (description: string, salary: number) => `Terminaste tu trabajo **${description}** y recibiste ${formatMoney(salary, Language.Spanish)}! ${EmoteString.Jobs}`,
		jobHidden: (description: string, salary: number) => `Terminaste tu trabajo ${description} y recibiste ${formatMoney(salary, Language.Spanish)}! 👷`,
		robAgain: `¡Puedes robar de nuevo!`,
		free: `¡Estás libre!`,
		hospital: `¡Estás curado!`,
		almsGive: `¡Puedes dar limosna de nuevo!`,
		almsReceive: `¡Puedes recibir limosna de nuevo!`,
		scavenge: `¡Puedes buscar de nuevo!`,
		beatAgain: `¡Puedes golpear de nuevo!`,
		horseRace: `¡Una carrera de caballos está comenzando pronto! ¡Haz tus apuestas ahora!`,
		gangDepositAgain: `¡Puedes depositar de nuevo en la gangue!`,
	},
} as const satisfies Localization;
