import { User } from "./User";
import { Log } from "../utils/log";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	ComponentType,
	Message,
	MessageComponentInteraction,
	User as DUser,
} from "discord.js";
import { getPercent, replyInteraction, sendComplexPrivateMessage } from "../utils/logic";
import { formatMoney, showTime } from "../utils/ui";
import { CrColors } from "../utils/colors";
import { EmoteId, EmoteString } from "../utils/emotes";
import { CustomEmbedBuilder } from "./CustomEmbedBuilder";
import { getClient } from "../client";
import { setTimeout as wait } from "timers/promises";
import { addHours } from "date-fns/addHours";
import { Notification } from "./Notification";
import { addMinutes } from "date-fns";
import { Language } from "./Language";
import { RobHistories } from "../database/RobHistories";
import { Users } from "../database/Users";
import { ClassId, ClassList } from "./Class";
import { CreationOptional } from "sequelize";
import { JobId, JobList } from "./Job";
import { LocationList } from "./Locations";

export enum RobTypes {
	User = 1,
	Location,
}

export class Robbery {
	Id = 0;
	Attacker: User;
	AttackerTimeInPrison = 0;
	AttackerAditionalTimeCallPolice = 0;
	DefenderTimeInHospital = 0;
	BeatUpChance = 0.25;
	Defender: User;
	Date: Date;
	Chance = 0;
	Success = false;
	MoneyRobbed = 0;
	Type = RobTypes.User;

	DiscordUser: DUser | undefined;

	Embed = {
		Private: new CustomEmbedBuilder().setColor(CrColors.Robbery),
		Channel: new CustomEmbedBuilder().setColor(CrColors.Robbery),
	};

	constructor(attacker: User, defender: User) {
		this.Attacker = attacker;
		this.Defender = defender;
		this.Date = new Date();
	}

	async GetDiscordUser() {
		const client = getClient();
		this.DiscordUser = await client.users.fetch(this.Defender.Id);
	}

	async CanRobUser() {
		const s = Strings[this.Attacker.Language];
		let canRob = true;
		let message = "";

		if (this.Defender.Id === this.Attacker.Id) {
			message = `${s.sameId} ${EmoteString.Robbery}`;
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

		if (this.Attacker.Attributes.Attack == 0) {
			message = `${s.withoutItem} ${EmoteString.Robbery}`;
			canRob = false;
		}

		if (this.Defender.Attributes.Attack - this.Attacker.Attributes.Attack > 15) {
			message = s.lowAtk(this.Defender.Nickname);
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
			const user = await Users.findByPk(this.Attacker.Robbery.IsRobbingId);
			message = `${s.attackerIsRobbingId(`${ClassList[user!.class].Image.Emote.String} ${user!.nickname!}`)} ${EmoteString.Robbery}`;
			canRob = false;
		}

		if (this.Attacker.Robbery.IsBeingRobbedById) {
			const user = await Users.findByPk(this.Attacker.Robbery.IsBeingRobbedById);
			message = `${s.attackerIsBeingRobbedById(`${ClassList[user!.class!].Image.Emote.String} ${user!.nickname!}`)} ${EmoteString.Robbery}`;
			canRob = false;
		}

		if (this.Defender.Robbery.IsRobbingId) {
			const user = await Users.findByPk(this.Defender.Robbery.IsRobbingId);
			message = `${ClassList[this.Defender.Class].Image.Emote.String} **${this.Defender.Nickname}** ${s.defenderIsRobbingId(`${ClassList[user!.class!].Image.Emote.String} ${user!.nickname!}`)} ${EmoteString.Robbery}`;
			canRob = false;
		}

		if (this.Defender.Robbery.IsBeingRobbedById) {
			const user = await Users.findByPk(this.Defender.Robbery.IsBeingRobbedById);
			message = `${ClassList[this.Defender.Class].Image.Emote.String} **${this.Defender.Nickname}** ${s.defenderIsBeingRobbedById(`${ClassList[user!.class!].Image.Emote.String} ${user!.nickname!}`)} ${EmoteString.Robbery}`;
			canRob = false;
		}

		if (this.Attacker.Robbery.IsRobbingLocationId) {
			const location = LocationList[this.Attacker.Robbery.IsRobbingLocationId];
			message = `${s.attackerIsRobbingId(location.Description[this.Attacker.Language])} ${EmoteString.Robbery}`;
			canRob = false;
		}

		if (this.Defender.Robbery.IsRobbingLocationId) {
			const location = LocationList[this.Defender.Robbery.IsRobbingLocationId];
			message = `${ClassList[this.Defender.Class].Image.Emote.String} **${this.Defender.Nickname}** ${s.defenderIsRobbingId(location.Description[this.Attacker.Language])} ${EmoteString.Robbery}`;
			canRob = false;
		}

		return { canRob, message };
	}

	async StartRobbery(interaction: ChatInputCommandInteraction) {
		const sA = Strings[this.Attacker.Language];
		const sD = Strings[this.Defender.Language];

		this.AttackerTimeInPrison = 10 + 1.5 * this.Attacker.Attributes.Attack;
		this.AttackerAditionalTimeCallPolice = Math.floor(25 + 0.5 * this.Attacker.Attributes.Attack);
		this.DefenderTimeInHospital = 25 + this.Defender.Attributes.Defense / 2;

		if (this.Defender.Attributes.Defense === 0) {
			this.Attacker.Attributes.Attack *= 1.35;
		}

		this.Attacker.Robbery.IsRobbingId = this.Defender.Id;
		this.Defender.Robbery.IsBeingRobbedById = this.Attacker.Id;
		await Promise.all([this.Attacker.Update(), this.Defender.Update()]);

		Log.Info(`User ${this.Attacker.Nickname} (ID: ${this.Attacker.Id}) started a robbery to user ${this.Defender.Nickname} (ID: ${this.Defender.Id}).`);

		const usedGun = `${this.Attacker.BestGun?.Skin.Default.Emote.String} ${this.Attacker.BestGun?.Description[this.Defender.Language]}`;

		this.Embed.Private
			.setAuthor({
				name: sD.hands,
				iconURL: interaction.user.avatarURL() ?? undefined,
			})
			.setDescription(`${ClassList[this.Attacker.Class].Image.Emote.String} **${this.Attacker.Nickname}** ${sD.tryingToRobYou} **${usedGun}** ${EmoteString.Robbery}

-# ${sD.decide}:
### ${EmoteString.React} **${sD.react}**
${sD.reactDescription(this.DefenderTimeInHospital)}
### ${EmoteString.Police} **${sD.callPolice}**
${sD.callPoliceDescription(this.AttackerAditionalTimeCallPolice)}
### 🏳️ **${sD.doNothing}**
${sD.doNothingDescription}`)
			.setFooter({ text: sD.secondsToRespond });

		const buttonReact = new ButtonBuilder()
			.setCustomId("react")
			.setLabel(sD.react)
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(EmoteId.React)
			.setDisabled(this.Defender.IsWorking() ||
				this.Defender.IsInPrison() ||
				this.Defender.IsInHospital() ||
				this.Defender.Attributes.Attack === 0);

		const buttonPolice = new ButtonBuilder()
			.setCustomId("police")
			.setLabel(sD.callPolice)
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(EmoteId.Police)
			.setDisabled(this.Defender.IsInHospital() ||
				this.Defender.Attributes.Defense < 5);

		const buttonNothing = new ButtonBuilder()
			.setCustomId("nothing")
			.setLabel(sD.doNothing)
			.setStyle(ButtonStyle.Secondary)
			.setEmoji("🏳️");

		const defenderRow = new ActionRowBuilder<ButtonBuilder>()
			.addComponents([buttonReact, buttonPolice, buttonNothing]);

		const defenderMessage = await sendComplexPrivateMessage(this.DiscordUser?.id, {
			embeds: [this.Embed.Private],
			components: [defenderRow],
		});

		this.Embed.Channel
			.setAuthor({
				name: sA.robberyInProgress,
				iconURL: "https://media.discordapp.net/attachments/691019843159326757/791444366727708672/roubar_20201223201323.png",
			})
			.setDefaultFooter(this.Attacker.Nickname, interaction.user.avatarURL(), `${sA.tryingToRob} ${this.Defender.Nickname}`);

		await replyInteraction(interaction, {
			embeds: [this.Embed.Channel],
		});

		const collectorPrivate = defenderMessage?.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === this.Defender.Id,
			max: 1,
			componentType: ComponentType.Button,
			time: 60_000,
		});

		collectorPrivate?.on("collect", async btn => {
			let descriptionPrivate = "";
			let descriptionChannel = "";

			collectorPrivate?.stop();

			if (btn.customId === "react") {
				this.Defender.Attributes.Defense += 5;
				this.BeatUpChance = 1;

				descriptionPrivate = `### ${EmoteString.React} ${sD.reacting}...`;
				descriptionChannel = `### ${EmoteString.React} ${this.Defender.Nickname} ${sA.isReacting}!`;
				// this.Defender.Robbery.ReactedCount += 1;
			}
			else if (btn.customId === "police") {

				this.Defender.Attributes.Defense -= 5;
				this.AttackerTimeInPrison += this.AttackerAditionalTimeCallPolice;

				descriptionPrivate = `### ${EmoteString.Police} ${sD.callingPolice}...`;
				descriptionChannel = `### ${EmoteString.Police} ${this.Defender.Nickname} ${sA.isCallingPolice}!`;
				// this.Defender.Robbery.CallPoliceCount += 1;
			}
			else if (btn.customId === "nothing") {
				descriptionPrivate = `### 🏳️ ${sD.doingNothing}...`;
				descriptionChannel = `### 🏳️ ${this.Defender.Nickname} ${sA.isDoingNothing}!`;
			}

			defenderMessage?.edit({
				embeds: [this.Embed.Private
					.setDescription(descriptionPrivate)],
				components: [],
			});
			await replyInteraction(interaction, {
				embeds: [this.Embed.Channel.setDescription(descriptionChannel)],
			});
		});

		await wait(60_000);

		this.Attacker.Attributes.Attack -= getPercent(this.Defender.Attributes.Defense, this.Attacker.Attributes.Attack);

		this.Chance = Math.random() * 100;
		this.Success = this.Chance < this.Attacker.Attributes.Attack;

		await this.EndRobbery(interaction, defenderMessage);
	}

	async EndRobbery(interaction: ChatInputCommandInteraction, privateMessage: Message | undefined) {
		await Promise.all([this.Attacker.GetInfo(), this.Defender.GetInfo()]);

		const sA = Strings[this.Attacker.Language];
		const sD = Strings[this.Defender.Language];

		if (this.Success) {
			if (this.Defender.Attributes.Defense > 0) {
				this.Attacker.Attributes.MoneyAttack -= getPercent(this.Defender.Attributes.MoneyDefense, this.Attacker.Attributes.MoneyAttack);
			}

			this.MoneyRobbed = Math.floor(getPercent(this.Attacker.Attributes.MoneyAttack, this.Defender.Money));
			this.Attacker.Money += this.MoneyRobbed;
			this.Attacker.Robbery.SuccessCount += 1;
			this.Attacker.Robbery.SuccessRobbedSum += this.MoneyRobbed;
			this.Attacker.Wanted.Time = addHours(new Date(), 1);

			this.Defender.Money -= this.MoneyRobbed;
			this.Defender.Robbery.BeingRobbedCount += 1;
			this.Defender.Robbery.BeingRobbedSum += this.MoneyRobbed;

			const willBeBeatenUp = Math.random() < this.BeatUpChance &&
				!this.Defender.IsWorking() &&
				!this.Defender.IsInPrison() &&
				!this.Defender.IsInHospital();

			if (willBeBeatenUp) {
				this.Defender.Hospital.Count += 1;
				this.Defender.Hospital.Time = addMinutes(new Date(), this.DefenderTimeInHospital);
				this.Defender.BeatUp.BeatedUpCount += 1;
				this.Attacker.BeatUp.SuccessCount += 1;
				await Notification.Hospital(this.Defender);
			}

			await Notification.RobAgain(this.Attacker);

			this.Embed.Channel
				.setDescription(`${sA.youRobbed(formatMoney(this.MoneyRobbed, this.Attacker.Language), this.Defender.Nickname)} ${EmoteString.Robbery}${willBeBeatenUp ? `
${sA.beatenUp(this.Defender.Hospital.Time)} ${EmoteString.Hospital}` : ""}`);

			this.Embed.Private
				.setDescription(`${sD.wereRobbed(formatMoney(this.MoneyRobbed, this.Defender.Language), this.Attacker.Nickname)} ${EmoteString.Robbery}${willBeBeatenUp ? `
${sD.beatedUp(this.Defender.Hospital.Time)} ${EmoteString.Hospital}` : ""}`);

			Log.Success(`User ${this.Attacker.Nickname} (ID: ${this.Attacker.Id}) successfully robbed user ${this.Defender.Nickname} (ID: ${this.Defender.Id}) and got ${formatMoney(this.MoneyRobbed, Language.English)}. ${willBeBeatenUp ? "The defender was beaten up." : ""}`);
		}
		else {
			this.Attacker.Prison.Time = addMinutes(new Date(), this.AttackerTimeInPrison);
			this.Attacker.Prison.HasPaidBribe = false;
			this.Attacker.Escape.HasTried = false;
			this.Attacker.Robbery.FailureCount += 1;

			await Notification.Free(this.Attacker);

			this.Embed.Channel
				.setColor(CrColors.Police)
				.setDescription(`${sA.youFailed}! ${EmoteString.Police}
-# ${sA.prisonTime(this.Attacker.Prison.Time)}`);

			this.Embed.Private
				.setColor(CrColors.Police)
				.setDescription(`**${this.Attacker.Nickname}** ${sD.robFailed} ${EmoteString.Police}
-# ${sD.prisonUntil(this.Attacker.Prison.Time)}!`);

			Log.Success(`User ${this.Attacker.Nickname} (ID: ${this.Attacker.Id}) failed to rob user ${this.Defender.Nickname} (ID: ${this.Defender.Id}).`);
		}

		this.Embed.Channel
			.setAuthor({
				name: sA.finishedRobberyAttacker(this.Success),
				iconURL: this.DiscordUser?.avatarURL() ?? undefined,
			})
			.setDefaultFooter(this.Attacker.Nickname, interaction.user.avatarURL(), formatMoney(this.Attacker.Money, this.Attacker.Language));

		await replyInteraction(interaction, { embeds: [this.Embed.Channel], components: [] });

		if (privateMessage) {
			this.Embed.Private
				.setAuthor({
					name: sD.finishedRobberyDefender,
					iconURL: interaction.user.avatarURL() ?? undefined,
				})
				.setFooter({ text: formatMoney(this.Defender.Money, this.Defender.Language) });

			await privateMessage.edit({ embeds: [this.Embed.Private], components: [] });
		}

		this.Attacker.Robbery.IsRobbingId = null;
		this.Defender.Robbery.IsBeingRobbedById = null;
		await Promise.all([this.Attacker.Update(), this.Defender.Update()]);

		await RobHistories.CreateUserHistory(this);
	}
}

const Strings = {
	[Language.English]: {
		// CanRob
		sameId: "You can't rob yourself, idiot!",
		withoutNick: "This user hasn't set a nickname yet!",
		withoutClass: "This user hasn't choose a class yet!",
		withoutItem: "You can't rob without a weapon!",
		lowAtk: (nick: string) => `You can't rob ${nick} with your current weapons! ${EmoteString.Robbery}\n-# Get a better weapon`,
		inJob: (jobTime: Date, jobId: JobId) => `You can't rob while working! ${EmoteString.Jobs}\n-# Will finish your **${JobList[jobId].Description[Language.English]}** job ${showTime(jobTime.getTime(), true)}!`,
		inPrison: (prisonTime: Date) => `You can't rob while you're in prison! ${EmoteString.Prison}\n-# Will be released ${showTime(prisonTime.getTime(), true)}!`,
		isWanted: (wantedTime: Date) => `You can't rob while you're wanted by the police! ${EmoteString.Police}\n-# Will be able to rob again ${showTime(wantedTime.getTime(), true)}!`,
		isInHospital: (hospitalTime: Date) => `You can't rob while you're hospitalized! ${EmoteString.Hospital}\n-# Will be healed ${showTime(hospitalTime.getTime(), true)}!`,
		attackerIsRobbingId: (nick: CreationOptional<string> | undefined) => `You're already robbing **${nick}**!`,
		attackerIsBeingRobbedById: (nick: CreationOptional<string> | undefined) => `You're being robbed by **${nick}**!`,
		defenderIsRobbingId: (nick: CreationOptional<string> | undefined) => `is robbing **${nick}**. Wait a few more seconds to start your action!`,
		defenderIsBeingRobbedById: (nick: CreationOptional<string> | undefined) => `is being robbed by **${nick}**. Wait a few more seconds to start your action!`,
		// Defender
		hands: "Hands up!",
		tryingToRobYou: "is trying to rob you using",
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
		beatedUp: (time: Date) => `You were beaten up and will be hospitalized until ${showTime(time.getTime())}`,
		robFailed: "tried to rob you, but the police caught him!",
		prisonUntil: (time: Date) => `He will be in prison until ${showTime(time.getTime())}`,
		finishedRobberyDefender: "Robbery finished",
		// Attacker
		robberyInProgress: "Robbery in progress...",
		tryingToRob: "Trying to rob",
		isReacting: "is reacting",
		isCallingPolice: "is calling the police",
		isDoingNothing: "is doing nothing",
		youRobbed: (formattedMoney: string, defenderNick: string) => `You robbed ${formattedMoney} from **${defenderNick}**!`,
		beatenUp: (time: Date) => `You beat him up and he will be hospitalized until ${showTime(time.getTime())}`,
		youFailed: "You failed in your attempt",
		prisonTime: (time: Date) => `Will be in prison until ${showTime(time.getTime())}`,
		finishedRobberyAttacker: (success: boolean) => `Robbery ${success ? "successful" : "unsuccessful"}`,
	},
	[Language.Portuguese]: {
		// CanRob
		sameId: "Você não pode roubar a si mesmo, idiota!",
		withoutNick: "Este usuário ainda não cadastrou um nickname!",
		withoutClass: "Este usuário ainda não escolheu uma classe!",
		withoutItem: "Você não pode roubar sem uma arma!",
		lowAtk: (nick: string) => `Você não pode roubar ${nick} usando suas armas atuais! ${EmoteString.Robbery}\n-# Consiga uma arma melhor`,
		inJob: (jobTime: Date, jobId: JobId) => `Você não pode roubar enquanto está trabalhando! ${EmoteString.Jobs}\n-# Terminará seu trabalho de **${JobList[jobId].Description[Language.Portuguese]}** ${showTime(jobTime.getTime(), true)}!`,
		inPrison: (prisonTime: Date) => `Você não pode roubar enquanto está preso! ${EmoteString.Prison}\n-# Será solto ${showTime(prisonTime.getTime(), true)}!`,
		isWanted: (wantedTime: Date) => `Você não pode roubar enquanto está sendo procurado pela polícia! ${EmoteString.Police}\n-# Poderá roubar novamente ${showTime(wantedTime.getTime(), true)}!`,
		isInHospital: (hospitalTime: Date) => `Você não pode roubar enquanto está hospitalizado! ${EmoteString.Hospital}\n-# Será curado ${showTime(hospitalTime.getTime(), true)}!`,
		attackerIsRobbingId: (nick: CreationOptional<string> | undefined) => `Você já está roubando **${nick}**!`,
		attackerIsBeingRobbedById: (nick: CreationOptional<string> | undefined) => `Você está sendo roubado por **${nick}**!`,
		defenderIsRobbingId: (nick: CreationOptional<string> | undefined) => `está roubando **${nick}**. Espere mais alguns segundos para iniciar sua ação!`,
		defenderIsBeingRobbedById: (nick: CreationOptional<string> | undefined) => `está sendo roubado por **${nick}**. Espere mais alguns segundos para iniciar sua ação!`,
		// Defender
		hands: "Mãos ao alto!",
		tryingToRobYou: "está tentando roubar você utilizando",
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
		beatedUp: (time: Date) => `Você tomou uma coça e ficará hospitalizado até ${showTime(time.getTime())}`,
		robFailed: "tentou lhe roubar, mas a polícia o capturou!",
		prisonUntil: (time: Date) => `Ele ficará preso até ${showTime(time.getTime())}`,
		finishedRobberyDefender: "Roubo finalizado",
		// Attacker
		robberyInProgress: "Roubo em andamento...",
		tryingToRob: "Tentando roubar",
		isReacting: "está reagindo",
		isCallingPolice: "está chamando a polícia",
		isDoingNothing: "não está fazendo nada",
		youRobbed: (formattedMoney: string, defenderNick: string) => `Você roubou ${formattedMoney} de **${defenderNick}**!`,
		beatenUp: (time: Date) => `Você detonou e ele ficará hospitalizado até ${showTime(time.getTime())}`,
		youFailed: "Você falhou na sua tentativa",
		prisonTime: (time: Date) => `Ficará preso até ${showTime(time.getTime())}`,
		finishedRobberyAttacker: (success: boolean) => `Roubo ${success ? "bem" : "mal"}-sucedido`,
	},
	[Language.Spanish]: {
		// CanRob
		sameId: "¡No puedes robarte a ti mismo, idiota!",
		withoutNick: "¡Este usuario aún no ha establecido un apodo!",
		withoutClass: "¡Este usuario aún no ha elegido una clase!",
		withoutItem: "¡No puedes robar sin un arma!",
		lowAtk: (nick: string) => `¡No puedes robar a ${nick} con tus armas actuales! ${EmoteString.Robbery}\n-# Consigue un arma mejor`,
		inJob: (jobTime: Date, jobId: JobId) => `¡No puedes robar mientras trabajas! ${EmoteString.Jobs}\n-# ¡Terminará tu trabajo de **${JobList[jobId].Description[Language.Spanish]}** ${showTime(jobTime.getTime(), true)}!`,
		inPrison: (prisonTime: Date) => `¡No puedes robar mientras estás en prisión! ${EmoteString.Prison}\n-# Será liberado ${showTime(prisonTime.getTime(), true)}!`,
		isWanted: (wantedTime: Date) => `¡No puedes robar mientras estás siendo buscado por la policía! ${EmoteString.Police}\n-# Podrá robar nuevamente ${showTime(wantedTime.getTime(), true)}!`,
		isInHospital: (hospitalTime: Date) => `¡No puedes robar mientras estás hospitalizado! ${EmoteString.Hospital}\n-# ¡Será curado ${showTime(hospitalTime.getTime(), true)}!`,
		attackerIsRobbingId: (nick: CreationOptional<string> | undefined) => `¡Ya estás robando a **${nick}**!`,
		attackerIsBeingRobbedById: (nick: CreationOptional<string> | undefined) => `¡Estás siendo robado por **${nick}**!`,
		defenderIsRobbingId: (nick: CreationOptional<string> | undefined) => `está robando a **${nick}**. ¡Espere unos segundos más para iniciar su acción!`,
		defenderIsBeingRobbedById: (nick: CreationOptional<string> | undefined) => `está siendo robado por **${nick}**. ¡Espere unos segundos más para iniciar su acción!`,
		// Defender
		hands: "¡Manos arriba!",
		tryingToRobYou: "está intentando robarte utilizando",
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
		beatedUp: (time: Date) => `Fuiste golpeado y estarás hospitalizado hasta ${showTime(time.getTime())}`,
		robFailed: "intentó robarte, ¡pero la policía lo atrapó!",
		prisonUntil: (time: Date) => `Estará en prisión hasta ${showTime(time.getTime())}`,
		finishedRobberyDefender: "Robo finalizado",
		// Attacker
		robberyInProgress: "Robo en progreso...",
		tryingToRob: "Intentando robar",
		isReacting: "está reaccionando",
		isCallingPolice: "está llamando a la policía",
		isDoingNothing: "no está haciendo nada",
		youRobbed: (formattedMoney: string, defenderNick: string) => `¡Robaste ${formattedMoney} de **${defenderNick}**!`,
		beatenUp: (time: Date) => `Lo golpeaste y estará hospitalizado hasta ${showTime(time.getTime())}`,
		youFailed: `Fallaste en tu intento`,
		prisonTime: (time: Date) => `Estará en prisión hasta ${showTime(time.getTime())}`,
		finishedRobberyAttacker: (success: boolean) => `Robo ${success ? "exitoso" : "fallido"}`,
	},
} as const;