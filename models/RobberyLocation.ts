import { User } from "./User";
import { Log } from "../utils/log";
import { ChatInputCommandInteraction } from "discord.js";
import { replyInteraction } from "../utils/logic";
import { formatMoney, showTime } from "../utils/ui";
import { CrColors } from "../utils/colors";
import { EmoteString } from "../utils/emotes";
import { setTimeout as wait } from "timers/promises";
import { addHours } from "date-fns/addHours";
import { Notification } from "./Notification";
import { addMinutes } from "date-fns";
import { Language } from "./Language";
import { RobHistories } from "../database/RobHistories";
import { Users } from "../database/Users";
import { CreationOptional } from "sequelize";
import { JobId, JobList } from "./Job";
import { Robbery, RobTypes } from "./Robbery";
import { Location, LocationList } from "./Locations";

export class RobberyLocation extends Robbery {
	Location: Location;

	constructor(attacker: User, location: Location) {
		super(attacker, new User("0", Language.English)); // defender will not be used
		this.Attacker = attacker;
		this.Location = location;
		this.Type = RobTypes.Location;
		this.Date = new Date();
	}

	async CanRobLocation() {
		const s = Strings[this.Attacker.Language];
		let canRob = true;
		let message = "";

		if (this.Attacker.Attributes.Attack < this.Location.NeedAttack) {
			message = `${s.needMoreAttack} ${EmoteString.Robbery}`;
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

		if (this.Attacker.Robbery.IsRobbingId) {
			const user = await Users.findByPk(this.Attacker.Robbery.IsRobbingId, { attributes: ["nickname", "class"] });
			message = `${s.attackerIsRobbingId(`${ClassList[user!.class].Image.Emote.String} ${user!.nickname}`)} ${EmoteString.Robbery}`;
			canRob = false;
		}

		if (this.Attacker.Robbery.IsBeingRobbedById) {
			const user = await Users.findByPk(this.Attacker.Robbery.IsBeingRobbedById, { attributes: ["nickname", "class"] });
			message = `${s.attackerIsBeingRobbedById(`${ClassList[user!.class].Image.Emote.String} ${user!.nickname}`)} ${EmoteString.Robbery}`;
			canRob = false;
		}

		if (this.Attacker.Robbery.IsRobbingLocationId) {
			const location = LocationList[this.Attacker.Robbery.IsRobbingLocationId];
			message = `${s.attackerIsRobbingId(location.Description[this.Attacker.Language])} ${EmoteString.Robbery}`;
			canRob = false;
		}

		return { canRob, message };
	}

	async StartRobbery(interaction: ChatInputCommandInteraction) {
		const s = Strings[this.Attacker.Language];

		this.AttackerTimeInPrison = 20 * (this.Location.Id + 1);

		this.Attacker.Robbery.IsRobbingLocationId = this.Location.Id;

		await this.Attacker.Update();

		Log.Info(`User ${this.Attacker.Nickname} (ID: ${this.Attacker.Id}) started a robbery to location ${this.Location.Description[Language.English]} (ID: ${this.Location.Id}).`);

		this.Embed.Channel
			.setAuthor({
				name: s.robberyInProgress,
				iconURL: "https://media.discordapp.net/attachments/691019843159326757/791444366727708672/roubar_20201223201323.png",
			})
			.setUserFooter({
				nickname: this.Attacker.Nickname,
				image: interaction.user.avatarURL(),
				text: `${s.tryingToRob} ${this.Location.Description[this.Attacker.Language]}`,
			});

		await replyInteraction(interaction, { embeds: [this.Embed.Channel], components: [] });

		await wait(10_000 + (5_000 * this.Location.Id));

		this.Chance = Math.random() * 100;
		this.Success = this.Chance < this.Location.SuccessChance;

		await this.EndRobbery(interaction);
	}

	async EndRobbery(interaction: ChatInputCommandInteraction) {
		await this.Attacker.GetInfo();

		const s = Strings[this.Attacker.Language];

		if (this.Success) {
			this.MoneyRobbed = Math.floor(Math.random() * (this.Location.Reward.Max - this.Location.Reward.Min + 1)) + this.Location.Reward.Min;
			this.Attacker.Money += this.MoneyRobbed;
			this.Attacker.Robbery.SuccessCount += 1;
			this.Attacker.Robbery.SuccessRobbedSum += this.MoneyRobbed;
			this.Attacker.Wanted.Time = addHours(new Date(), 1);

			await Notification.RobAgain(this.Attacker);

			this.Embed.Channel
				.setDescription(`${s.youRobbed(formatMoney(this.MoneyRobbed, this.Attacker.Language), this.Location.Description[this.Attacker.Language])} ${EmoteString.Robbery}`);

			Log.Success(`User ${this.Attacker.Nickname} (ID: ${this.Attacker.Id}) successfully robbed location ${this.Location.Description[Language.English]} (ID: ${this.Location.Id}) and got ${formatMoney(this.MoneyRobbed, Language.English)}.`);
		}
		else {
			this.Attacker.Prison.Time = addMinutes(new Date(), this.AttackerTimeInPrison);
			this.Attacker.Prison.HasPaidBribe = false;
			this.Attacker.Escape.HasTried = false;
			this.Attacker.Robbery.FailureCount += 1;

			await Notification.Free(this.Attacker);

			this.Embed.Channel
				.setColor(CrColors.Police)
				.setDescription(`${s.youFailed}! ${EmoteString.Police}
-# ${s.prisonTime(this.Attacker.Prison.Time)}`);

			Log.Success(`User ${this.Attacker.Nickname} (ID: ${this.Attacker.Id}) failed to rob location ${this.Location.Description[Language.English]} (ID: ${this.Location.Id}).`);
		}

		this.Embed.Channel
			.setAuthor({
				name: s.finishedRobberyAttacker(this.Success),
				iconURL: this.Location.ImageUrl,
			})
			.setUserFooter({
				nickname: this.Attacker.Nickname,
				image: interaction.user.avatarURL(),
				text: formatMoney(this.Attacker.Money, this.Attacker.Language),
			});

		await replyInteraction(interaction, { embeds: [this.Embed.Channel], components: [] });

		this.Attacker.Robbery.IsRobbingLocationId = null;
		await this.Attacker.Update();

		await RobHistories.CreateLocationHistory(this);
	}
}

const Strings = {
	[Language.English]: {
		// CanRob
		needMoreAttack: `You need more ${EmoteString.Attack}ATK to rob this location!`,
		inJob: (jobTime: Date, jobId: JobId) => `You can't rob while working! ${EmoteString.Jobs}\n-# Will finish your **${JobList[jobId].Description[Language.English]}** job ${showTime(jobTime.getTime(), true)}!`,
		inPrison: (prisonTime: Date) => `You can't rob while you're in prison! ${EmoteString.Prison}\n-# Will be released ${showTime(prisonTime.getTime(), true)}!`,
		isWanted: (wantedTime: Date) => `You can't rob while you're wanted by the police! ${EmoteString.Police}\n-# Will be able to rob again ${showTime(wantedTime.getTime(), true)}!`,
		isInHospital: (hospitalTime: Date) => `You can't rob while you're hospitalized! ${EmoteString.Hospital}\n-# Will be healed ${showTime(hospitalTime.getTime(), true)}!`,
		attackerIsRobbingId: (nick: CreationOptional<string> | undefined) => `You're already robbing **${nick}**!`,
		attackerIsBeingRobbedById: (nick: CreationOptional<string> | undefined) => `You're being robbed by **${nick}**!`,
		// Attacker
		robberyInProgress: "Robbery in progress...",
		tryingToRob: "Trying to rob",
		youRobbed: (formattedMoney: string, defenderNick: string) => `You robbed ${formattedMoney} from **${defenderNick}**!`,
		youFailed: "You failed in your attempt",
		prisonTime: (time: Date) => `Will be in prison until ${showTime(time.getTime())}`,
		finishedRobberyAttacker: (success: boolean) => `Robbery ${success ? "successful" : "unsuccessful"}`,
	},
	[Language.Portuguese]: {
		// CanRob
		needMoreAttack: `Você precisa mais ${EmoteString.Attack}ATK para roubar este local!`,
		inJob: (jobTime: Date, jobId: JobId) => `Você não pode roubar enquanto está trabalhando! ${EmoteString.Jobs}\n-# Terminará seu trabalho de **${JobList[jobId].Description[Language.Portuguese]}** ${showTime(jobTime.getTime(), true)}!`,
		inPrison: (prisonTime: Date) => `Você não pode roubar enquanto está preso! ${EmoteString.Prison}\n-# Será solto ${showTime(prisonTime.getTime(), true)}!`,
		isWanted: (wantedTime: Date) => `Você não pode roubar enquanto está sendo procurado pela polícia! ${EmoteString.Police}\n-# Poderá roubar novamente ${showTime(wantedTime.getTime(), true)}!`,
		isInHospital: (hospitalTime: Date) => `Você não pode roubar enquanto está hospitalizado! ${EmoteString.Hospital}\n-# Será curado ${showTime(hospitalTime.getTime(), true)}!`,
		attackerIsRobbingId: (nick: CreationOptional<string> | undefined) => `Você já está roubando **${nick}**!`,
		attackerIsBeingRobbedById: (nick: CreationOptional<string> | undefined) => `Você está sendo roubado por **${nick}**!`,
		// Attacker
		robberyInProgress: "Roubo em andamento...",
		tryingToRob: "Tentando roubar",
		youRobbed: (formattedMoney: string, defenderNick: string) => `Você roubou ${formattedMoney} de **${defenderNick}**!`,
		youFailed: "Você falhou na sua tentativa",
		prisonTime: (time: Date) => `Ficará preso até ${showTime(time.getTime())}`,
		finishedRobberyAttacker: (success: boolean) => `Roubo ${success ? "bem" : "mal"}-sucedido`,
	},
	[Language.Spanish]: {
		// CanRob
		needMoreAttack: `¡Necesitas más ${EmoteString.Attack}ATK para robar este lugar!`,
		inJob: (jobTime: Date, jobId: JobId) => `¡No puedes robar mientras trabajas! ${EmoteString.Jobs}\n-# ¡Terminará tu trabajo de **${JobList[jobId].Description[Language.Spanish]}** ${showTime(jobTime.getTime(), true)}!`,
		inPrison: (prisonTime: Date) => `¡No puedes robar mientras estás en prisión! ${EmoteString.Prison}\n-# Será liberado ${showTime(prisonTime.getTime(), true)}!`,
		isWanted: (wantedTime: Date) => `¡No puedes robar mientras estás siendo buscado por la policía! ${EmoteString.Police}\n-# Podrá robar nuevamente ${showTime(wantedTime.getTime(), true)}!`,
		isInHospital: (hospitalTime: Date) => `¡No puedes robar mientras estás hospitalizado! ${EmoteString.Hospital}\n-# ¡Será curado ${showTime(hospitalTime.getTime(), true)}!`,
		attackerIsRobbingId: (nick: CreationOptional<string> | undefined) => `¡Ya estás robando a **${nick}**!`,
		attackerIsBeingRobbedById: (nick: CreationOptional<string> | undefined) => `¡Estás siendo robado por **${nick}**!`,
		// Attacker
		robberyInProgress: "Robo en progreso...",
		tryingToRob: "Intentando robar",
		youRobbed: (formattedMoney: string, defenderNick: string) => `¡Robaste ${formattedMoney} de **${defenderNick}**!`,
		youFailed: `Fallaste en tu intento`,
		prisonTime: (time: Date) => `Estará en prisión hasta ${showTime(time.getTime())}`,
		finishedRobberyAttacker: (success: boolean) => `Robo ${success ? "exitoso" : "fallido"}`,
	},
} as const;