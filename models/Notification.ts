import { Notifications } from "../database/Notifications";
import { Op } from "sequelize";
import { addDays } from "date-fns";
import { Log } from "../utils/log";
import { addHours } from "date-fns/addHours";
import { JobList } from "../interfaces/Jobs";
import { User } from "./User";
import { Language } from "./Language";
import { EmoteString } from "../utils/emotes";
import { formatMoney } from "../utils/ui";
import { sendPrivateMessage } from "../utils/logic";
import { CrColors } from "../utils/colors";
import { Event, EventType } from "./Event";

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
				await sendPrivateMessage(user.Id, s.daily);
			}

			else if (notification.Type == NotificationType.Job) {
				if (user.Job.Id !== null) {
					const job = JobList[user.Job.Id];
					await user.EndJob();
					await sendPrivateMessage(user.Id, s.job(job.Description[user.Language], job.Salary), CrColors.Jobs, formatMoney(user.Money, user.Language));
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
		daily: `You can receive your daily money again! ${EmoteString.Experience}`,
		job: (description: string, salary: number) => `You finished your **${description}** job and received ${formatMoney(salary, Language.English)}! ${EmoteString.Jobs}`,
		robAgain: `You can rob again! ${EmoteString.Robbery}`,
		free: `You are free! ${EmoteString.Prison}`,
		hospital: `You are healed! ${EmoteString.Hospital}`,
		almsGive: `You can give alms again! ${EmoteString.Alms}`,
		almsReceive: `You can receive alms again! ${EmoteString.Alms}`,
		scavenge: `You can scavenge again! ${EmoteString.Scavenge}`,
		beatAgain: `You can beat up again! ${EmoteString.Beat}`,
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
	},
} as const;