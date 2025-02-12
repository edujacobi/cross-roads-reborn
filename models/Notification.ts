import { Notifications } from "../database/Notifications";
import { Op } from "sequelize";
import { addDays } from "date-fns";
import { Log } from "../utils/log";
import { addHours } from "date-fns/addHours";
import { JobList } from "./Job";
import { User } from "./User";

export enum NotificationType {
	Daily = 1,
	Job,
}

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
		notification.Date = addDays(user.Timers.Daily, 1);
		await notification.Create();
	}

	static async Job(user: User) {
		const notification = new Notification();
		notification.UserId = user.Id;
		notification.Type = NotificationType.Job;
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
}