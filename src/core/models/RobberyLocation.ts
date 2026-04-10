import { User } from "./User";
import { Log } from "#shared/log";
import type { ChatInputCommandInteraction } from "discord.js";
import { replyWithContainer } from "#bot/utils/discordInteractions";
import { formatMoney, showTime } from "#bot/utils/ui";
import { EmoteString } from "#bot/utils/emotes";
import { setTimeout as wait } from "timers/promises";
import { addHours } from "date-fns/addHours";
import { Notification } from "./Notification";
import { addMinutes } from "date-fns";
import { globalStrings, Language, type Localization } from "./Language";
import { RobHistories } from "#core/database/RobHistories";
import { Users } from "#core/database/Users";
import { type JobId, JobList } from "#core/types/Jobs";
import { ClashType, Robbery } from "./Robbery";
import { type LocationId, LocationList } from "#core/types/Locations";
import { ClassList, getRobberyClassModifier } from "#core/types/Classes";
import { type ScavengeId, ScavengeList } from "#core/types/Scavenge";

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

		if (this.Attacker.IsScavenging()) {
			message = s.scavenging(this.Attacker.Scavenge.IsScavengingId!);
			canRob = false;
		}

		if (this.Attacker.IsWorking()) {
			message = s.inJob(this.Attacker.Job.EndsIn, this.Attacker.Job.Id!);
			canRob = false;
		}

		if (this.Attacker.IsInPrison()) {
			message = s.inPrison(this.Attacker.Prison.Time);
			canRob = false;
		}

		if (this.Attacker.IsWanted()) {
			message = s.isWanted(this.Attacker.Wanted.Time);
			canRob = false;
		}

		if (this.Attacker.IsInHospital()) {
			message = s.isInHospital(this.Attacker.Hospital.Time);
			canRob = false;
		}

		if (this.Attacker.IsInCasinoGame()) {
			message = s.isInCasino;
			canRob = false;
		}

		if (this.Attacker.BeatUp.IsBeatingId) {
			const user = await Users.findByPk(this.Attacker.BeatUp.IsBeatingId, { attributes: ["class", "nickname"] });
			message = globalStrings[this.Attacker.Language].attackerIsBeatingId(`${ClassList[user!.class].Image.Emote.String} ${user!.nickname!}`);
			canRob = false;
		}

		if (this.Attacker.BeatUp.IsBeingBeatUpById) {
			const user = await Users.findByPk(this.Attacker.BeatUp.IsBeingBeatUpById, { attributes: ["class", "nickname"] });
			message = globalStrings[this.Attacker.Language].attackerIsBeingBeatedById(`${ClassList[user!.class!].Image.Emote.String} ${user!.nickname!}`);
			canRob = false;
		}

		if (this.Attacker.Robbery.IsRobbingId) {
			const user = await Users.findByPk(this.Attacker.Robbery.IsRobbingId, { attributes: ["nickname", "class"] });
			message = globalStrings[this.Attacker.Language].attackerIsRobbingId(`${ClassList[user!.class].Image.Emote.String} ${user!.nickname}`);
			canRob = false;
		}

		if (this.Attacker.Robbery.IsBeingRobbedById) {
			const user = await Users.findByPk(this.Attacker.Robbery.IsBeingRobbedById, { attributes: ["nickname", "class"] });
			message = globalStrings[this.Attacker.Language].attackerIsBeingRobbedById(`${ClassList[user!.class].Image.Emote.String} ${user!.nickname}`);
			canRob = false;
		}

		if (this.Attacker.Robbery.IsRobbingLocationId !== null) {
			const location = LocationList[this.Attacker.Robbery.IsRobbingLocationId];
			message = globalStrings[this.Attacker.Language].attackerIsRobbingId(location.Name[this.Attacker.Language]);
			canRob = false;
		}

		if (this.Attacker.IsDefendingInvestment()) {
			message = globalStrings[this.Attacker.Language].attackerIsDefendingInvestment;
			canRob = false;
		}

		if (this.Attacker.IsParticipatingInGangAction()) {
			message = globalStrings[this.Attacker.Language].attackerIsParticipatingInGangAction;
			canRob = false;
		}

		return { canRob, message };
	}

	async StartRobbery(interaction: ChatInputCommandInteraction) {
		const s = Strings[this.Attacker.Language];

		this.AttackerTimeInPrison = 20 * (this.LocationId + 1);

		this.Attacker.Robbery.IsRobbingLocationId = this.LocationId;

		await this.Attacker.Update({
			robbingLocationId: this.Attacker.Robbery.IsRobbingLocationId,
		});

		Log.Info(`User ${this.Attacker.Nickname} (Id: ${this.Attacker.Id}) started a robbery to location ${LocationList[this.LocationId].Name[Language.English]} (Id: ${LocationList[this.LocationId].Id}).`);

		this.Container.Channel
			.setUser(this.Attacker)
			.addTexts([
				`${EmoteString.Robbery} ${s.robberyInProgress}`,
			], 1)
			.addLargeSeparator()
			.addTexts([
				`${s.tryingToRob} ${LocationList[this.LocationId].Emote.String} **${LocationList[this.LocationId].Name[this.Attacker.Language]}** ${EmoteString.Waiting}`,
			], 50)
			.addFooter();

		await replyWithContainer(interaction, this.Container.Channel);

		await wait(10_000 + (5_000 * this.LocationId));

		this.Chance = Math.random() * 100;
		this.Success = this.Chance < LocationList[this.LocationId].SuccessChance;

		await this.EndRobbery(interaction);
	}

	async EndRobbery(interaction: ChatInputCommandInteraction) {
		await this.Attacker.GetInfo();

		const s = Strings[this.Attacker.Language];

		const locationEmote = LocationList[this.LocationId].Emote.String;
		const locationName = LocationList[this.LocationId].Name[this.Attacker.Language];

		if (this.Success) {
			this.MoneyRobbed = Math.floor(Math.random() * (this.RewardMax - this.RewardMin + 1)) + this.RewardMin;
			this.Attacker.Money += this.MoneyRobbed;
			this.Attacker.Robbery.SuccessCount += 1;
			this.Attacker.Robbery.SuccessRobbedSum += this.MoneyRobbed;
			this.Attacker.Wanted.Time = addHours(new Date(), 1);

			await Notification.RobAgain(this.Attacker);

			const texts = [
				`### ${EmoteString.Victory} ${s.success}!`,
				s.youRobbed(formatMoney(this.MoneyRobbed, this.Attacker.Language), `${locationEmote} ${locationName}`),
				`-# ${s.willBeAbleAgain} ${showTime(this.Attacker.Wanted.Time.getTime(), true)}`,
			].join("\n");

			this.Container.Channel.changeTextFromSectionId(50, texts);

			Log.Success(`User ${this.Attacker.Nickname} (Id: ${this.Attacker.Id}) successfully robbed location ${LocationList[this.LocationId].Name[Language.English]} (Id: ${LocationList[this.LocationId].Id}) and got ${formatMoney(this.MoneyRobbed, Language.English)}.`);
		}
		else {
			this.Attacker.Prison.Time = addMinutes(new Date(), this.AttackerTimeInPrison);
			this.Attacker.Prison.HasPaidBribe = false;
			this.Attacker.Escape.HasTried = false;
			this.Attacker.Robbery.FailureCount += 1;
			this.Attacker.Prison.Count += 1;

			await Notification.Free(this.Attacker);

			const prisonText = LocationList[this.LocationId].Prison.Text[Math.floor(Math.random() * LocationList[this.LocationId].Prison.Text.length)][this.Attacker.Language];

			const texts = [
				`### ${EmoteString.Defeat} ${s.failure}!`,
				`${s.youFailed(`${locationEmote} ${locationName}`)}!`,
				`-# ${EmoteString.Prison} ${prisonText} ${s.prisonTime(this.Attacker.Prison.Time)}`,
			].join("\n");

			this.Container.Channel.changeTextFromSectionId(50, texts);

			Log.Success(`User ${this.Attacker.Nickname} (Id: ${this.Attacker.Id}) failed to rob location ${LocationList[this.LocationId].Name[Language.English]} (Id: ${LocationList[this.LocationId].Id}).`);
		}

		this.Container.Channel
			.changeTextFromSectionId(1, `${EmoteString.Robbery} ${s.finishedRobberyAttacker(this.Success)}`)
			.changeFooterText(formatMoney(this.Attacker.Money, this.Attacker.Language));

		await replyWithContainer(interaction, this.Container.Channel);

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

const Strings = {
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