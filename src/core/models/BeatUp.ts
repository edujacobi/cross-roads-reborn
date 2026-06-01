import { type AvailabilityReason, type User } from "./User";
import { Log } from "#shared/log";
import { Notification } from "./Notification";
import { addMinutes } from "date-fns";
import { globalStrings, Language, type Localization } from "./Language";
import { RobHistoryRepository } from "#core/repositories/RobHistoryRepository";
import { UserRepository } from "#core/repositories/UserRepository";
import { ClassId, ClassList } from "#core/types/Classes";
import { type JobId, JobList } from "#core/types/Jobs";
import { type LocationId, LocationList } from "#core/types/Locations";
import { type ScavengeId, ScavengeList } from "#core/types/Scavenge";
import { ItemId } from "#core/types/Ids";
import { ItemList } from "#core/types/Items";
import { EmoteString } from "#bot/utils/emotes";
import { showTime } from "#bot/utils/ui";

export interface BeatUpInitData {
	cannotRun: boolean;
	usedGunSkin: string;
	usedGunName: string;
	timeInHospitalBase: number;
	timeInHospitalAditional: number;
}

export interface BeatUpOutcomeData {
	success: boolean;
	attackerHospitalTime?: Date;
	defenderHospitalTime?: Date;
	attackerBeatUpTime?: Date;
}

export class BeatUp {
	Id = 0;
	Attacker: User;
	Defender: User;
	TimeInHospital = {
		Base: 0,
		Aditional: 0,
	};
	Date: Date;
	Success = false;
	UsedConsumables: ItemId[] = [];

	constructor(attacker: User, defender: User) {
		this.Attacker = attacker;
		this.Defender = defender;
		this.Date = new Date();
		this.Attacker.GetAttributes(true);
		this.Defender.GetAttributes(true);
	}

	async CanBeatUser() {
		const s = Strings[this.Attacker.Language];
		let canBeat = true;
		let message = "";

		if (this.Defender.Id === this.Attacker.Id) {
			message = s.sameId;
			canBeat = false;
		}

		if (this.Defender.GangId && this.Attacker.GangId && this.Defender.GangId === this.Attacker.GangId) {
			message = s.sameGang;
			canBeat = false;
		}

		if (!this.Defender.Nickname) {
			message = s.withoutNick;
			canBeat = false;
		}

		if (this.Defender.Class === ClassId.None) {
			message = s.withoutClass;
			canBeat = false;
		}

		if (!this.Attacker.BestGun) {
			message = s.withoutItem;
			canBeat = false;
		}

		if (this.Defender.Attributes.Attack - this.Attacker.Attributes.Attack > 15) {
			message = s.lowAtk(this.Defender.GetNameWithImage());
			canBeat = false;
		}

		if (this.Attacker.BeatUp.Time > new Date()) {
			message = s.isWaitingBeat(this.Attacker.BeatUp.Time);
			canBeat = false;
		}

		if (canBeat) {
			const bothInPrison = this.Attacker.IsInPrison() && this.Defender.IsInPrison();
			const attackerIgnore: AvailabilityReason[] = bothInPrison ? ["prison"] : [];
			const attackerCheck = this.Attacker.CheckAvailability(attackerIgnore);
			if (!attackerCheck.available) {
				canBeat = false;
				switch (attackerCheck.reason) {
				case "scavenging":
					message = s.scavengingA(attackerCheck.referenceId as ScavengeId);
					break;
				case "working":
					message = s.inJobA(attackerCheck.time!, attackerCheck.referenceId as JobId);
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
				case "escaping":
					message = s.isEscapingA;
					break;
				case "casino":
					message = s.casinoAttacker;
					break;
				case "defendingInvestment":
					message = globalStrings[this.Attacker.Language].attackerIsDefendingInvestment;
					break;
				case "gangAction":
					message = globalStrings[this.Attacker.Language].attackerIsParticipatingInGangAction;
					break;
				case "beating": {
					const user = await UserRepository.FindById(attackerCheck.targetId!, ["class", "nickname"]);
					message = globalStrings[this.Attacker.Language].attackerIsBeatingId(`${ClassList[user!.class].Image.Emote.String} ${user!.nickname!}`);
					break;
				}
				case "beingBeatUp": {
					const user = await UserRepository.FindById(attackerCheck.targetId!, ["class", "nickname"]);
					message = globalStrings[this.Attacker.Language].attackerIsBeingBeatedById(`${ClassList[user!.class!].Image.Emote.String} ${user!.nickname!}`);
					break;
				}
				case "robbing": {
					const user = await UserRepository.FindById(attackerCheck.targetId!, ["class", "nickname"]);
					message = globalStrings[this.Attacker.Language].attackerIsRobbingId(`${ClassList[user!.class].Image.Emote.String} ${user!.nickname!}`);
					break;
				}
				case "beingRobbed": {
					const user = await UserRepository.FindById(attackerCheck.targetId!, ["class", "nickname"]);
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
		}

		if (canBeat) {
			const bothInPrison = this.Attacker.IsInPrison() && this.Defender.IsInPrison();
			const defenderIgnore: AvailabilityReason[] = bothInPrison ? ["prison", "wanted"] : ["wanted"];
			const defenderCheck = this.Defender.CheckAvailability(defenderIgnore);
			if (!defenderCheck.available) {
				canBeat = false;
				const defName = this.Defender.GetNameWithImage();
				switch (defenderCheck.reason) {
				case "scavenging":
					message = `**${defName}** ${s.scavengingD(defenderCheck.referenceId as ScavengeId)}`;
					break;
				case "working":
					message = `**${defName}** ${s.inJobD(defenderCheck.time!, defenderCheck.referenceId as JobId)}`;
					break;
				case "prison":
					message = `**${defName}** ${s.inPrisonDefender(defenderCheck.time!)}`;
					break;
				case "hospital":
					message = s.isInHospitalDefender(defName, defenderCheck.time!);
					break;
				case "escaping":
					message = `**${defName}** ${s.isEscapingD}`;
					break;
				case "casino":
					message = `${defName} ${s.casinoDefender}`;
					break;
				case "defendingInvestment":
					message = globalStrings[this.Attacker.Language].defenderIsDefendingInvestment(defName);
					break;
				case "gangAction":
					message = globalStrings[this.Attacker.Language].defenderIsParticipatingInGangAction(defName);
					break;
				case "beating": {
					const user = await UserRepository.FindById(defenderCheck.targetId!, ["class", "nickname"]);
					message = `**${defName}** ${globalStrings[this.Attacker.Language].defenderIsBeatingId(`${ClassList[user!.class!].Image.Emote.String} ${user!.nickname!}`)}`;
					break;
				}
				case "beingBeatUp": {
					const user = await UserRepository.FindById(defenderCheck.targetId!, ["class", "nickname"]);
					message = `**${defName}** ${globalStrings[this.Attacker.Language].defenderIsBeingBeatedById(`${ClassList[user!.class!].Image.Emote.String} ${user!.nickname!}`)}`;
					break;
				}
				case "robbing": {
					const user = await UserRepository.FindById(defenderCheck.targetId!, ["class", "nickname"]);
					message = `**${defName}** ${globalStrings[this.Attacker.Language].defenderIsRobbingId(`${ClassList[user!.class!].Image.Emote.String} ${user!.nickname!}`)}`;
					break;
				}
				case "beingRobbed": {
					const user = await UserRepository.FindById(defenderCheck.targetId!, ["class", "nickname"]);
					message = `**${defName}** ${globalStrings[this.Attacker.Language].defenderIsBeingRobbedById(`${ClassList[user!.class!].Image.Emote.String} ${user!.nickname!}`)}`;
					break;
				}
				case "robbingLocation": {
					const location = LocationList[defenderCheck.referenceId as LocationId];
					message = `**${defName}** ${globalStrings[this.Attacker.Language].defenderIsRobbingId(location.Name[this.Attacker.Language])}`;
					break;
				}
				}
			}
		}

		return { canBeat, message };
	}

	async LockStates(useGrenade: boolean): Promise<BeatUpInitData> {
		if (useGrenade) {
			const consumed = await this.Attacker.ConsumeItem(ItemId.Grenade);
			if (consumed) {
				this.UsedConsumables.push(ItemId.Grenade);
				await this.Attacker.GetAttributes(true, this.UsedConsumables);
			}
		}

		this.TimeInHospital = {
			Base: 45 + this.Defender.Attributes.Attack,
			Aditional: 5 + this.Defender.Attributes.Attack,
		};

		if (this.Defender.Attributes.Defense <= 0) {
			this.Attacker.Attributes.Attack *= 1.35;
		}

		this.Attacker.BeatUp.IsBeatingId = this.Defender.Id;
		this.Defender.BeatUp.IsBeingBeatUpById = this.Attacker.Id;

		await Promise.all([
			this.Attacker.Update({
				beatingUserId: this.Attacker.BeatUp.IsBeatingId,
			}),
			this.Defender.Update({
				beingBeatUpByUserId: this.Defender.BeatUp.IsBeingBeatUpById,
			}),
		]);

		Log.Info(`User ${this.Attacker.Nickname} (Id: ${this.Attacker.Id}) locked states for beating up user ${this.Defender.Nickname} (Id: ${this.Defender.Id}).`);

		const cannotRun = this.Defender.Attributes.Attack < 5;
		const usedGunSkin = this.Attacker.GetItemSkin(this.Attacker.BestGun!);
		const usedGunName = this.Attacker.BestGun?.Description[this.Defender.Language] || "";

		return {
			cannotRun,
			usedGunSkin,
			usedGunName,
			timeInHospitalBase: this.TimeInHospital.Base,
			timeInHospitalAditional: this.TimeInHospital.Aditional,
		};
	}

	async Resolve(defenderReaction: "fight" | "run" | "nothing"): Promise<BeatUpOutcomeData> {
		try {
			await Promise.all([
				this.Attacker.GetInfo(),
				this.Defender.GetInfo(),
			]);

			await this.Attacker.GetAttributes(true, this.UsedConsumables);

			if (defenderReaction === "fight") {
				this.Defender.Attributes.Attack += 5;
				this.TimeInHospital.Base += this.TimeInHospital.Aditional;
			}
			else if (defenderReaction === "run") {
				this.Defender.Attributes.Attack -= 5;
				this.TimeInHospital.Base -= this.TimeInHospital.Aditional;
			}

			const attackerChance = Math.random() * this.Attacker.Attributes.Attack;
			const defenderChance = Math.random() * this.Defender.Attributes.Attack;

			this.Success = attackerChance > defenderChance;

			if (this.Success) {
				this.Attacker.BeatUp.SuccessCount += 1;
				this.Defender.BeatUp.BeatedUpCount += 1;

				this.Attacker.BeatUp.Time = addMinutes(new Date(), 60);
				this.Attacker.Wanted.Time = addMinutes(new Date(), 60);
				this.Attacker.Wanted.Count += 1;

				this.Defender.Hospital.Time = addMinutes(new Date(), this.TimeInHospital.Base);
				this.Defender.Hospital.Count += 1;

				await Promise.all([
					Notification.Hospital(this.Defender),
					Notification.BeatAgain(this.Attacker),
				]);

				Log.Success(`User ${this.Attacker.Nickname} (Id: ${this.Attacker.Id}) successfully beated user ${this.Defender.Nickname} (Id: ${this.Defender.Id})`);

				return {
					success: true,
					attackerBeatUpTime: this.Attacker.BeatUp.Time,
					defenderHospitalTime: this.Defender.Hospital.Time,
				};
			}
			else {
				this.Attacker.BeatUp.BeatedUpCount += 1;
				this.Attacker.BeatUp.FailureCount += 1;
				this.Defender.BeatUp.SuccessCount += 1;

				this.Attacker.Hospital.Count += 1;
				this.Attacker.Hospital.Time = addMinutes(new Date(), this.TimeInHospital.Base);
				this.Attacker.BeatUp.Time = addMinutes(new Date(), 60);

				await Promise.all([
					Notification.Hospital(this.Attacker),
					Notification.BeatAgain(this.Attacker),
				]);

				Log.Success(`User ${this.Attacker.Nickname} (Id: ${this.Attacker.Id}) failed to beat user ${this.Defender.Nickname} (Id: ${this.Defender.Id}).`);

				return {
					success: false,
					attackerHospitalTime: this.Attacker.Hospital.Time,
					attackerBeatUpTime: this.Attacker.BeatUp.Time,
				};
			}
		}
		finally {
			await Promise.all([
				this.Attacker.Update({
					beatUpBeatedUpCount: this.Attacker.BeatUp.BeatedUpCount,
					beatUpFailureCount: this.Attacker.BeatUp.FailureCount,
					beatUpSuccessCount: this.Attacker.BeatUp.SuccessCount,
					hospitalCount: this.Attacker.Hospital.Count,
					hospitalTime: this.Attacker.Hospital.Time,
					beatUpTime: this.Attacker.BeatUp.Time,
					wantedCount: this.Attacker.Wanted.Count,
					wantedTime: this.Attacker.Wanted.Time,
				}),
				this.Defender.Update({
					beatUpBeatedUpCount: this.Defender.BeatUp.BeatedUpCount,
					beatUpFailureCount: this.Defender.BeatUp.FailureCount,
					beatUpSuccessCount: this.Defender.BeatUp.SuccessCount,
					hospitalCount: this.Defender.Hospital.Count,
					hospitalTime: this.Defender.Hospital.Time,
					beatUpTime: this.Defender.BeatUp.Time,
				}),
			]);

			await RobHistoryRepository.CreateUserBeatUpHistory(this);
		}
	}

	async ReleaseLocks(): Promise<void> {
		this.Attacker.BeatUp.IsBeatingId = null;
		this.Defender.BeatUp.IsBeingBeatUpById = null;

		await Promise.all([
			this.Attacker.Update({
				beatingUserId: null,
			}),
			this.Defender.Update({
				beingBeatUpByUserId: null,
			}),
		]);
	}
}

export const Strings = {
	[Language.English]: {
		sameId: `You can't beat yourself up, idiot! ${EmoteString.Beat}`,
		sameGang: `You can't beat up a member of your own gang! ${EmoteString.Beat}`,
		withoutNick: `This user hasn't set a nickname yet! ${EmoteString.Beat}`,
		withoutClass: `This user hasn't chosen a class yet! ${EmoteString.Beat}`,
		withoutItem: `You can't beat someone up without a weapon! ${EmoteString.Beat}`,
		lowAtk: (nick: string) => `You can't beat up ${nick} using your current weapons! ${EmoteString.Beat}\n-# Get a better weapon. You need at least 15 difference`,
		scavengingA: (placeId: ScavengeId) => `You can't beat someone up while scavenging ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.English]}** ${EmoteString.Scavenge}`,
		scavengingD: (placeId: ScavengeId) => `is scavenging ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.English]}**. Wait a few more seconds to start your action! ${EmoteString.Scavenge}`,
		inJobA: (jobTime: Date, jobId: JobId) => `You can't beat someone up while working! ${EmoteString.Jobs}\n-# Will finish your **${JobList[jobId].Description[Language.English]}** job ${showTime(jobTime.getTime(), true)}!`,
		inJobD: (jobTime: Date, jobId: JobId) => `is working. You won't be able to beat him! ${EmoteString.Jobs}\n-# Will finish his **${JobList[jobId].Description[Language.English]}** job ${showTime(jobTime.getTime(), true)}!`,
		inPrison: (prisonTime: Date) => `You can't beat someone up while you're in prison! ${EmoteString.Prison}\n-# Will be released ${showTime(prisonTime.getTime(), true)}!`,
		inPrisonDefender: (prisonTime: Date) => `is in prison and will be released ${showTime(prisonTime.getTime(), true)} ${EmoteString.Prison}\n-# You will be able to beat them up if you're in prison too.`,
		isWanted: (wantedTime: Date) => `You can't beat someone up while you're wanted by the police! ${EmoteString.Police}\n-# Will be able to beat someone up again ${showTime(wantedTime.getTime(), true)}!`,
		isInHospital: (hospitalTime: Date) => `You can't beat someone up while you're hospitalized! ${EmoteString.Hospital}\n-# Will be healed ${showTime(hospitalTime.getTime(), true)}!`,
		isInHospitalDefender: (nickname: string, hospitalTime: Date) => `You can't beat someone who is hospitalized! ${EmoteString.Hospital}\n-# **${nickname}** will be healed ${showTime(hospitalTime.getTime(), true)}!`,
		isWaitingBeat: (beatTime: Date) => `You can beat again ${showTime(beatTime.getTime(), true)} ${EmoteString.Beat}`,
		isEscapingA: `You are trying to escape and cannot beat up! ${EmoteString.Escape}\n-# Focus!`,
		isEscapingD: `is trying to escape prison and cannot be beaten! ${EmoteString.Escape}`,
		casinoAttacker: `You can't beat someone up while you're in a casino game! ${EmoteString.Casino}`,
		casinoDefender: `is in a casino game and cannot be beaten! ${EmoteString.Casino}`,
		// Defender
		hands: "I'll break your face!",
		tryingToBeatYou: "is trying to beat you up using",
		andAGrenade: `and a ${EmoteString.Granade} **Grenade**`,
		decide: "Decide what to do",
		fight: "Fight",
		fightDescription: (time: number) => `${EmoteString.Attack}+5 ATK, but whoever gets beaten will stay ${time} more minutes in the hospital`,
		fighting: "Fighting",
		run: "Run",
		runDescription: (time: number) => `${EmoteString.Attack}-5 ATK, but whoever gets beaten will stay ${time} fewer minutes in the hospital`,
		running: "Running",
		doNothing: "Do nothing",
		doNothingDescription: "No additional effect",
		doingNothing: "Doing nothing",
		secondsToRespond: "You have 45 seconds to respond",
		wereBeated: (attackerNick: string, time: Date) => `You were beaten up by **${attackerNick}** and will stay in the hospital! ${EmoteString.Hospital}\n-# Will be healed ${showTime(time.getTime(), true)}!`,
		finishedBeatUpDefender: "Beating finished",
		// Attacker
		beatingInProgress: `Beating in progress`,
		tryingToBeatUp: "Trying to beat up",
		isFighting: "wants to fight",
		isRunning: "wants to run",
		isDoingNothing: "is doing nothing",
		youBeated: (defenderNick: string, time: Date) => {
			const words = [
				"beat up",
				"thrashed",
				"punched hard",
				"kicked the balls of",
				"slaughtered",
				"destroyed",
				"showed who's boss to",
				"battered",
				"tightened",
				"hammered",
				"beat to a pulp",
			];

			const word = words[Math.round(Math.random() * (words.length - 1))];

			return `You ${word} **${defenderNick}**!\n-# They will stay in the hospital until ${showTime(time.getTime())}`;
		},
		success: "Success",
		failure: "Failure",
		willBeAbleAgain: "Will be able to beat up again",
		youFailed: (time: Date) => `You tried, but you were the one beaten up!\n-# Will stay in the hospital until ${showTime(time.getTime())} ${EmoteString.Hospital}`,
		finishedBeatUpAttacker: (success: boolean) => `Beating ${success ? "successful" : "unsuccessful"}`,
		preparingToBeat: (nick: string) => `Preparing to beat **${nick}**`,
		useGrenadeDescription: (quantity: number) => `You have ${quantity} ${quantity === 1 ? "grenade" : "grenades"}`,
		useGrenade: "Use Grenade",
		useGrenadeEffect: `${EmoteString.Attack}+${ItemList[ItemId.Grenade].MoreAttack} ATK`,
		dontUseGrenade: "Don't use",
		dontUseGrenadeDescription: "Save it for later",
	},
	[Language.Portuguese]: {
		// CanBeat
		sameId: `Você não pode espancar a si mesmo, idiota! ${EmoteString.Beat}`,
		sameGang: `Você não pode espancar um membro da sua própria gangue! ${EmoteString.Beat}`,
		withoutNick: `Este usuário ainda não cadastrou um nickname! ${EmoteString.Beat}`,
		withoutClass: `Este usuário ainda não escolheu uma classe! ${EmoteString.Beat}`,
		withoutItem: `Você não pode espancar sem uma arma! ${EmoteString.Beat}`,
		lowAtk: (nick: string) => `Você não pode espancar ${nick} usando suas armas atuais! ${EmoteString.Beat}\n-# Consiga uma arma melhor. Você precisa de pelo menos 15 de diferença`,
		scavengingA: (placeId: ScavengeId) => `Você não pode espancar enquanto está vasculhando ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Portuguese]}** ${EmoteString.Scavenge}`,
		scavengingD: (placeId: ScavengeId) => `está vasculhando ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Portuguese]}**. Espere mais alguns segundos para iniciar sua ação! ${EmoteString.Scavenge}`,
		inJobA: (jobTime: Date, jobId: JobId) => `Você não pode espancar enquanto está trabalhando! ${EmoteString.Jobs}\n-# Terminará seu trabalho de **${JobList[jobId].Description[Language.Portuguese]}** ${showTime(jobTime.getTime(), true)}!`,
		inJobD: (jobTime: Date, jobId: JobId) => `está trabalhando. Você não conseguirá espancá-lo! ${EmoteString.Jobs}\n-# Terminará o trabalho de **${JobList[jobId].Description[Language.Portuguese]}** ${showTime(jobTime.getTime(), true)}!`,
		inPrison: (prisonTime: Date) => `Você não pode espancar enquanto está preso! ${EmoteString.Prison}\n-# Será solto ${showTime(prisonTime.getTime(), true)}!`,
		inPrisonDefender: (prisonTime: Date) => `está preso e será solto ${showTime(prisonTime.getTime(), true)} ${EmoteString.Prison}\n-# Você conseguirá espancá-lo se estiver preso também.`,
		isWanted: (wantedTime: Date) => `Você não pode espancar enquanto está sendo procurado pela polícia! ${EmoteString.Police}\n-# Poderá espancar novamente ${showTime(wantedTime.getTime(), true)}!`,
		isInHospital: (hospitalTime: Date) => `Você não pode espancar enquanto está hospitalizado! ${EmoteString.Hospital}\n-# Será curado ${showTime(hospitalTime.getTime(), true)}!`,
		isInHospitalDefender: (nickname: string, hospitalTime: Date) => `Você não pode espancar alguém hospitalizado! ${EmoteString.Hospital}\n-# **${nickname}** será curado ${showTime(hospitalTime.getTime(), true)}!`,
		isWaitingBeat: (beatTime: Date) => `Você poderá espancar novamente ${showTime(beatTime.getTime(), true)} ${EmoteString.Beat}`,
		isEscapingA: `Você está tentando escapar da prisão e não pode espancar! ${EmoteString.Escape}\n-# "Foco!"`,
		isEscapingD: `está tentando escapar da prisão e não pode ser espancado! ${EmoteString.Escape}`,
		casinoAttacker: `Você não pode espancar enquanto está em um jogo de cassino! ${EmoteString.Casino}`,
		casinoDefender: `está em um jogo de cassino e não pode ser espancado! ${EmoteString.Casino}`,
		// Defender
		hands: "Vou quebrar a tua cara!",
		tryingToBeatYou: "está tentando espancar você utilizando",
		andAGrenade: `e uma ${EmoteString.Granade} **Granada**`,
		decide: "Decida o que fazer",
		fight: "Lutar",
		fightDescription: (time: number) => `${EmoteString.Attack}+5 ATK, mas quem apanhar ficará mais ${time} minutos hospitalizado`,
		fighting: "Lutando",
		run: "Correr",
		runDescription: (time: number) => `${EmoteString.Attack}-5 ATK, mas quem apanhar ficará menos ${time} minutos hospitalizado`,
		running: "Correndo",
		doNothing: "Não fazer nada",
		doNothingDescription: "Nenhum efeito adicional",
		doingNothing: "Fazendo nada",
		secondsToRespond: "Você tem 45 segundos para responder",
		wereBeated: (attackerNick: string, time: Date) => `Você foi espancado por **${attackerNick}** e ficará hospitalizado! ${EmoteString.Hospital}\n-# Será curado ${showTime(time.getTime(), true)}!`,
		finishedBeatUpDefender: "Espancamento finalizado",
		// Attacker
		beatingInProgress: `Espancamento em andamento`,
		tryingToBeatUp: "Tentando espancar",
		isFighting: "quer brigar",
		isRunning: "quer correr",
		isDoingNothing: "não está fazendo nada",
		youBeated: (defenderNick: string, time: Date) => {
			const words = [
				"espancou",
				"surrou",
				"socou com muita força",
				"chutou as bolas de",
				"trucidou",
				"acabou com a raça de",
				"mostrou quem é que manda para",
				"escadeirou",
				"arrochou",
				"marretou",
				"moeu a pau",
			];

			const word = words[Math.round(Math.random() * (words.length - 1))];

			return `Você ${word} **${defenderNick}**!\n-# Ele ficará hospitalizado até ${showTime(time.getTime())}`;
		},
		success: "Sucesso",
		failure: "Falha",
		willBeAbleAgain: "Poderá espancar novamente",
		youFailed: (time: Date) => `Você até tentou, mas o espancado foi você!\n-# Ficará hospitalizado até ${showTime(time.getTime())} ${EmoteString.Hospital}`,
		finishedBeatUpAttacker: (success: boolean) => `Espancamento ${success ? "bem" : "mal"}-sucedido`,
		preparingToBeat: (nick: string) => `Preparando-se para espancar **${nick}**`,
		useGrenadeDescription: (quantity: number) => `Você tem ${quantity} ${quantity === 1 ? "granada" : "granadas"}`,
		useGrenade: "Usar Granada",
		useGrenadeEffect: `${EmoteString.Attack}+${ItemList[ItemId.Grenade].MoreAttack} ATK`,
		dontUseGrenade: "Não usar",
		dontUseGrenadeDescription: "Guardar para depois",
	},
	[Language.Spanish]: {
		// CanBeat
		sameId: `¡No puedes golpearte a ti mismo, idiota! ${EmoteString.Beat}`,
		sameGang: `¡No puedes golpear a un miembro de tu propia cuadrilla! ${EmoteString.Beat}`,
		withoutNick: `¡Este usuario no ha configurado un apodo todavía! ${EmoteString.Beat}`,
		withoutClass: `¡Este usuario no ha elegido una clase todavía! ${EmoteString.Beat}`,
		withoutItem: `¡No puedes golpear a alguien sin un arma! ${EmoteString.Beat}`,
		lowAtk: (nick: string) => `¡No puedes golpear a ${nick} usando tus armas actuales! ${EmoteString.Beat}\n-# Consigue un arma mejor. ¡Necesitas al menos 15 de diferencia!`,
		scavengingA: (placeId: ScavengeId) => `¡No puedes golpear a alguien mientras buscas en ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Spanish]}** ${EmoteString.Scavenge}`,
		scavengingD: (placeId: ScavengeId) => `está buscando en ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Spanish]}**. ¡Espera unos segundos más para iniciar tu acción! ${EmoteString.Scavenge}`,
		inJobA: (jobTime: Date, jobId: JobId) => `¡No puedes golpear a alguien mientras trabajas! ${EmoteString.Jobs}\n-# Terminarás tu trabajo de **${JobList[jobId].Description[Language.Spanish]}** ${showTime(jobTime.getTime(), true)}!`,
		inJobD: (jobTime: Date, jobId: JobId) => `está trabajando. ¡No podrás golpearlo! ${EmoteString.Jobs}\n-# Terminará el trabajo de **${JobList[jobId].Description[Language.Spanish]}** ${showTime(jobTime.getTime(), true)}!`,
		inPrison: (prisonTime: Date) => `¡No puedes golpear a alguien mientras estás en prisión! ${EmoteString.Prison}\n-# Serás liberado ${showTime(prisonTime.getTime(), true)}!`,
		inPrisonDefender: (prisonTime: Date) => `está en prisión y será liberado ${showTime(prisonTime.getTime(), true)} ${EmoteString.Prison}\n-# Podrás golpearlo si tú también estás en prisión.`,
		isWanted: (wantedTime: Date) => `¡No puedes golpear a alguien mientras eres buscado por la policía! ${EmoteString.Police}\n-# Podrás golpear a alguien de nuevo ${showTime(wantedTime.getTime(), true)}!`,
		isInHospital: (hospitalTime: Date) => `¡No puedes golpear a alguien mientras estás hospitalizado! ${EmoteString.Hospital}\n-# Serás curado ${showTime(hospitalTime.getTime(), true)}!`,
		isInHospitalDefender: (nickname: string, hospitalTime: Date) => `¡No puedes golpear a alguien que está hospitalizado! ${EmoteString.Hospital}\n-# **${nickname}** será curado ${showTime(hospitalTime.getTime(), true)}!`,
		isWaitingBeat: (beatTime: Date) => `Puedes golpear de nuevo ${showTime(beatTime.getTime(), true)} ${EmoteString.Beat}`,
		isEscapingA: `¡Estás intentando escapar de la prisión y no puedes golpear! ${EmoteString.Escape}\n-# "¡Enfócate!"`,
		isEscapingD: `está intentando escapar de la prisión y no puede ser golpeado. ${EmoteString.Escape}`,
		casinoAttacker: `¡No puedes golpear mientras estás en un juego de casino! ${EmoteString.Casino}`,
		casinoDefender: `está en un juego de casino y no puede ser golpeado! ${EmoteString.Casino}`,
		// Defender
		hands: "¡Te voy a romper la cara!",
		tryingToBeatYou: "está intentando golpearte usando",
		andAGrenade: `y una ${EmoteString.Granade} **Granada**`,
		decide: "Decide qué hacer",
		fight: "Luchar",
		fightDescription: (time: number) => `${EmoteString.Attack}+5 ATK, pero quien sea golpeado permanecerá ${time} minutos más en el hospital`,
		fighting: "Luchando",
		run: "Correr",
		runDescription: (time: number) => `${EmoteString.Attack}-5 ATK, pero quien sea golpeado permanecerá ${time} minutos menos en el hospital`,
		running: "Corriendo",
		doNothing: "No hacer nada",
		doNothingDescription: "Sin efecto adicional",
		doingNothing: "No haciendo nada",
		secondsToRespond: "Tienes 45 segundos para responder",
		wereBeated: (attackerNick: string, time: Date) => `¡Fuiste golpeado por **${attackerNick}** y permanecerás en el hospital! ${EmoteString.Hospital}\n-# Serás curado ${showTime(time.getTime(), true)}!`,
		finishedBeatUpDefender: "Golpiza terminada",
		// Attacker
		beatingInProgress: `Golpiza en progreso`,
		tryingToBeatUp: "Intentando golpear a",
		isFighting: "quiere luchar",
		isRunning: "quiere correr",
		isDoingNothing: "no está haciendo nada",
		youBeated: (defenderNick: string, time: Date) => {
			const words = [
				"Golpeaste a",
				"Golpeó",
				"Apaleó",
				"Golpeó con fuerza",
				"Pateó las bolas de",
				"Masacró",
				"Acabó con la raza de",
				"Mostró quién manda a",
				"Apretó",
				"Martilló",
				"Molió a golpes",
			];

			const word = words[Math.round(Math.random() * (words.length - 1))];

			return `¡${word} **${defenderNick}**!\n-# Permanecerá en el hospital hasta ${showTime(time.getTime())}`;
		},
		success: "Éxito",
		failure: "Fracaso",
		willBeAbleAgain: "Podrás golpear de nuevo",
		youFailed: (time: Date) => `¡Lo intentaste, pero tú fuiste el golpeado!\n-# Permanecerás en el hospital hasta ${showTime(time.getTime())} ${EmoteString.Hospital}`,
		finishedBeatUpAttacker: (success: boolean) => `Golpiza ${success ? "exitosa" : "fallida"}`,
		preparingToBeat: (nick: string) => `Preparándose para golpear a **${nick}**`,
		useGrenadeDescription: (quantity: number) => `Tienes ${quantity} ${quantity === 1 ? "granada" : "granadas"}`,
		useGrenade: "Usar Granada",
		useGrenadeEffect: `${EmoteString.Attack}+${ItemList[ItemId.Grenade].MoreAttack} ATK`,
		dontUseGrenade: "No usar",
		dontUseGrenadeDescription: "Guardar para después",
	},
} as const satisfies Localization;