"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvestmentRobbery = exports.InvestmentRobberyReason = void 0;
const Investments_1 = require("#core/types/Investments");
const UserInvestmentRepository_1 = require("#core/repositories/UserInvestmentRepository");
const utils_1 = require("#shared/utils");
const date_fns_1 = require("date-fns");
const Classes_1 = require("#core/types/Classes");
const log_1 = require("#shared/log");
const Language_1 = require("./Language");
const ui_1 = require("#bot/utils/ui");
const RobHistoryRepository_1 = require("#core/repositories/RobHistoryRepository");
const Prison_1 = require("./Prison");
var InvestmentRobberyReason;
(function (InvestmentRobberyReason) {
    InvestmentRobberyReason[InvestmentRobberyReason["NoPermission"] = 0] = "NoPermission";
    InvestmentRobberyReason[InvestmentRobberyReason["CantRobYourself"] = 1] = "CantRobYourself";
    InvestmentRobberyReason[InvestmentRobberyReason["LeaderNotIdling"] = 2] = "LeaderNotIdling";
    InvestmentRobberyReason[InvestmentRobberyReason["TargetSameGang"] = 3] = "TargetSameGang";
    InvestmentRobberyReason[InvestmentRobberyReason["WithoutItem"] = 4] = "WithoutItem";
    InvestmentRobberyReason[InvestmentRobberyReason["TargetWithoutNick"] = 5] = "TargetWithoutNick";
    InvestmentRobberyReason[InvestmentRobberyReason["TargetWithoutClass"] = 6] = "TargetWithoutClass";
    InvestmentRobberyReason[InvestmentRobberyReason["TargetAlreadyUnderAttack"] = 7] = "TargetAlreadyUnderAttack";
    InvestmentRobberyReason[InvestmentRobberyReason["TargetNoInvestment"] = 8] = "TargetNoInvestment";
    InvestmentRobberyReason[InvestmentRobberyReason["TargetNoYield"] = 9] = "TargetNoYield";
    InvestmentRobberyReason[InvestmentRobberyReason["NotInGang"] = 10] = "NotInGang";
    InvestmentRobberyReason[InvestmentRobberyReason["ParticipateNotIdling"] = 11] = "ParticipateNotIdling";
    InvestmentRobberyReason[InvestmentRobberyReason["LeaderIsWanted"] = 12] = "LeaderIsWanted";
    InvestmentRobberyReason[InvestmentRobberyReason["ParticipateIsWanted"] = 13] = "ParticipateIsWanted";
})(InvestmentRobberyReason || (exports.InvestmentRobberyReason = InvestmentRobberyReason = {}));
class InvestmentRobbery {
    Gang;
    Initializer;
    Target;
    Participants = new Map();
    InvestmentData = null;
    InvestmentBase = null;
    constructor(gang, initializer, target) {
        this.Gang = gang;
        this.Initializer = initializer;
        this.Target = target;
    }
    async Validate() {
        if (!this.Gang.CanEdit(this.Initializer.Id)) {
            return { success: false, reason: InvestmentRobberyReason.NoPermission };
        }
        if (this.Target.Id === this.Initializer.Id) {
            return { success: false, reason: InvestmentRobberyReason.CantRobYourself };
        }
        if (!this.Initializer.IsIdling()) {
            return { success: false, reason: InvestmentRobberyReason.LeaderNotIdling };
        }
        if (this.Target.GangId === this.Gang.Id) {
            return { success: false, reason: InvestmentRobberyReason.TargetSameGang };
        }
        if (this.Initializer.IsWanted()) {
            return { success: false, reason: InvestmentRobberyReason.LeaderIsWanted };
        }
        if (!this.Initializer.BestGun) {
            return { success: false, reason: InvestmentRobberyReason.WithoutItem };
        }
        // Target Checks
        if (!this.Target.Nickname) {
            return { success: false, reason: InvestmentRobberyReason.TargetWithoutNick };
        }
        if (this.Target.Class === Classes_1.ClassId.None) {
            return { success: false, reason: InvestmentRobberyReason.TargetWithoutClass };
        }
        if (this.Target.IsDefendingInvestment() || this.Target.IsInRobbery() || this.Target.IsInBeatUp()) {
            return { success: false, reason: InvestmentRobberyReason.TargetAlreadyUnderAttack };
        }
        const investmentData = await UserInvestmentRepository_1.UserInvestmentRepository.FindByUserId(this.Target.Id);
        if (!investmentData) {
            return { success: false, reason: InvestmentRobberyReason.TargetNoInvestment };
        }
        if (investmentData.accumulatedYield <= 0) {
            return { success: false, reason: InvestmentRobberyReason.TargetNoYield };
        }
        const investmentBase = Investments_1.InvestmentList[investmentData.investmentId];
        this.InvestmentData = investmentData;
        this.InvestmentBase = investmentBase;
        return { success: true, investmentData: investmentData, investmentBase };
    }
    ValidateJoin(participant) {
        if (participant.GangId !== this.Gang.Id) {
            return { success: false, reason: InvestmentRobberyReason.NotInGang };
        }
        if (participant.GangId === this.Target.GangId) {
            return { success: false, reason: InvestmentRobberyReason.TargetSameGang };
        }
        if (!participant.BestGun) {
            return { success: false, reason: InvestmentRobberyReason.WithoutItem };
        }
        if (!participant.IsIdling()) {
            return { success: false, reason: InvestmentRobberyReason.ParticipateNotIdling };
        }
        if (participant.IsWanted()) {
            return { success: false, reason: InvestmentRobberyReason.ParticipateIsWanted };
        }
        return { success: true };
    }
    async ApplyAttackerState(participant) {
        participant.Robbery.IsRobbingId = this.Target.Id;
        participant.Robbery.ParticipatingInGangAction = true;
        this.Participants.set(participant.Id, participant);
        await participant.Update({ robbingUserId: this.Target.Id, robberyParticipatingInGangAction: true });
        if (participant.Id === this.Initializer.Id) {
            log_1.logger.info(`Gang ${this.Gang.Name} (Id: ${this.Gang.Id}) started an investment robbery on user ${this.Target.Nickname} (Id: ${this.Target.Id}). Investment: ${this.InvestmentBase.Name[Language_1.Language.English]} has ${(0, ui_1.formatMoney)(this.InvestmentData.accumulatedYield, Language_1.Language.English)} accumulated yield`);
        }
    }
    async ApplyDefenderState() {
        this.Target.Robbery.InvestmentIsDefending = true;
        await this.Target.Update({ robberyInvestmentDefending: true });
    }
    async ClearTargetState() {
        this.Target.Robbery.InvestmentIsDefending = false;
        await this.Target.Update({ robberyInvestmentDefending: false });
    }
    async ClearAttackerStates() {
        for (const participant of this.Participants.values()) {
            participant.Robbery.IsRobbingId = null;
            participant.Robbery.ParticipatingInGangAction = false;
            await participant.Update({ robbingUserId: null, robberyParticipatingInGangAction: false });
        }
        await this.ClearTargetState();
    }
    async Abort() {
        log_1.logger.info(`Investment Robbery Aborted! Gang ${this.Gang.Name} (Id: ${this.Gang.Id}) aborted the robbery on target ${this.Target.Nickname} (Id: ${this.Target.Id}) with ${this.Participants.size} participants.`);
        await this.ClearAttackerStates();
    }
    async CalculateAndApplyOutcome(defenderJoined) {
        if (!this.InvestmentBase || !this.InvestmentData) {
            throw new Error("Investment base or data not found");
        }
        function randomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
        let totalAtk = 0;
        for (const participant of this.Participants.values()) {
            totalAtk += participant.Attributes.Attack;
        }
        totalAtk = Math.round(totalAtk * 0.5);
        let totalDef = this.InvestmentBase.BaseDefense;
        let henchmanActive = false;
        if (this.InvestmentData.henchmanEndsAt && !this.InvestmentData.henchmanHospitalized && (0, date_fns_1.isFuture)(new Date(this.InvestmentData.henchmanEndsAt))) {
            totalDef += 10;
            henchmanActive = true;
        }
        if (defenderJoined) {
            totalDef += 5;
        }
        totalAtk -= (0, utils_1.getPercent)(totalDef, totalAtk);
        const successChance = Math.random() * 100;
        const win = successChance < totalAtk;
        const result = {
            win,
            totalAtk,
            totalDef,
            successChance,
            robbedAmount: 0,
            expGain: 0,
            henchmanHospitalized: false,
            defenderHospitalized: false,
            defenderHospitalTime: null,
            attackersHospitalized: false,
            remainingYield: this.InvestmentData.accumulatedYield,
            prisonHours: this.InvestmentBase.PrisonSeverity,
        };
        if (win) {
            const basePercent = randomInt(30, 90);
            const bonusPercent = (this.Participants.size - 1) * 5;
            const totalPercent = Math.min(100, basePercent + bonusPercent) / 100;
            const robbedAmount = Math.floor(this.InvestmentData.accumulatedYield * totalPercent);
            await UserInvestmentRepository_1.UserInvestmentRepository.DecrementYield(this.Target.Id, robbedAmount);
            this.InvestmentData.accumulatedYield -= robbedAmount;
            this.Gang.Money += robbedAmount;
            await this.Gang.Update();
            const expGain = Math.max(1, Math.floor(robbedAmount * 0.002));
            await this.Gang.AddExperience(expGain);
            result.robbedAmount = robbedAmount;
            result.expGain = expGain;
            result.remainingYield = this.InvestmentData.accumulatedYield;
            if (henchmanActive) {
                await UserInvestmentRepository_1.UserInvestmentRepository.UpdateByUserId(this.Target.Id, {
                    henchmanHospitalized: true
                });
                this.InvestmentData.henchmanHospitalized = true;
                result.henchmanHospitalized = true;
            }
            if (defenderJoined) {
                const hospitalMins = 30;
                this.Target.Hospital.Time = (0, date_fns_1.addMinutes)(new Date(), hospitalMins);
                this.Target.Robbery.InvestmentIsDefending = false;
                await this.Target.Update({
                    hospitalTime: this.Target.Hospital.Time,
                    robberyInvestmentDefending: false
                });
                result.defenderHospitalized = true;
                result.defenderHospitalTime = this.Target.Hospital.Time;
            }
            await this.ClearAttackerStates();
        }
        else {
            if (defenderJoined) {
                result.attackersHospitalized = true;
            }
            for (const participant of this.Participants.values()) {
                await Prison_1.Prison.Arrest(participant, result.prisonHours * 60);
                if (defenderJoined) {
                    participant.Hospital.Time = (0, date_fns_1.addMinutes)(new Date(), 30);
                }
                participant.Robbery.IsRobbingId = null;
                participant.Robbery.ParticipatingInGangAction = false;
                await participant.Update({
                    ...(defenderJoined && { hospitalTime: participant.Hospital.Time }),
                    robbingUserId: null,
                    robberyParticipatingInGangAction: false
                });
            }
            if (defenderJoined) {
                this.Target.Robbery.InvestmentIsDefending = false;
                await this.Target.Update({
                    robberyInvestmentDefending: false
                });
            }
        }
        log_1.logger.info(`Investment Robbery Finished! Result for Gang ${this.Gang.Name} (Id: ${this.Gang.Id}) vs Target ${this.Target.Nickname} (Id: ${this.Target.Id}): ${JSON.stringify(result)}`);
        await RobHistoryRepository_1.RobHistoryRepository.CreateInvestmentHistory(this, win, result.robbedAmount);
        return result;
    }
}
exports.InvestmentRobbery = InvestmentRobbery;
//# sourceMappingURL=InvestmentRobbery.js.map