"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hospital = exports.HospitalFailureReason = void 0;
const UserRepository_1 = require("#core/repositories/UserRepository");
const date_fns_1 = require("date-fns");
const Notification_1 = require("./Notification");
const log_1 = require("#shared/log");
const Language_1 = require("./Language");
const ui_1 = require("#bot/utils/ui");
var HospitalFailureReason;
(function (HospitalFailureReason) {
    HospitalFailureReason[HospitalFailureReason["UserFree"] = 0] = "UserFree";
    HospitalFailureReason[HospitalFailureReason["NextInLine"] = 1] = "NextInLine";
    HospitalFailureReason[HospitalFailureReason["WithoutMoney"] = 2] = "WithoutMoney";
})(HospitalFailureReason || (exports.HospitalFailureReason = HospitalFailureReason = {}));
class Hospital {
    User;
    PrivatePrice;
    PrivateBasePrice = 3_000;
    constructor(user) {
        this.User = user;
        const defFactor = this.User.Attributes.Defense ** 3 / 16;
        const moneyFactor = this.User.Money * 0.05;
        this.PrivatePrice = Math.floor(this.PrivateBasePrice + defFactor + moneyFactor);
    }
    async CanPayPrivate() {
        if (!this.User.IsInHospital()) {
            return { canPay: false, reason: HospitalFailureReason.UserFree };
        }
        if ((0, date_fns_1.differenceInMinutes)(this.User.Hospital.Time, new Date()) < 5) {
            return { canPay: false, reason: HospitalFailureReason.NextInLine };
        }
        if (this.User.Money < this.PrivatePrice) {
            return { canPay: false, reason: HospitalFailureReason.WithoutMoney };
        }
        return { canPay: true };
    }
    async PayPrivate() {
        if (!this.User.IsInHospital()) {
            return false;
        }
        this.User.Money -= this.PrivatePrice;
        this.User.Hospital.TreatmentSum += this.PrivatePrice;
        this.User.Hospital.TreatmentCount += 1;
        this.User.Hospital.Time = new Date();
        await Promise.all([
            Notification_1.Notification.Dismiss(this.User.Id, Notification_1.NotificationType.Hospital),
            this.User.Update({
                money: this.User.Money,
                hospitalTreatmentSum: this.User.Hospital.TreatmentSum,
                hospitalTreatmentCount: this.User.Hospital.TreatmentCount,
                hospitalTime: this.User.Hospital.Time,
            }),
        ]);
        log_1.Log.Success(`User ${this.User.Nickname} (Id: ${this.User.Id}) paid ${(0, ui_1.formatMoney)(this.PrivatePrice, Language_1.Language.English)} for private care in Hospital`);
    }
    async GetHospitalized() {
        return await UserRepository_1.UserRepository.FindAllHospitalized();
    }
}
exports.Hospital = Hospital;
//# sourceMappingURL=Hospital.js.map