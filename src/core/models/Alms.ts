import type { User } from "./User";
import { EmoteString } from "@bot/utils/emotes";
import { formatMoney, showTime } from "@bot/utils/ui";
import { addHours } from "date-fns/addHours";
import { ClassId } from "@core/types/Classes";
import { Log } from "@shared/log";
import { Language } from "./Language";
import { Notification } from "./Notification";

export class Alms {
	Giver: User;
	Receiver: User;
	Value: number;
	DefaultHours = 2;
	BaseValue = 50;
	VipValue = Math.round(this.BaseValue * 1.5);

	constructor(giver: User, receiver: User) {
		this.Giver = giver;
		this.Receiver = receiver;
		this.Value = this.Giver.IsVip() ? this.VipValue : this.BaseValue;
	}

	CanGiveAlms() {
		const s = Strings[this.Giver.Language];
		let canGive = true;
		let message = "";

		if (this.Giver.Id === this.Receiver.Id) {
			message = `${s.almsYourself} ${EmoteString.Alms}`;
			canGive = false;
		}

		if (this.Giver.Money < this.Value) {
			message = `${s.almsNoMoney} ${EmoteString.Alms}`;
			canGive = false;
		}

		if (this.Giver.Alms.GiveTime > new Date()) {
			message = `${s.almsGiveAgain} ${showTime(this.Giver.Alms.GiveTime.getTime(), true)} ${EmoteString.Alms}`;
			canGive = false;
		}

		if (this.Receiver.Alms.ReceiveTime > new Date()) {
			message = `**${this.Receiver.GetNameWithImage()}** ${s.almsReceiveAgain} ${showTime(this.Receiver.Alms.ReceiveTime.getTime(), true)} ${EmoteString.Alms}`;
			canGive = false;
		}

		if (!this.Receiver.Nickname) {
			message = `${s.withoutNick} ${EmoteString.Alms}`;
			canGive = false;
		}

		if (this.Receiver.Class === ClassId.None) {
			message = `${s.withoutClass} ${EmoteString.Alms}`;
			canGive = false;
		}

		if (this.Giver.Casino.IsInGame) {
			message = `${s.casinoGame} ${EmoteString.Alms}`;
			canGive = false;
		}

		return { canGive, message };
	}

	async GiveAlms() {
		await Promise.all([
			this.Giver.GetInfo(),
			this.Receiver.GetInfo(),
		]);

		this.Giver.Money -= this.Value;
		this.Giver.Alms.GiveTime = addHours(new Date(), this.DefaultHours);
		this.Giver.Alms.GivenSum += this.Value;
		this.Giver.Alms.GivenCount += 1;

		this.Receiver.Money += this.Value;
		this.Receiver.Alms.ReceiveTime = addHours(new Date(), this.DefaultHours);
		this.Receiver.Alms.ReceivedCount += 1;
		this.Receiver.Alms.ReceivedSum += this.Value;

		await Promise.all([
			this.Giver.Update({
				money: this.Giver.Money,
				almsGiveTime: this.Giver.Alms.GiveTime,
				almsGivenSum: this.Giver.Alms.GivenSum,
				almsGivenCount: this.Giver.Alms.GivenCount,
			}),
			this.Receiver.Update({
				money: this.Receiver.Money,
				almsReceiveTime: this.Receiver.Alms.ReceiveTime,
				almsReceivedSum: this.Receiver.Alms.ReceivedSum,
				almsReceivedCount: this.Receiver.Alms.ReceivedCount,
			}),
			Notification.AlmsGive(this.Giver),
			// Notification.AlmsReceive(this.Receiver),
		]);

		Log.Success(`User ${this.Giver.Nickname} (ID: ${this.Giver.Id}) gave ${formatMoney(this.Value, Language.English)} to ${this.Receiver.Nickname} (ID: ${this.Receiver.Id}).`);
	}
}

const Strings = {
	[Language.English]: {
		almsYourself: "You can't give alms to yourself",
		almsNoMoney: "You don't have enough money to give alms",
		almsGiveAgain: "You'll be able to give alms again",
		almsReceiveAgain: "will be able to receive alms again",
		withoutNick: "This user hasn't set a nickname yet!",
		withoutClass: "This user hasn't choose a class yet!",
		casinoGame: "You can't give alms while playing in the casino",
	},
	[Language.Portuguese]: {
		almsYourself: "Você não pode dar esmola para si mesmo",
		almsNoMoney: "Você não tem dinheiro suficiente para dar esmola",
		almsGiveAgain: "Você poderá entregar esmola novamente",
		almsReceiveAgain: "poderá receber esmola novamente",
		withoutNick: "Este usuário ainda não cadastrou um nickname!",
		withoutClass: "Este usuário ainda não escolheu uma classe!",
		casinoGame: "Você não pode dar esmola enquanto estiver jogando no cassino",
	},
	[Language.Spanish]: {
		almsYourself: "No puedes dar limosna a ti mismo",
		almsNoMoney: "No tienes suficiente dinero para dar limosna",
		almsGiveAgain: "Podrás dar limosna de nuevo",
		almsReceiveAgain: "podrá recibir limosna de nuevo",
		withoutNick: "¡Este usuario aún no ha establecido un apodo!",
		withoutClass: "¡Este usuario aún no ha elegido una clase!",
		casinoGame: "No puedes dar limosna mientras estás jugando en el casino",
	},
};