import { Notifications } from "../database/Notifications";
import { Op } from "sequelize";
import { Rooster } from "./Rooster";
import { addDays } from "date-fns";
import { Log } from "../utils/log";
import { addHours } from "date-fns/addHours";
import { HOURS_TO_HATCH } from "../utils/logic";

export enum NotificationType {
	Rest = 1,
	Train = 2,
	Daily = 3,
	Hatch = 4,
}

export class Notification {
	Id = 0;
	RoosterId = 0;
	Type = NotificationType.Rest;
	Date = new Date();

	async Create() {
		if (this.RoosterId == 0) {
			// Wild Rooster doesn't need a notification
			return;
		}
		if (!this.RoosterId || !this.Type || !this.Date) {
			return Log.Error(`Cannot create Notification Timer without all values. RoosterId: ${this.RoosterId}, Type: ${this.Type}, Date: ${this.Date}`);
		}

		try {
			await Notifications.create({
				roosterId: this.RoosterId,
				type: this.Type,
				date: this.Date,
			});

			Log.Info(`Notification Timer of type ${this.Type} for ${this.RoosterId} created to notify in ${this.Date}.`);

		}
		catch (err) {
			Log.Warning(`Something went wrong with adding Notification Timer for ${this.RoosterId}.`);
		}
	}

	static async Train(rooster: Rooster) {
		const notification = new Notification();
		notification.RoosterId = rooster.Id;
		notification.Type = NotificationType.Train;
		notification.Date = new Date(rooster.Timers.Train);
		await notification.Create();
	}

	static async Rest(rooster: Rooster) {
		const notification = new Notification();
		notification.RoosterId = rooster.Id;
		notification.Type = NotificationType.Rest;
		notification.Date = new Date(rooster.Timers.Rest);
		await notification.Create();
	}

	static async Daily(rooster: Rooster) {
		const notification = new Notification();
		notification.RoosterId = rooster.Id;
		notification.Type = NotificationType.Daily;
		if (!rooster.Daily.LastReceived) {
			return;
		}
		notification.Date = addDays(rooster.Daily.LastReceived, 1);
		await notification.Create();
	}

	static async Hatch(rooster: Rooster) {
		const notification = new Notification();
		notification.RoosterId = rooster.Id;
		notification.Type = NotificationType.Hatch;
		notification.Date = addHours(new Date(), HOURS_TO_HATCH);
		await notification.Create();
	}

<<<<<<< Updated upstream
=======
	static async Job(user: User) {
		const notification = new Notification();
		notification.RoosterId = -1;
		notification.UserId = user.Id;
		notification.Type = NotificationType.Job;
		if (user.Job.Id === null) {
			return;
		}
		notification.Date = addHours(new Date(), JobList[user.Job.Id].Duration);
		console.log(notification.Date, JobList[user.Job.Id].Duration);
		await notification.Create();
	}

>>>>>>> Stashed changes
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
			notificationTimer.RoosterId = notification.roosterId;
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

			Log.Info(`Notification Timer ${this.Id} (Type: ${this.Type}) to rooster ${this.RoosterId} notified.`);

		}
		catch (err) {
			Log.Warning(`Something went wrong with updating Notification ${this.Id}.`);
		}
	}

	static async Dismiss(roosterId: number, type: NotificationType) {
		try {
			const notification = await Notifications.findOne({
				where: {
					roosterId,
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
			Log.Warning(`Something went wrong with dismissing Notification type ${type} of roosterId ${roosterId}.`);
		}
	}
}