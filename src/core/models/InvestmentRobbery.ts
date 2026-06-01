import type { User } from "./User";
import type { Gang } from "./Gang";
import { InvestmentList, type InvestmentId, type Investment } from "#core/types/Investments";
import type { UserInvestments } from "#core/database/UserInvestments";
import { UserInvestmentRepository } from "#core/repositories/UserInvestmentRepository";
import { getPercent } from "#shared/utils";
import { addHours, addMinutes, isFuture } from "date-fns";
import { ClassId } from "#core/types/Classes";
import { logger } from "#shared/log";
import { Language } from "./Language";
import { formatMoney } from "#bot/utils/ui";
import { RobHistoryRepository } from "#core/repositories/RobHistoryRepository";

export enum InvestmentRobberyReason {
	NoPermission,
	CantRobYourself,
	LeaderNotIdling,
	TargetSameGang,
	WithoutItem,
	TargetWithoutNick,
	TargetWithoutClass,
	TargetAlreadyUnderAttack,
	TargetNoInvestment,
	TargetNoYield,
	NotInGang,
	ParticipateNotIdling,
	LeaderIsWanted,
	ParticipateIsWanted,
}

export interface InvestmentRobberyValidation {
	success: boolean;
	reason?: InvestmentRobberyReason;
	investmentData?: UserInvestments;
	investmentBase?: Investment;
}

export interface InvestmentRobberyResult {
	win: boolean;
	totalAtk: number;
	totalDef: number;
	successChance: number;
	robbedAmount: number;
	expGain: number;
	henchmanHospitalized: boolean;
	defenderHospitalized: boolean;
	defenderHospitalTime: Date | null;
	attackersHospitalized: boolean;
	remainingYield: number;
	prisonHours: number;
}

export class InvestmentRobbery {
	Gang: Gang;
	Initializer: User;
	Target: User;
	Participants: Map<string, User> = new Map();
	InvestmentData: UserInvestments | null = null;
	InvestmentBase: Investment | null = null;

	constructor(gang: Gang, initializer: User, target: User) {
		this.Gang = gang;
		this.Initializer = initializer;
		this.Target = target;
	}

	async Validate(): Promise<InvestmentRobberyValidation> {
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
		if (this.Target.Class === ClassId.None) {
			return { success: false, reason: InvestmentRobberyReason.TargetWithoutClass };
		}
		if (this.Target.IsDefendingInvestment()) {
			return { success: false, reason: InvestmentRobberyReason.TargetAlreadyUnderAttack };
		}

		const investmentData = await UserInvestmentRepository.FindByUserId(this.Target.Id);
		if (!investmentData) {
			return { success: false, reason: InvestmentRobberyReason.TargetNoInvestment };
		}
		if (investmentData.accumulatedYield <= 0) {
			return { success: false, reason: InvestmentRobberyReason.TargetNoYield };
		}

		const investmentBase = InvestmentList[investmentData.investmentId as InvestmentId];
		this.InvestmentData = investmentData;
		this.InvestmentBase = investmentBase;
		return { success: true, investmentData: investmentData as UserInvestments, investmentBase };
	}

	ValidateJoin(participant: User): { success: boolean; reason?: InvestmentRobberyReason } {
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

	async ApplyAttackerState(participant: User) {
		participant.Robbery.IsRobbingId = this.Target.Id;
		participant.Robbery.ParticipatingInGangAction = true;

		this.Participants.set(participant.Id, participant);

		await participant.Update({ robbingUserId: this.Target.Id, robberyParticipatingInGangAction: true });

		if (participant.Id === this.Initializer.Id) {
			logger.info(`Gang ${this.Gang.Name} (Id: ${this.Gang.Id}) started an investment robbery on user ${this.Target.Nickname} (Id: ${this.Target.Id}). Investment: ${this.InvestmentBase!.Name[Language.English]} has ${formatMoney(this.InvestmentData!.accumulatedYield, Language.English)} accumulated yield`);
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
		logger.info(`Investment Robbery Aborted! Gang ${this.Gang.Name} (Id: ${this.Gang.Id}) aborted the robbery on target ${this.Target.Nickname} (Id: ${this.Target.Id}) with ${this.Participants.size} participants.`);
		await this.ClearAttackerStates();
	}

	async CalculateAndApplyOutcome(defenderJoined: boolean): Promise<InvestmentRobberyResult> {
		if (!this.InvestmentBase || !this.InvestmentData) {
			throw new Error("Investment base or data not found");
		}

		function randomInt(min: number, max: number) {
			return Math.floor(Math.random() * (max - min + 1)) + min;
		}

		let totalAtk = 0;
		for (const participant of this.Participants.values()) {
			totalAtk += participant.Attributes.Attack;
		}
		totalAtk = Math.round(totalAtk * 0.5);

		let totalDef = this.InvestmentBase.BaseDefense;
		let henchmanActive = false;
		if (this.InvestmentData.henchmanEndsAt && !this.InvestmentData.henchmanHospitalized && isFuture(new Date(this.InvestmentData.henchmanEndsAt))) {
			totalDef += 10;
			henchmanActive = true;
		}

		if (defenderJoined) {
			totalDef += 5;
		}

		totalAtk -= getPercent(totalDef, totalAtk);
		const successChance = Math.random() * 100;
		const win = successChance < totalAtk;

		const result: InvestmentRobberyResult = {
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
			await UserInvestmentRepository.DecrementYield(this.Target.Id, robbedAmount);
			this.InvestmentData.accumulatedYield -= robbedAmount;

			this.Gang.Money += robbedAmount;
			await this.Gang.Update();

			const expGain = Math.max(1, Math.floor(robbedAmount * 0.002));
			await this.Gang.AddExperience(expGain);

			result.robbedAmount = robbedAmount;
			result.expGain = expGain;
			result.remainingYield = this.InvestmentData.accumulatedYield;

			if (henchmanActive) {
				await UserInvestmentRepository.UpdateByUserId(this.Target.Id, {
					henchmanHospitalized: true
				});
				this.InvestmentData.henchmanHospitalized = true;
				result.henchmanHospitalized = true;
			}

			if (defenderJoined) {
				const hospitalMins = 30;
				this.Target.Hospital.Time = addMinutes(new Date(), hospitalMins);
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
				participant.Prison.Time = addHours(new Date(), result.prisonHours);

				if (defenderJoined) {
					participant.Hospital.Time = addMinutes(new Date(), 30);
				}

				participant.Robbery.IsRobbingId = null;
				participant.Robbery.ParticipatingInGangAction = false;

				await participant.Update({
					prisonTime: participant.Prison.Time,
					...(defenderJoined && { hospitalTime: participant.Hospital.Time }),
					robbingUserId: null,
					prisonHasPaidBribe: false,
					escapeHasTried: false,
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

		logger.info(`Investment Robbery Finished! Result for Gang ${this.Gang.Name} (Id: ${this.Gang.Id}) vs Target ${this.Target.Nickname} (Id: ${this.Target.Id}): ${JSON.stringify(result)}`);
		
		await RobHistoryRepository.CreateInvestmentHistory(this, win, result.robbedAmount);

		return result;
	}
}
