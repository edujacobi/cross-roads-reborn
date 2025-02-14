import { Notifications } from "../database/Notifications";
import { Op } from "sequelize";
import { addDays } from "date-fns";
import { Log } from "../utils/log";
import { addHours } from "date-fns/addHours";
import { JobList } from "./Job";
import { User } from "./User";
import { Language } from "./Language";
import { EmoteString } from "../utils/emotes";
import { formatMoney } from "../utils/ui";
import { sendPrivateMessage } from "../utils/logic";

export enum NotificationType {
	Daily = 1,
	Job,
}

export class Notification {
	Id = 0;
	UserId = "";
	Type = NotificationType.Daily;
	Date = new Date();
	Language = Language.English;

	async Create() {
		if (!this.UserId || !this.Type || !this.Date) {
			return Log.Error(`Cannot create Notification Timer without all values. UserId: ${this.UserId}, Type: ${this.Type}, Date: ${this.Date}`);
		}

		try {
			await Notifications.create({
				userId: this.UserId,
				type: this.Type,
				date: this.Date,
				language: this.Language,
			});

			Log.Info(`Notification Timer of type ${this.Type} for ${this.UserId} created to notify in ${this.Date}.`);

		}
		catch (err) {
			Log.Warning(`Something went wrong with adding Notification Timer for ${this.UserId}.`);
		}
	}

	static async Daily(user: User) {
		const notification = new Notification();
		notification.UserId = user.Id;
		notification.Type = NotificationType.Daily;
		notification.Language = user.Language;
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
		notification.Language = user.Language;
		if (user.Job.Id === null) {
			return;
		}
		notification.Date = addHours(new Date(), JobList[user.Job.Id].Duration);
		console.log(notification.Date, JobList[user.Job.Id].Duration);
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
			notificationTimer.Language = notification.language;

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

			Log.Info(`Notification Timer ${this.Id} (Type: ${this.Type}) to rooster ${this.UserId} notified.`);

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

		Log.Info(`Starting notification procedure ↓`);
		const list = await Notification.GetNextNotifications(now);

		for (const notification of list) {
			const lang = notification.Language;
			const s = Strings[lang];
			const user = await new User(notification.UserId).GetInfo();

			if (!user) {
				Log.Warning(`Cannot send private message if the user was deleted (UserId: ${notification.UserId}).`);
				await notification.SetAsNotified();
				continue;
			}

			else if (notification.Type == NotificationType.Daily) {
				await sendPrivateMessage(user.Id, s.daily);
			}

			else if (notification.Type == NotificationType.Job) {
				if (user.Job.Id === null) {
					return;
				}
				const job = JobList[user.Job.Id];
				await user.EndJob();
				await sendPrivateMessage(notification.UserId, s.job(job.Description[lang], job.Salary));
			}

			await notification.SetAsNotified();
		}
		Log.Info(`Notification procedure complete ↑`);
	}

	static StartProcedure() {
		setInterval(this.SendTimedNotification, 40_000);
	}
}

const Strings = {
	[Language.English]: {
		daily: `${EmoteString.Experience} You can receive your daily money again!`,
		job: (description: string, salary: number) => `You finished your ${description} job and received ${formatMoney(salary, Language.English)}!`
	},
	[Language.Portuguese]: {
		daily: `${EmoteString.Experience} Você pode receber sua grana diária novamente!`,
		job: (description: string, salary: number) => `Você terminou seu trabalho ${description} e recebeu ${formatMoney(salary, Language.Portuguese)}!`
	},
	[Language.Spanish]: {
		daily: `${EmoteString.Experience} ¡Puedes recibir tu dinero diario de nuevo!`,
		job: (description: string, salary: number) => `Terminaste tu trabajo ${description} y recibiste ${formatMoney(salary, Language.Spanish)}!`
	},
};