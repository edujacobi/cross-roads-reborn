import type { User } from "./User";
import { Users } from "@core/database/Users";
import { Op } from "sequelize";
import { differenceInMinutes } from "date-fns";
import { Notification, NotificationType } from "./Notification";
import { Log } from "@shared/log";
import { Language } from "./Language";
import { formatMoney } from "@bot/utils/ui";

export enum HospitalFailureReason {
	UserFree,
	NextInLine,
	WithoutMoney,
}

export class Hospital {
	User: User;
	PrivatePrice: number;
	PrivateBasePrice = 3_000;

	constructor(user: User) {
		this.User = user;

		const defFactor = this.User.Attributes.Defense ** 3 / 16;
		const moneyFactor = this.User.Money * 0.05;

		this.PrivatePrice = Math.floor(this.PrivateBasePrice + defFactor + moneyFactor);
	}

	async CanPayPrivate() {
		if (!this.User.IsInHospital()) {
			return { canPay: false, reason: HospitalFailureReason.UserFree };
		}
		if (differenceInMinutes(this.User.Hospital.Time, new Date()) < 5) {
			return { canPay: false, reason: HospitalFailureReason.NextInLine };
		}
		if (this.User.Money < this.PrivatePrice) {
			return { canPay: false, reason: HospitalFailureReason.WithoutMoney };
		}

		return { canPay: true };
	}

	async PayPrivate() {
		this.User.Money -= this.PrivatePrice;
		this.User.Hospital.TreatmentSum += this.PrivatePrice;
		this.User.Hospital.TreatmentCount += 1;
		this.User.Hospital.Time = new Date();

		await Promise.all([
			Notification.Dismiss(this.User.Id, NotificationType.Hospital),
			this.User.Update({
				money: this.User.Money,
				hospitalTreatmentSum: this.User.Hospital.TreatmentSum,
				hospitalTreatmentCount: this.User.Hospital.TreatmentCount,
				hospitalTime: this.User.Hospital.Time,
			}),
		]);

		Log.Success(`User ${this.User.Nickname} (Id: ${this.User.Id}) paid ${formatMoney(this.PrivatePrice, Language.English)} for private care in Hospital`);
	}

	async GetHospitalized() {
		return await Users.findAll({
			attributes: ["nickname", "class", "hospitalTime", "hospitalCount"],
			order: [["hospitalTime", "DESC"]],
			where: {
				hospitalTime: {
					[Op.gt]: new Date(),
				},
			},
		});
	}
}
