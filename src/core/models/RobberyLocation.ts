import { User } from "./User";
import { Log } from "#shared/log";
import { formatMoney, showTime } from "#bot/utils/ui";
import { EmoteString } from "#bot/utils/emotes";

import { Notification } from "./Notification";
import { addMinutes } from "date-fns";
import { globalStrings, Language, type Localization } from "./Language";
import { RobHistories } from "#core/database/RobHistories";
import { Users } from "#core/database/Users";
import { type JobId, JobList } from "#core/types/Jobs";
import { ClashType, Robbery, type RobberyInitData } from "./Robbery";
import { type LocationId, LocationList } from "#core/types/Locations";
import { ClassList, getRobberyClassModifier } from "#core/types/Classes";
import { type ScavengeId, ScavengeList } from "#core/types/Scavenge";
import { Event, EventType } from "./Event";

export interface RobberyLocationOutcomeData {
	success: boolean;
	moneyRobbed: number;
	attackerPrisonTime?: Date;
	attackerWantedTime?: Date;
}

export class RobberyLocation extends Robbery {
	LocationId: LocationId;
	RewardMin: number;
	RewardMax: number;

	constructor(attacker: User, locationId: LocationId) {
		super(attacker, new User("0", Language.English)); // defender will not be used
		this.Attacker = attacker;
		this.LocationId = locationId;
		this.Type = ClashType.Location;
		this.Date = new Date();

		const userClassModifier = getRobberyClassModifier(this.Attacker.Class);

		const location = LocationList[this.LocationId];

		this.RewardMin = Math.floor(location.Reward.Min * userClassModifier);
		this.RewardMax = Math.floor(location.Reward.Max * userClassModifier);
	}

	async CanRobLocation() {
		const s = Strings[this.Attacker.Language];
		let canRob = true;
		let message = "";

		const location = LocationList[this.LocationId];

		if (this.Attacker.Attributes.Attack < location.NeedAttack) {
			message = `${s.needMoreAttack} ${EmoteString.Robbery}`;
			canRob = false;
		}

		const attackerCheck = this.Attacker.CheckAvailability();
		if (!attackerCheck.available) {
			canRob = false;
			switch (attackerCheck.reason) {
			case "scavenging":
				message = s.scavenging(attackerCheck.referenceId as ScavengeId);
				break;
			case "working":
				message = s.inJob(attackerCheck.time!, attackerCheck.referenceId as JobId);
				break;
			case "prison":
				message = s.inPrison(attackerCheck.time!);
				break;
			case "wanted":
				message = s.isWanted(attackerCheck.time!);
				break;
			case "hospital":
				message = s.isInHospital(attackerCheck.time!);
				break;
			case "casino":
				message = s.isInCasino;
				break;
			case "defendingInvestment":
				message = globalStrings[this.Attacker.Language].attackerIsDefendingInvestment;
				break;
			case "gangAction":
				message = globalStrings[this.Attacker.Language].attackerIsParticipatingInGangAction;
				break;
			case "beating": {
				const user = await Users.findByPk(attackerCheck.targetId!, { attributes: ["class", "nickname"] });
				message = globalStrings[this.Attacker.Language].attackerIsBeatingId(`${ClassList[user!.class].Image.Emote.String} ${user!.nickname!}`);
				break;
			}
			case "beingBeatUp": {
				const user = await Users.findByPk(attackerCheck.targetId!, { attributes: ["class", "nickname"] });
				message = globalStrings[this.Attacker.Language].attackerIsBeingBeatedById(`${ClassList[user!.class!].Image.Emote.String} ${user!.nickname!}`);
				break;
			}
			case "robbing": {
				const user = await Users.findByPk(attackerCheck.targetId!, { attributes: ["class", "nickname"] });
				message = globalStrings[this.Attacker.Language].attackerIsRobbingId(`${ClassList[user!.class].Image.Emote.String} ${user!.nickname!}`);
				break;
			}
			case "beingRobbed": {
				const user = await Users.findByPk(attackerCheck.targetId!, { attributes: ["class", "nickname"] });
				message = globalStrings[this.Attacker.Language].attackerIsBeingRobbedById(`${ClassList[user!.class!].Image.Emote.String} ${user!.nickname!}`);
				break;
			}
			case "robbingLocation": {
				const location = LocationList[attackerCheck.referenceId as LocationId];
				message = globalStrings[this.Attacker.Language].attackerIsRobbingId(location.Name[this.Attacker.Language]);
				break;
			}
			}
		}

		return { canRob, message };
	}

	async LockStates(): Promise<RobberyInitData> {
		this.AttackerTimeInPrison = 20 * (this.LocationId + 1);

		this.Attacker.Robbery.IsRobbingLocationId = this.LocationId;

		await this.Attacker.Update({
			robbingLocationId: this.Attacker.Robbery.IsRobbingLocationId,
		});

		Log.Info(`User ${this.Attacker.Nickname} (Id: ${this.Attacker.Id}) locked states for robbing location ${LocationList[this.LocationId].Name[Language.English]} (Id: ${LocationList[this.LocationId].Id}).`);

		const usedGunSkin = this.Attacker.GetItemSkin(this.Attacker.BestGun!);
		const usedGunName = this.Attacker.BestGun?.Description[this.Attacker.Language] || "";

		return {
			attackerTimeInPrison: this.AttackerTimeInPrison,
			attackerAditionalTimeCallPolice: 0,
			defenderTimeInHospital: 0,
			cannotReact: true,
			cannotCallPolice: true,
			usedGunSkin,
			usedGunName,
		};
	}

	async ResolveLocation(): Promise<RobberyLocationOutcomeData> {
		try {
			await this.Attacker.GetInfo();

			this.Chance = Math.random() * 100;
			const robLocationChanceBonus = await Event.GetActiveBonusFromType(EventType.ROB_LOCATION_CHANCE_BONUS);
			this.Success = this.Chance < (LocationList[this.LocationId].SuccessChance + robLocationChanceBonus);

			if (this.Success) {
				this.MoneyRobbed = Math.floor(Math.random() * (this.RewardMax - this.RewardMin + 1)) + this.RewardMin;
				this.Attacker.Money += this.MoneyRobbed;
				this.Attacker.Robbery.SuccessCount += 1;
				this.Attacker.Robbery.SuccessRobbedSum += this.MoneyRobbed;
				const wantedTimeMultiplier = await Event.GetActiveFromType(EventType.WANTED_TIME_MULTIPLIER);
				this.Attacker.Wanted.Time = addMinutes(new Date(), 60 * wantedTimeMultiplier);

				await Notification.RobAgain(this.Attacker);

				Log.Success(`User ${this.Attacker.Nickname} (Id: ${this.Attacker.Id}) successfully robbed location ${LocationList[this.LocationId].Name[Language.English]} (Id: ${LocationList[this.LocationId].Id}) and got ${formatMoney(this.MoneyRobbed, Language.English)}.`);

				return {
					success: true,
					moneyRobbed: this.MoneyRobbed,
					attackerWantedTime: this.Attacker.Wanted.Time,
				};
			}
			else {
				const prisonTimeMultiplier = await Event.GetActiveFromType(EventType.PRISON_TIME_MULTIPLIER);
				this.Attacker.Prison.Time = addMinutes(new Date(), this.AttackerTimeInPrison * prisonTimeMultiplier);
				this.Attacker.Prison.HasPaidBribe = false;
				this.Attacker.Escape.HasTried = false;
				this.Attacker.Robbery.FailureCount += 1;
				this.Attacker.Prison.Count += 1;

				await Notification.Free(this.Attacker);

				Log.Success(`User ${this.Attacker.Nickname} (Id: ${this.Attacker.Id}) failed to rob location ${LocationList[this.LocationId].Name[Language.English]} (Id: ${LocationList[this.LocationId].Id}).`);

				return {
					success: false,
					moneyRobbed: 0,
					attackerPrisonTime: this.Attacker.Prison.Time,
				};
			}
		}
		catch (error) {
			Log.Error(`Error during ResolveLocation: ${error}`);
			throw error;
		}
		finally {
			this.Attacker.Robbery.IsRobbingLocationId = null;
			await this.Attacker.Update({
				money: this.Attacker.Money,
				robberySuccessCount: this.Attacker.Robbery.SuccessCount,
				robberySuccessRobbedSum: this.Attacker.Robbery.SuccessRobbedSum,
				wantedTime: this.Attacker.Wanted.Time,
				prisonTime: this.Attacker.Prison.Time,
				prisonHasPaidBribe: this.Attacker.Prison.HasPaidBribe,
				escapeHasTried: this.Attacker.Escape.HasTried,
				robberyFailureCount: this.Attacker.Robbery.FailureCount,
				prisonCount: this.Attacker.Prison.Count,
				robbingLocationId: this.Attacker.Robbery.IsRobbingLocationId,
			});

			await RobHistories.CreateLocationHistory(this);
		}
	}

	async ReleaseLocks(): Promise<void> {
		this.Attacker.Robbery.IsRobbingLocationId = null;

		await this.Attacker.Update({
			robbingLocationId: null,
		});
	}
}

export const Strings = {
	[Language.English]: {
		// CanRob
		needMoreAttack: `You need more ${EmoteString.Attack}ATK to rob this location!`,
		scavenging: (placeId: ScavengeId) => `You can't rob while scavenging ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.English]}** ${EmoteString.Scavenge}`,
		inJob: (jobTime: Date, jobId: JobId) => `You can't rob while working! ${EmoteString.Jobs}\n-# Will finish your **${JobList[jobId].Description[Language.English]}** job ${showTime(jobTime.getTime(), true)}!`,
		inPrison: (prisonTime: Date) => `You can't rob while you're in prison! ${EmoteString.Prison}\n-# Will be released ${showTime(prisonTime.getTime(), true)}!`,
		isWanted: (wantedTime: Date) => `You can't rob while you're wanted by the police! ${EmoteString.Police}\n-# Will be able to rob again ${showTime(wantedTime.getTime(), true)}!`,
		isInHospital: (hospitalTime: Date) => `You can't rob while you're hospitalized! ${EmoteString.Hospital}\n-# Will be healed ${showTime(hospitalTime.getTime(), true)}!`,
		isInCasino: `You can't rob while you're in a casino game! ${EmoteString.Casino}`,
		// Attacker
		robberyInProgress: `Robbery in progress`,
		tryingToRob: "Trying to rob",
		youRobbed: (formattedMoney: string, placeName: string) => `You robbed ${formattedMoney} from **${placeName}**!`,
		youFailed: (placeName: string) => `You failed in your attempt to rob **${placeName}**`,
		prisonTime: (time: Date) => `Will be in prison until ${showTime(time.getTime())}`,
		finishedRobberyAttacker: (success: boolean) => `Robbery ${success ? "successful" : "unsuccessful"}`,
		willBeAbleAgain: "Will be able to rob again",
		success: "Success",
		failure: "Failure",
	},
	[Language.Portuguese]: {
		// CanRob
		needMoreAttack: `Você precisa mais ${EmoteString.Attack}ATK para roubar este local!`,
		scavenging: (placeId: ScavengeId) => `Você não pode roubar enquanto está vasculhando ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Portuguese]}** ${EmoteString.Scavenge}`,
		inJob: (jobTime: Date, jobId: JobId) => `Você não pode roubar enquanto está trabalhando! ${EmoteString.Jobs}\n-# Terminará seu trabalho de **${JobList[jobId].Description[Language.Portuguese]}** ${showTime(jobTime.getTime(), true)}!`,
		inPrison: (prisonTime: Date) => `Você não pode roubar enquanto está preso! ${EmoteString.Prison}\n-# Será solto ${showTime(prisonTime.getTime(), true)}!`,
		isWanted: (wantedTime: Date) => `Você não pode roubar enquanto está sendo procurado pela polícia! ${EmoteString.Police}\n-# Poderá roubar novamente ${showTime(wantedTime.getTime(), true)}!`,
		isInHospital: (hospitalTime: Date) => `Você não pode roubar enquanto está hospitalizado! ${EmoteString.Hospital}\n-# Será curado ${showTime(hospitalTime.getTime(), true)}!`,
		isInCasino: `Você não pode roubar enquanto está em um jogo de cassino! ${EmoteString.Casino}`,
		// Attacker
		robberyInProgress: `Roubo em andamento`,
		tryingToRob: "Tentando roubar",
		youRobbed: (formattedMoney: string, placeName: string) => `Você roubou ${formattedMoney} de **${placeName}**!`,
		youFailed: (placeName: string) => `Você falhou na sua tentativa de roubar **${placeName}**`,
		prisonTime: (time: Date) => `Ficará preso até ${showTime(time.getTime())}`,
		finishedRobberyAttacker: (success: boolean) => `Roubo ${success ? "bem" : "mal"}-sucedido`,
		willBeAbleAgain: "Poderá roubar novamente",
		success: "Sucesso",
		failure: "Falha",
	},
	[Language.Spanish]: {
		// CanRob
		needMoreAttack: `¡Necesitas más ${EmoteString.Attack}ATK para robar este lugar!`,
		scavenging: (placeId: ScavengeId) => `¡No puedes robar mientras estás buscando en ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Spanish]}** ${EmoteString.Scavenge}`,
		inJob: (jobTime: Date, jobId: JobId) => `¡No puedes robar mientras trabajas! ${EmoteString.Jobs}\n-# ¡Terminará tu trabajo de **${JobList[jobId].Description[Language.Spanish]}** ${showTime(jobTime.getTime(), true)}!`,
		inPrison: (prisonTime: Date) => `¡No puedes robar mientras estás en prisión! ${EmoteString.Prison}\n-# Será liberado ${showTime(prisonTime.getTime(), true)}!`,
		isWanted: (wantedTime: Date) => `¡No puedes robar mientras estás siendo buscado por la policía! ${EmoteString.Police}\n-# Podrá robar nuevamente ${showTime(wantedTime.getTime(), true)}!`,
		isInHospital: (hospitalTime: Date) => `¡No puedes robar mientras estás hospitalizado! ${EmoteString.Hospital}\n-# ¡Será curado ${showTime(hospitalTime.getTime(), true)}!`,
		isInCasino: `¡No puedes robar mientras estás en un juego de casino! ${EmoteString.Casino}`,
		// Attacker
		robberyInProgress: `Robo en progreso`,
		tryingToRob: "Intentando robar",
		youRobbed: (formattedMoney: string, placeName: string) => `¡Robaste ${formattedMoney} de **${placeName}**!`,
		youFailed: (placeName: string) => `Fallaste en tu intento de robar **${placeName}**`,
		prisonTime: (time: Date) => `Estará en prisión hasta ${showTime(time.getTime())}`,
		finishedRobberyAttacker: (success: boolean) => `Robo ${success ? "exitoso" : "fallido"}`,
		willBeAbleAgain: "Podrás robar de nuevo",
		success: "Éxito",
		failure: "Fracaso",
	},
} as const satisfies Localization;