import { EmoteString } from "#bot/utils/emotes";
import { formatMoney } from "#bot/utils/ui";
import { RobHistoryRepository } from "#core/repositories/RobHistoryRepository";
import { UserRepository } from "#core/repositories/UserRepository";
import { Event, EventType } from "#core/models/Event";
import { globalStrings, Language, type Localization } from "#core/models/Language";
import { Notification } from "#core/models/Notification";
import { type User } from "#core/models/User";
import { ClassId, ClassList, getRobberyClassModifier } from "#core/types/Classes";
import { ItemId } from "#core/types/Ids";
import { ItemList } from "#core/types/Items";
import { type JobId, JobList } from "#core/types/Jobs";
import { type LocationId, LocationList } from "#core/types/Locations";
import { ClashType, type RobberyInitData, type RobberyOutcomeData } from "#core/types/Robbery";
import { type ScavengeId, ScavengeList } from "#core/types/Scavenge";
import { Log } from "#shared/log";
import { getPercent } from "#shared/utils";
import { addMinutes } from "date-fns";
import { type IRobberyStrategy } from "./IRobberyStrategy";
import { time, TimestampStyles } from "discord.js";
import { Prison } from "#core/models/Prison";

export class UserRobberyStrategy implements IRobberyStrategy {
	Attacker: User;
	Defender: User;
	Date: Date;
	Type = ClashType.User;
	Success = false;
	MoneyRobbed = 0;
	Chance = 0;

	AttackerTimeInPrison = 0;
	AttackerAditionalTimeCallPolice = 0;
	DefenderTimeInHospital = 0;
	BeatUpChance = 0.25;
	UsedConsumables: ItemId[] = [];

	constructor(attacker: User, defender: User) {
		this.Attacker = attacker;
		this.Defender = defender;
		this.Date = new Date();
	}

	async CanRob(): Promise<{ canRob: boolean; message: string }> {
		const s = Strings[this.Attacker.Language];
		let canRob = true;
		let message = "";

		if (this.Defender.Id === this.Attacker.Id) {
			message = `${s.sameId} ${EmoteString.Robbery}`;
			canRob = false;
		}

		if (this.Defender.GangId && this.Attacker.GangId && this.Defender.GangId === this.Attacker.GangId) {
			message = `${s.sameGang} ${EmoteString.Robbery}`;
			canRob = false;
		}

		if (!this.Defender.Nickname) {
			message = `${s.withoutNick} ${EmoteString.Robbery}`;
			canRob = false;
		}

		if (this.Defender.Class === ClassId.None) {
			message = `${s.withoutClass} ${EmoteString.Robbery}`;
			canRob = false;
		}

		if (!this.Attacker.BestGun) {
			message = `${s.withoutItem} ${EmoteString.Robbery}`;
			canRob = false;
		}

		if (this.Defender.Attributes.Attack - this.Attacker.Attributes.Attack > 15) {
			message = s.lowAtk(this.Defender.GetNameWithImage());
			canRob = false;
		}

		const attackerCheck = this.Attacker.CheckAvailability();
		if (!attackerCheck.available) {
			canRob = false;
			switch (attackerCheck.reason) {
			case "scavenging":
				message = s.scavengingA(attackerCheck.referenceId as ScavengeId);
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

		if (canRob) {
			const defenderCheck = this.Defender.CheckAvailability(["prison", "hospital", "wanted", "escaping", "working"]);
			if (!defenderCheck.available) {
				canRob = false;
				const defName = this.Defender.GetNameWithImage();
				switch (defenderCheck.reason) {
				case "scavenging":
					message = `**${defName}** ${s.scavengingD(defenderCheck.referenceId as ScavengeId)}`;
					break;
				case "casino":
					message = `**${defName}** ${s.casinoDefender}`;
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

		return { canRob, message };
	}

	async LockStates(useGrenade: boolean = false): Promise<RobberyInitData> {
		if (useGrenade) {
			const consumed = await this.Attacker.ConsumeItem(ItemId.Grenade);
			if (consumed) {
				this.UsedConsumables.push(ItemId.Grenade);
				await this.Attacker.GetAttributes(false, this.UsedConsumables);
			}
		}

		this.AttackerTimeInPrison = 10 + 1.5 * this.Attacker.Attributes.Attack;
		this.AttackerAditionalTimeCallPolice = Math.floor(25 + 0.5 * this.Attacker.Attributes.Attack);
		this.DefenderTimeInHospital = 25 + this.Defender.Attributes.Defense / 2;

		if (this.Defender.Attributes.Defense <= 0) {
			this.Attacker.Attributes.Attack *= 1.35;
		}

		this.Attacker.Robbery.IsRobbingId = this.Defender.Id;
		this.Defender.Robbery.IsBeingRobbedById = this.Attacker.Id;

		await Promise.all([
			this.Attacker.Update({
				robbingUserId: this.Attacker.Robbery.IsRobbingId,
			}),
			this.Defender.Update({
				beingRobbedByUserId: this.Defender.Robbery.IsBeingRobbedById,
			}),
		]);

		Log.Info(`User ${this.Attacker.Nickname} (Id: ${this.Attacker.Id}) locked states for robbing user ${this.Defender.Nickname} (Id: ${this.Defender.Id}).`);

		const cannotReact = this.Defender.IsWorking() ||
			this.Defender.IsInPrison() ||
			this.Defender.IsInHospital() ||
			this.Defender.Attributes.Attack === 0;

		const cannotCallPolice = this.Defender.IsInHospital() || this.Defender.Attributes.Defense < 5;

		const usedGunSkin = this.Attacker.GetItemSkin(this.Attacker.BestGun!);
		const usedGunName = this.Attacker.BestGun?.Description[this.Defender.Language] || "";

		return {
			attackerTimeInPrison: this.AttackerTimeInPrison,
			attackerAditionalTimeCallPolice: this.AttackerAditionalTimeCallPolice,
			defenderTimeInHospital: this.DefenderTimeInHospital,
			cannotReact,
			cannotCallPolice,
			usedGunSkin,
			usedGunName,
		};
	}

	async Resolve(defenderReaction: "react" | "police" | "nothing" = "nothing"): Promise<RobberyOutcomeData> {
		try {
			await Promise.all([
				this.Attacker.GetInfo(),
				this.Defender.GetInfo(),
			]);

			// Re-apply consumables bonuses because GetInfo resets attributes
			await this.Attacker.GetAttributes(false, this.UsedConsumables);

			if (defenderReaction === "react") {
				this.Defender.Attributes.Defense += 5;
				this.BeatUpChance = 1;
			}
			else if (defenderReaction === "police") {
				this.Defender.Attributes.Defense -= 5;
				this.AttackerTimeInPrison += this.AttackerAditionalTimeCallPolice;
			}

			this.Attacker.Attributes.Attack -= getPercent(this.Defender.Attributes.Defense, this.Attacker.Attributes.Attack);

			this.Chance = Math.random() * 100;
			this.Success = this.Chance < this.Attacker.Attributes.Attack;

			if (this.Success) {
				if (this.Defender.Attributes.Defense > 0) {
					this.Attacker.Attributes.MoneyAttack -= getPercent(this.Defender.Attributes.MoneyDefense, this.Attacker.Attributes.MoneyAttack);
				}

				this.MoneyRobbed = Math.floor(getPercent(this.Attacker.Attributes.MoneyAttack, this.Defender.Money));

				const userClassModifier = getRobberyClassModifier(this.Attacker.Class);

				this.MoneyRobbed = Math.floor(this.MoneyRobbed * userClassModifier);

				this.Attacker.Money += this.MoneyRobbed;
				this.Attacker.Robbery.SuccessCount += 1;
				this.Attacker.Robbery.SuccessRobbedSum += this.MoneyRobbed;
				const wantedTimeMultiplier = await Event.GetActiveFromType(EventType.WANTED_TIME_MULTIPLIER);
				this.Attacker.Wanted.Time = addMinutes(new Date(), 60 * wantedTimeMultiplier);

				this.Defender.Money -= this.MoneyRobbed;
				this.Defender.Robbery.BeingRobbedCount += 1;
				this.Defender.Robbery.BeingRobbedSum += this.MoneyRobbed;

				const willBeBeatenUp = Math.random() < this.BeatUpChance &&
					!this.Defender.IsWorking() &&
					!this.Defender.IsInPrison() &&
					!this.Defender.IsInHospital();

				if (willBeBeatenUp) {
					this.Defender.Hospital.Count += 1;
					const hospitalTimeMultiplier = await Event.GetActiveFromType(EventType.HOSPITAL_TIME_MULTIPLIER);
					this.Defender.Hospital.Time = addMinutes(new Date(), this.DefenderTimeInHospital * hospitalTimeMultiplier);
					this.Defender.BeatUp.BeatedUpCount += 1;
					this.Attacker.BeatUp.SuccessCount += 1;
					await Notification.Hospital(this.Defender);
				}

				await Notification.RobAgain(this.Attacker);

				Log.Success(`User ${this.Attacker.Nickname} (Id: ${this.Attacker.Id}) successfully robbed user ${this.Defender.Nickname} (Id: ${this.Defender.Id}) and got ${formatMoney(this.MoneyRobbed, Language.English)}. ${willBeBeatenUp ? "The defender was beaten up." : ""}`);

				return {
					success: true,
					moneyRobbed: this.MoneyRobbed,
					willBeBeatenUp,
					attackerWantedTime: this.Attacker.Wanted.Time,
					defenderHospitalTime: willBeBeatenUp ? this.Defender.Hospital.Time : undefined,
				};
			}
			else {
				await Prison.Arrest(this.Attacker, this.AttackerTimeInPrison);
				await Notification.Free(this.Attacker);

				Log.Success(`User ${this.Attacker.Nickname} (Id: ${this.Attacker.Id}) failed to rob user ${this.Defender.Nickname} (Id: ${this.Defender.Id}).`);

				return {
					success: false,
					moneyRobbed: 0,
					willBeBeatenUp: false,
					attackerPrisonTime: this.Attacker.Prison.Time,
				};
			}
		}
		finally {
			await Promise.all([
				this.Attacker.Update({
					money: this.Attacker.Money,
					robberySuccessCount: this.Attacker.Robbery.SuccessCount,
					robberySuccessRobbedSum: this.Attacker.Robbery.SuccessRobbedSum,
					wantedTime: this.Attacker.Wanted.Time,
					beatUpSuccessCount: this.Attacker.BeatUp.SuccessCount,
				}),
				this.Defender.Update({
					money: this.Defender.Money,
					robberyBeingRobbedCount: this.Defender.Robbery.BeingRobbedCount,
					robberyBeingRobbedSum: this.Defender.Robbery.BeingRobbedSum,
					hospitalCount: this.Defender.Hospital.Count,
					hospitalTime: this.Defender.Hospital.Time,
					beatUpBeatedUpCount: this.Defender.BeatUp.BeatedUpCount,
				}),
			]);

			await RobHistoryRepository.CreateUserRobberyHistory(this);
		}
	}

	async ReleaseLocks(): Promise<void> {
		this.Attacker.Robbery.IsRobbingId = null;
		this.Defender.Robbery.IsBeingRobbedById = null;

		await Promise.all([
			this.Attacker.Update({
				robbingUserId: null,
			}),
			this.Defender.Update({
				beingRobbedByUserId: null,
			}),
		]);
	}
}

export const Strings = {
	[Language.English]: {
		sameId: "You can't rob yourself, idiot!",
		sameGang: "You can't rob a member of your own gang!",
		withoutNick: "This user hasn't set a nickname yet!",
		withoutClass: "This user hasn't choose a class yet!",
		withoutItem: "You can't rob without a weapon!",
		lowAtk: (nick: string) => `You can't rob ${nick} with your current weapons! ${EmoteString.Robbery}\n-# Get a better weapon. You need at least 15 difference!`,
		scavengingA: (placeId: ScavengeId) => `You can't rob while scavenging ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.English]}** ${EmoteString.Scavenge}`,
		scavengingD: (placeId: ScavengeId) => `is scavenging ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.English]}**. Wait a few more seconds to start your action! ${EmoteString.Scavenge}`,
		inJob: (jobTime: Date, jobId: JobId) => `You can't rob while working! ${EmoteString.Jobs}\n-# Will finish your **${JobList[jobId].Description[Language.English]}** job ${time(jobTime, TimestampStyles.RelativeTime)}!`,
		inPrison: (prisonTime: Date) => `You can't rob while you're in prison! ${EmoteString.Prison}\n-# Will be released ${time(prisonTime, TimestampStyles.RelativeTime)}!`,
		isWanted: (wantedTime: Date) => `You can't rob while you're wanted by the police! ${EmoteString.Police}\n-# Will be able to rob again ${time(wantedTime, TimestampStyles.RelativeTime)}!`,
		isInHospital: (hospitalTime: Date) => `You can't rob while you're hospitalized! ${EmoteString.Hospital}\n-# Will be healed ${time(hospitalTime, TimestampStyles.RelativeTime)}!`,
		casinoAttacker: `You can't rob while you're in a casino game! ${EmoteString.Casino}`,
		hands: "Hands up!",
		tryingToRobYou: "is trying to rob you using",
		andAGrenade: `and a ${EmoteString.Granade} **Grenade**`,
		decide: "Decide what to do",
		react: "React",
		reactDescription: (time: number) => `${EmoteString.Defense}+5 DEF, but you will be hospitalized for ${time} minutes if you get robbed`,
		reacting: "Reacting",
		callPolice: "Call the police",
		callPoliceDescription: (time: number) => `${EmoteString.Defense}-5 DEF, but he will be inprisoned for ${time} aditional minutes if he fails`,
		callingPolice: "Calling the police",
		doNothing: "Do nothing",
		doNothingDescription: "No additional effect",
		doingNothing: "Doing nothing",
		secondsToRespond: "You have 60 seconds to respond",
		wereRobbed: (formattedMoney: string, attackerNick: string) => `You were robbed and lost ${formattedMoney} to **${attackerNick}**!`,
		beatedUp: (date: Date) => `You were beaten up and will be hospitalized until ${time(date, TimestampStyles.ShortDateTime)}`,
		robFailed: "tried to rob you, but the police caught him!",
		prisonUntil: (date: Date) => `He will be in prison until ${time(date, TimestampStyles.ShortDateTime)}`,
		finishedRobberyDefender: "Robbery finished",
		casinoDefender: `is in a casino game and cannot be robbed! ${EmoteString.Casino}`,
		robberyInProgress: `Robbery in progress`,
		tryingToRob: "Trying to rob",
		isReacting: "is reacting",
		isCallingPolice: "is calling the police",
		isDoingNothing: "is doing nothing",
		success: "Success",
		failure: "Failure",
		willBeAbleAgain: "Will be able to rob again",
		beatenUp: (date: Date) => `You beat him up and he will be hospitalized until ${time(date, TimestampStyles.ShortDateTime)}`,
		youFailed: "You failed in your attempt",
		prisonTime: (date: Date) => `Will be in prison until ${time(date, TimestampStyles.ShortDateTime)}`,
		finishedRobberyAttacker: (success: boolean) => `Robbery ${success ? "successful" : "unsuccessful"}`,
		preparingToRob: (nick: string) => `Preparing to rob **${nick}**`,
		useGrenadeDescription: (quantity: number) => `You have ${quantity} ${quantity === 1 ? "grenade" : "grenades"}`,
		useGrenade: "Use Grenade",
		useGrenadeEffect: `${EmoteString.Attack}+${ItemList[ItemId.Grenade].MoreAttack} ATK`,
		dontUseGrenade: "Don't use",
		dontUseGrenadeDescription: "Save it for later",
		failureMessages: [
			"The police arrived faster than you anticipated.",
			"Someone saw your gun, reacted, and drew everyone's attention.",
			"A bystander intervened and called the authorities.",
			"You heard sirens nearby and panicked.",
			"Security cameras caught your face, forcing you to run.",
			"You forgot to load your weapon. Rookie mistake.",
			"You had stolen so much money that you fainted with joy.",
			"You tried to look cool but just ended up looking suspicious to a nearby cop.",
			"A rabid stray dog attacked you, giving the police time to arrive.",
			"While trying to escape, you tripped and dropped all the money.",
		],
		successMessages: [
			(formattedMoney: string, defenderNick: string) => `You robbed ${formattedMoney} from **${defenderNick}**!`,
			(formattedMoney: string, defenderNick: string) => `Easy money! You took ${formattedMoney} from **${defenderNick}**.`,
			(formattedMoney: string, defenderNick: string) => `**${defenderNick}** didn't stand a chance. You got away with ${formattedMoney}!`,
			(formattedMoney: string, defenderNick: string) => `Another successful heist! You pocketed ${formattedMoney} from **${defenderNick}**.`,
			(formattedMoney: string, defenderNick: string) => `You now have ${formattedMoney} more, courtesy of **${defenderNick}**.`,
		],
	},
	[Language.Portuguese]: {
		sameId: "Você não pode roubar a si mesmo, idiota!",
		sameGang: "Você não pode roubar um membro da sua própria gangue!",
		withoutNick: "Este usuário ainda não cadastrou um nickname!",
		withoutClass: "Este usuário ainda não escolheu uma classe!",
		withoutItem: "Você não pode roubar sem uma arma!",
		lowAtk: (nick: string) => `Você não pode roubar ${nick} usando suas armas atuais! ${EmoteString.Robbery}\n-# Consiga uma arma melhor. Você precisa de no mínimo 15 de diferença!`,
		scavengingA: (placeId: ScavengeId) => `Você não pode roubar enquanto está vasculhando ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Portuguese]}** ${EmoteString.Scavenge}`,
		scavengingD: (placeId: ScavengeId) => `está vasculhando ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Portuguese]}**. Espere mais alguns segundos para iniciar sua ação! ${EmoteString.Scavenge}`,
		inJob: (jobTime: Date, jobId: JobId) => `Você não pode roubar enquanto está trabalhando! ${EmoteString.Jobs}\n-# Terminará seu trabalho de **${JobList[jobId].Description[Language.Portuguese]}** ${time(jobTime, TimestampStyles.RelativeTime)}!`,
		inPrison: (prisonTime: Date) => `Você não pode roubar enquanto está preso! ${EmoteString.Prison}\n-# Será solto ${time(prisonTime, TimestampStyles.RelativeTime)}!`,
		isWanted: (wantedTime: Date) => `Você não pode roubar enquanto está sendo procurado pela polícia! ${EmoteString.Police}\n-# Poderá roubar novamente ${time(wantedTime, TimestampStyles.RelativeTime)}!`,
		isInHospital: (hospitalTime: Date) => `Você não pode roubar enquanto está hospitalizado! ${EmoteString.Hospital}\n-# Será curado ${time(hospitalTime, TimestampStyles.RelativeTime)}!`,
		casinoAttacker: `Você não pode roubar enquanto está em um jogo de cassino! ${EmoteString.Casino}`,
		hands: "Mãos ao alto!",
		tryingToRobYou: "está tentando roubar você utilizando",
		andAGrenade: `e uma ${EmoteString.Granade} **Granada**`,
		decide: "Decida o que fazer",
		react: "Reagir",
		reactDescription: (time: number) => `${EmoteString.Defense}+5 DEF, mas você ficará hospitalizado por ${time} minutos caso seja roubado`,
		reacting: "Reagindo",
		callPolice: "Chamar a polícia",
		callPoliceDescription: (time: number) => `${EmoteString.Defense}-5 DEF, mas ele ficará preso por ${time} minutos adicionais caso falhe`,
		callingPolice: "Chamando a polícia",
		doNothing: "Não fazer nada",
		doNothingDescription: "Nenhum efeito adicional",
		doingNothing: "Fazendo nada",
		secondsToRespond: "Você tem 60 segundos para responder",
		wereRobbed: (formattedMoney: string, attackerNick: string) => `Você foi roubado e perdeu ${formattedMoney} para **${attackerNick}**!`,
		beatedUp: (date: Date) => `Você tomou uma coça e ficará hospitalizado até ${time(date, TimestampStyles.ShortDateTime)}`,
		robFailed: "tentou lhe roubar, mas a polícia o capturou!",
		prisonUntil: (date: Date) => `Ele ficará preso até ${time(date, TimestampStyles.ShortDateTime)}`,
		finishedRobberyDefender: "Roubo finalizado",
		casinoDefender: `está em um jogo de cassino e não pode ser roubado! ${EmoteString.Casino}`,
		robberyInProgress: `Roubo em andamento`,
		tryingToRob: "Tentando roubar",
		isReacting: "está reagindo",
		isCallingPolice: "está chamando a polícia",
		isDoingNothing: "não está fazendo nada",
		success: "Sucesso",
		failure: "Falha",
		willBeAbleAgain: "Poderá roubar novamente",
		beatenUp: (date: Date) => `Você detonou e ele ficará hospitalizado até ${time(date, TimestampStyles.ShortDateTime)}`,
		youFailed: "Você falhou na sua tentativa",
		prisonTime: (date: Date) => `Ficará preso até ${time(date, TimestampStyles.ShortDateTime)}`,
		finishedRobberyAttacker: (success: boolean) => `Roubo ${success ? "bem" : "mal"}-sucedido`,
		preparingToRob: (nick: string) => `Preparando-se para roubar **${nick}**`,
		useGrenadeDescription: (quantity: number) => `Você tem ${quantity} ${quantity === 1 ? "granada" : "granadas"}`,
		useGrenade: "Usar Granada",
		useGrenadeEffect: `${EmoteString.Attack}+${ItemList[ItemId.Grenade].MoreAttack} ATK`,
		dontUseGrenade: "Não usar",
		dontUseGrenadeDescription: "Guardar para depois",
		failureMessages: [
			"A polícia chegou mais rápido do que você esperava.",
			"Uma pessoa viu sua arma, reagiu e chamou a atenção de todos.",
			"Uma testemunha interveio e chamou as autoridades.",
			"Você ouviu sirenes próximas e entrou em pânico.",
			"Câmeras de segurança flagraram seu rosto, forçando você a fugir.",
			"Você esqueceu de carregar sua arma. Erro de principiante.",
			"Você havia roubado tanto dinheiro que desmaiou de alegria.",
			"Você tentou parecer durão, mas acabou parecendo suspeito para um guarda próximo.",
			"Um cão de rua raivoso te atacou, dando tempo para a polícia chegar.",
			"Enquanto tentava fugir, você tropeçou e deixou cair toda a grana.",
		],
		successMessages: [
			(formattedMoney: string, defenderNick: string) => `Você roubou ${formattedMoney} de **${defenderNick}**!`,
			(formattedMoney: string, defenderNick: string) => `Dinheiro fácil! Você pegou ${formattedMoney} de **${defenderNick}**.`,
			(formattedMoney: string, defenderNick: string) => `**${defenderNick}** não teve chance. Você escapou com ${formattedMoney}!`,
			(formattedMoney: string, defenderNick: string) => `Mais um roubo bem-sucedido! Você embolsou ${formattedMoney} de **${defenderNick}**.`,
			(formattedMoney: string, defenderNick: string) => `Você agora tem ${formattedMoney} a mais, cortesia de **${defenderNick}**.`,
		],
	},
	[Language.Spanish]: {
		sameId: "¡No puedes robarte a ti mesmo, idiota!",
		sameGang: "¡No puedes robar a un miembro de tu propia cuadrilla!",
		withoutNick: "¡Este usuario aún no ha establecido un apodo!",
		withoutClass: "¡Este usuario aún no ha elegido una clase!",
		withoutItem: "¡No puedes robar sin un arma!",
		lowAtk: (nick: string) => `¡No puedes robar a ${nick} con tus armas actuales! ${EmoteString.Robbery}\n-# Consigue un arma mejor. ¡Necesitas al menos 15 de diferencia!`,
		scavengingA: (placeId: ScavengeId) => `No puedes robar mientras estás buscando en ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Spanish]}** ${EmoteString.Scavenge}`,
		scavengingD: (placeId: ScavengeId) => `está buscando en ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Spanish]}**. ¡Espere unos segundos más para iniciar su acción! ${EmoteString.Scavenge}`,
		inJob: (jobTime: Date, jobId: JobId) => `¡No puedes robar mientras trabajas! ${EmoteString.Jobs}\n-# ¡Terminará tu trabajo de **${JobList[jobId].Description[Language.Spanish]}** ${time(jobTime, TimestampStyles.RelativeTime)}!`,
		inPrison: (prisonTime: Date) => `¡No puedes robar mientras estás en prisión! ${EmoteString.Prison}\n-# Será liberado ${time(prisonTime, TimestampStyles.RelativeTime)}!`,
		isWanted: (wantedTime: Date) => `¡No puedes robar mientras estás siendo buscado por la policía! ${EmoteString.Police}\n-# Podrá robar nuevamente ${time(wantedTime, TimestampStyles.RelativeTime)}!`,
		isInHospital: (hospitalTime: Date) => `¡No puedes robar mientras estás hospitalizado! ${EmoteString.Hospital}\n-# ¡Será curado ${time(hospitalTime, TimestampStyles.RelativeTime)}!`,
		casinoAttacker: `¡No puedes robar mientras estás en un juego de casino! ${EmoteString.Casino}`,
		hands: "¡Manos arriba!",
		tryingToRobYou: "está intentando robarte utilizando",
		andAGrenade: `y una ${EmoteString.Granade} **Granada**`,
		decide: "Decide qué hacer",
		react: "Reaccionar",
		reactDescription: (time: number) => `${EmoteString.Defense}+5 DEF, pero estarás hospitalizado por ${time} minutos si te roban`,
		reacting: "Reaccionando",
		callPolice: "Llamar a la policía",
		callPoliceDescription: (time: number) => `${EmoteString.Defense}-5 DEF, pero estará en prisión por ${time} minutos adicionales si falla`,
		callingPolice: "Llamando a la policía",
		doNothing: "No hacer nada",
		doNothingDescription: "Ningún efecto adicional",
		doingNothing: "Haciendo nada",
		secondsToRespond: "Tienes 60 segundos para responder",
		wereRobbed: (formattedMoney: string, attackerNick: string) => `¡Fuiste robado y perdiste ${formattedMoney} con **${attackerNick}**!`,
		beatedUp: (date: Date) => `Fuiste golpeado y estarás hospitalizado hasta ${time(date, TimestampStyles.ShortDateTime)}`,
		robFailed: "intentó robarte, ¡pero la policía lo atrapó!",
		prisonUntil: (date: Date) => `Estará en prisión hasta ${time(date, TimestampStyles.ShortDateTime)}`,
		finishedRobberyDefender: "Robo finalizado",
		casinoDefender: `está en un juego de casino y no puede ser robado! ${EmoteString.Casino}`,
		robberyInProgress: `Robo en progreso`,
		tryingToRob: "Intentando robar",
		isReacting: "está reaccionando",
		isCallingPolice: "está llamando a la policía",
		isDoingNothing: "no está haciendo nada",
		success: "Éxito",
		failure: "Fracaso",
		willBeAbleAgain: "Podrás robar de nuevo",
		beatenUp: (date: Date) => `Lo golpeaste y estará hospitalizado hasta ${time(date, TimestampStyles.ShortDateTime)}`,
		youFailed: `Fallaste en tu intento`,
		prisonTime: (date: Date) => `Estará en prisión hasta ${time(date, TimestampStyles.ShortDateTime)}`,
		finishedRobberyAttacker: (success: boolean) => `Robo ${success ? "exitoso" : "fallido"}`,
		preparingToRob: (nick: string) => `Preparándose para robar a **${nick}**`,
		useGrenadeDescription: (quantity: number) => `Tienes ${quantity} ${quantity === 1 ? "granada" : "granadas"}`,
		useGrenade: "Usar Granada",
		useGrenadeEffect: `${EmoteString.Attack}+${ItemList[ItemId.Grenade].MoreAttack} ATK`,
		dontUseGrenade: "No usar",
		dontUseGrenadeDescription: "Guardar para después",
		failureMessages: [
			"La policía llegó más rápido de lo que esperabas.",
			"Alguien vio tu arma, reaccionó y atrajo la atención de todos.",
			"Un transeúnte intervino y llamó a las autoridades.",
			"Escuchaste sirenas cerca y entraste en pánico.",
			"Las cámaras de seguridad captaron tu rostro, obligándote a huir.",
			"Olvidaste cargar tu arma. Error de novato.",
			"Habías robado tanto dinero que te desmayaste de alegría.",
			"Intentaste parecer rudo pero terminaste pareciendo sospechoso para un policía cercano.",
			"Un perro callejero rabioso te atacou, lo que le dio tiempo a la policía para que llegara.",
			"Al intentar escapar, tropezaste y se te cayó todo el dinero.",
		],
		successMessages: [
			(formattedMoney: string, defenderNick: string) => `¡Robaste ${formattedMoney} de **${defenderNick}**!`,
			(formattedMoney: string, defenderNick: string) => `¡Dinero fácil! Le quitaste ${formattedMoney} a **${defenderNick}**.`,
			(formattedMoney: string, defenderNick: string) => `**${defenderNick}** no tuvo ninguna oportunidad. ¡Te escapaste con ${formattedMoney}!`,
			(formattedMoney: string, defenderNick: string) => `¡Otro atraco exitoso! Te embolsaste ${formattedMoney} de **${defenderNick}**.`,
			(formattedMoney: string, defenderNick: string) => `Ahora tienes ${formattedMoney} más, cortesía de **${defenderNick}**.`,
		],
	},
} as const satisfies Localization;
