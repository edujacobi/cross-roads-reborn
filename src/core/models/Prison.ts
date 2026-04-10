import type { User } from "./User";
import { Language } from "./Language";
import { Users } from "#core/database/Users";
import { Op } from "sequelize";
import { formatMoney } from "#bot/utils/ui";
import { getPrisonBribeClassModifier, getPrisonEscapeClassModifier } from "#core/types/Classes";
import { addMinutes, addSeconds } from "date-fns";
import { Log } from "#shared/log";
import { Notification, NotificationType } from "./Notification";
import { ItemId } from "#core/types/Ids";
import { GangBases } from "#core/types/GangBases";
import { Gang } from "./Gang";

export enum PrisonFailureReason {
	BribeNotInPrison,
	EscapeHasTried,
	EscapeEscaping,
	AttackerIsBeingRobbedById,
	AttackerIsBeatingId,
	AttackerIsBeingBeatedById,
	BribeHasPaid,
	BribeEscaping,
	EscapeInHospital,
	BribeInHospital,
}

export class Prison {
	User: User;

	Bribe = {
		BaseValue: 20_000,
		Value: 0,
	};
	Escape = {
		HasJetpack: false,
		BaseChance: 20,
		BaseJetpackChance: 30,
		UserChance: 0,
		TotalChance: 0,
		DefaultDuration: 40,
	};

	static BribeTimeInMinutesWanted = 40;
	static EscapeTimeInMinutesWanted = 40;

	constructor(user: User) {
		this.User = user;
	}

	async CalculateEscapeChance() {
		const jetpack = await this.User.GetSpecificItem(ItemId.Jetpack);
		this.Escape.HasJetpack = jetpack.RemainingTime > new Date();

		const userClassModifier = getPrisonEscapeClassModifier(this.User.Class);

		// Gang Modifiers
		let gangModifier = 0;
		if (this.User.GangId) {
			const gang = await Gang.GetById(this.User.GangId);
			if (gang) {
				gangModifier = (GangBases[gang.BaseId].Modifier?.PrisonEscape?.Positive || 0) * gang.Level;
			}
		}

		this.Escape.UserChance = this.Escape.HasJetpack ? this.Escape.BaseJetpackChance : 0;
		this.Escape.TotalChance = this.Escape.BaseChance + this.Escape.UserChance + userClassModifier + gangModifier;
	}

	async GetPrisoners() {
		return await Users.findAll({
			attributes: ["nickname", "class", "prisonTime", "robberyFailureCount", "escapeCount"],
			order: [["prisonTime", "DESC"]],
			where: {
				prisonTime: {
					[Op.gt]: new Date(),
				},
			},
		});
	}

	async CanEscape() {
		if (!this.User.IsInPrison()) {
			return { canEscape: false, reason: PrisonFailureReason.BribeNotInPrison };
		}
		if (this.User.IsInHospital()) {
			return { canEscape: false, reason: PrisonFailureReason.EscapeInHospital };
		}
		if (this.User.Escape.HasTried) {
			return { canEscape: false, reason: PrisonFailureReason.EscapeHasTried };
		}
		if (this.User.IsEscaping()) {
			return { canEscape: false, reason: PrisonFailureReason.EscapeEscaping };
		}
		if (this.User.Robbery.IsBeingRobbedById) {
			const user = await Users.findByPk(this.User.Robbery.IsBeingRobbedById, { attributes: ["nickname", "class"] });
			return { canEscape: false, reason: PrisonFailureReason.AttackerIsBeingRobbedById, attacker: user };
		}
		if (this.User.BeatUp.IsBeatingId) {
			const user = await Users.findByPk(this.User.BeatUp.IsBeatingId, { attributes: ["nickname", "class"] });
			return { canEscape: false, reason: PrisonFailureReason.AttackerIsBeatingId, attacker: user };
		}
		if (this.User.BeatUp.IsBeingBeatUpById) {
			const user = await Users.findByPk(this.User.BeatUp.IsBeingBeatUpById, { attributes: ["nickname", "class"] });
			return { canEscape: false, reason: PrisonFailureReason.AttackerIsBeingBeatedById, attacker: user };
		}

		return { canEscape: true };
	}

	async StartEscape() {
		this.User.Escape.HasTried = true;
		this.User.Escape.Time = addSeconds(new Date(), this.Escape.DefaultDuration);

		await this.User.Update({
			escapeHasTried: this.User.Escape.HasTried,
			escapeTime: this.User.Escape.Time,
		});
		Log.Info(`User ${this.User.Nickname} (Id: ${this.User.Id}) started a escape attempt from prison ${this.Escape.HasJetpack ? "with a jetpack" : ""}.`);
	}

	async EndEscape() {
		await Notification.Dismiss(this.User.Id, NotificationType.Free);

		const baseTime = 15;
		const additionalTime = this.User.Attributes.Attack * 0.5;
		const totalTime = baseTime + additionalTime;

		const chance = Math.floor(Math.random() * 101);
		const userClassModifier = getPrisonEscapeClassModifier(this.User.Class);
		// Gang Modifiers
		let gangModifier = 0;
		if (this.User.GangId) {
			const gang = await Gang.GetById(this.User.GangId);
			if (gang) {
				gangModifier = (GangBases[gang.BaseId].Modifier?.PrisonEscape?.Positive || 0) * gang.Level;
			}
		}
		const ESCAPE_CHANCE = this.Escape.TotalChance + userClassModifier + gangModifier;
		const success = chance < ESCAPE_CHANCE;

		if (success) {
			this.User.Escape.Count += 1;
			this.User.Prison.Time = new Date();
			this.User.Wanted.Time = addMinutes(new Date(), Prison.EscapeTimeInMinutesWanted);

			await Notification.RobAgain(this.User);
			Log.Success(`User ${this.User.Nickname} (Id: ${this.User.Id}) successfully escaped from prison. Total escapes: ${this.User.Escape.Count}`);
		}
		else {
			this.User.Prison.Time = addMinutes(this.User.Prison.Time, totalTime);

			await Notification.Free(this.User);
			Log.Success(`User ${this.User.Nickname} (Id: ${this.User.Id}) failed in his attempt to escape from prison. Will be in prison until ${this.User.Prison.Time}`);
		}

		await this.User.Update({
			escapeCount: this.User.Escape.Count,
			prisonTime: this.User.Prison.Time,
			wantedTime: this.User.Wanted.Time,
		});

		return { success, totalTime };
	}

	async CanBribe() {
		if (this.User.Prison.HasPaidBribe) {
			return { canBribe: false, reason: PrisonFailureReason.BribeHasPaid };
		}
		if (!this.User.IsInPrison()) {
			return { canBribe: false, reason: PrisonFailureReason.BribeNotInPrison };
		}
		if (this.User.IsInHospital()) {
			return { canBribe: false, reason: PrisonFailureReason.BribeInHospital };
		}
		if (this.User.IsEscaping()) {
			return { canBribe: false, reason: PrisonFailureReason.BribeEscaping };
		}
		if (this.User.Robbery.IsBeingRobbedById) {
			const user = await Users.findByPk(this.User.Robbery.IsBeingRobbedById, { attributes: ["nickname", "class"] });
			return { canBribe: false, reason: PrisonFailureReason.AttackerIsBeingRobbedById, attacker: user };
		}
		if (this.User.BeatUp.IsBeatingId) {
			const user = await Users.findByPk(this.User.BeatUp.IsBeatingId, { attributes: ["nickname", "class"] });
			return { canBribe: false, reason: PrisonFailureReason.AttackerIsBeatingId, attacker: user };
		}
		if (this.User.BeatUp.IsBeingBeatUpById) {
			const user = await Users.findByPk(this.User.BeatUp.IsBeingBeatUpById, { attributes: ["nickname", "class"] });
			return { canBribe: false, reason: PrisonFailureReason.AttackerIsBeingBeatedById, attacker: user };
		}

		return { canBribe: true };
	}

	CalculateBribeValue() {
		const atkFactor = (this.User.Attributes.Attack * (this.User.Attributes.Attack / 20)) ** 2;
		const moneyFactor = this.User.Money * (this.User.Escape.HasTried ? 0.1 : 0.05);
		this.Bribe.Value = Math.floor(this.Bribe.BaseValue + atkFactor + moneyFactor);
		return this.Bribe.Value;
	}

	async PayBribery(bribeValue: number) {
		const chance = Math.floor(Math.random() * 101);
		const userClassModifier = getPrisonBribeClassModifier(this.User.Class);
		const BRIBE_CHANCE = 75 + userClassModifier;
		const success = chance < BRIBE_CHANCE;

		this.User.Money -= bribeValue;
		this.User.Prison.HasPaidBribe = true;
		this.User.Prison.BriberySum += bribeValue;
		this.User.Prison.BriberyCount += 1;

		if (success) {
			this.User.Prison.Time = new Date();
			this.User.Wanted.Time = addMinutes(new Date(), Prison.BribeTimeInMinutesWanted);

			await Promise.all([
				Notification.Dismiss(this.User.Id, NotificationType.Free),
				Notification.RobAgain(this.User),
			]);
		}

		await this.User.Update({
			money: this.User.Money,
			prisonHasPaidBribe: this.User.Prison.HasPaidBribe,
			prisonBriberySum: this.User.Prison.BriberySum,
			prisonBriberyCount: this.User.Prison.BriberyCount,
			prisonTime: this.User.Prison.Time,
			wantedTime: this.User.Wanted.Time,
		});
		Log.Success(`User ${this.User.Nickname} (Id: ${this.User.Id}) paid a bribe of ${formatMoney(bribeValue, Language.English)} to leave prison. Sucess: ${success}.`);

		return success;
	}
}
