"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Alms = void 0;
const emotes_1 = require("#bot/utils/emotes");
const ui_1 = require("#bot/utils/ui");
const addHours_1 = require("date-fns/addHours");
const Classes_1 = require("#core/types/Classes");
const log_1 = require("#shared/log");
const Language_1 = require("./Language");
const Notification_1 = require("./Notification");
const discord_js_1 = require("discord.js");
class Alms {
    Giver;
    Receiver;
    Value;
    DefaultHours = 2;
    BaseValue = 50;
    VipValue = Math.round(this.BaseValue * 1.5);
    constructor(giver, receiver) {
        this.Giver = giver;
        this.Receiver = receiver;
        this.Value = this.Giver.IsVip() ? this.VipValue : this.BaseValue;
    }
    CanGiveAlms() {
        const s = Strings[this.Giver.Language];
        let canGive = true;
        let message = "";
        if (this.Giver.Id === this.Receiver.Id) {
            message = `${s.almsYourself} ${emotes_1.EmoteString.Alms}`;
            canGive = false;
        }
        if (this.Giver.Money < this.Value) {
            message = `${s.almsNoMoney} ${emotes_1.EmoteString.Alms}`;
            canGive = false;
        }
        if (this.Giver.Alms.GiveTime > new Date()) {
            message = `${s.almsGiveAgain} ${(0, discord_js_1.time)(this.Giver.Alms.GiveTime, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Alms}`;
            canGive = false;
        }
        if (this.Receiver.Alms.ReceiveTime > new Date()) {
            message = `**${this.Receiver.GetNameWithImage()}** ${s.almsReceiveAgain} ${(0, discord_js_1.time)(this.Receiver.Alms.ReceiveTime, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Alms}`;
            canGive = false;
        }
        if (!this.Receiver.Nickname) {
            message = `${s.withoutNick} ${emotes_1.EmoteString.Alms}`;
            canGive = false;
        }
        if (this.Receiver.Class === Classes_1.ClassId.None) {
            message = `${s.withoutClass} ${emotes_1.EmoteString.Alms}`;
            canGive = false;
        }
        if (this.Giver.Casino.IsInGame) {
            message = `${s.casinoGame} ${emotes_1.EmoteString.Alms}`;
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
        this.Giver.Alms.GiveTime = (0, addHours_1.addHours)(new Date(), this.DefaultHours);
        this.Giver.Alms.GivenSum += this.Value;
        this.Giver.Alms.GivenCount += 1;
        this.Receiver.Money += this.Value;
        this.Receiver.Alms.ReceiveTime = (0, addHours_1.addHours)(new Date(), this.DefaultHours);
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
            Notification_1.Notification.AlmsGive(this.Giver),
            // Notification.AlmsReceive(this.Receiver),
        ]);
        log_1.Log.Success(`User ${this.Giver.Nickname} (Id: ${this.Giver.Id}) gave ${(0, ui_1.formatMoney)(this.Value, Language_1.Language.English)} to ${this.Receiver.Nickname} (Id: ${this.Receiver.Id}).`);
    }
}
exports.Alms = Alms;
const Strings = {
    [Language_1.Language.English]: {
        almsYourself: "You can't give alms to yourself",
        almsNoMoney: "You don't have enough money to give alms",
        almsGiveAgain: "You'll be able to give alms again",
        almsReceiveAgain: "will be able to receive alms again",
        withoutNick: "This user hasn't set a nickname yet!",
        withoutClass: "This user hasn't choose a class yet!",
        casinoGame: "You can't give alms while playing in the casino",
    },
    [Language_1.Language.Portuguese]: {
        almsYourself: "Você não pode dar esmola para si mesmo",
        almsNoMoney: "Você não tem dinheiro suficiente para dar esmola",
        almsGiveAgain: "Você poderá entregar esmola novamente",
        almsReceiveAgain: "poderá receber esmola novamente",
        withoutNick: "Este usuário ainda não cadastrou um nickname!",
        withoutClass: "Este usuário ainda não escolheu uma classe!",
        casinoGame: "Você não pode dar esmola enquanto estiver jogando no cassino",
    },
    [Language_1.Language.Spanish]: {
        almsYourself: "No puedes dar limosna a ti mismo",
        almsNoMoney: "No tienes suficiente dinero para dar limosna",
        almsGiveAgain: "Podrás dar limosna de nuevo",
        almsReceiveAgain: "podrá recibir limosna de nuevo",
        withoutNick: "¡Este usuario aún no ha establecido un apodo!",
        withoutClass: "¡Este usuario aún no ha elegido una clase!",
        casinoGame: "No puedes dar limosna mientras estás jugando en el casino",
    },
};
//# sourceMappingURL=Alms.js.map