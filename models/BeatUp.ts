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
import { replyInteraction, sendComplexPrivateMessage } from "../utils/logic";
import { formatMoney, showTime } from "../utils/ui";
import { CrColors } from "../utils/colors";
import { EmoteString } from "../utils/emotes";
import { CustomEmbedBuilder } from "./CustomEmbedBuilder";
import { getClient } from "../client";
import { setTimeout as wait } from "timers/promises";
import { Notification } from "./Notification";
import { addMinutes } from "date-fns";
import { globalStrings, Language } from "./Language";
import { RobHistories } from "../database/RobHistories";
import { Users } from "../database/Users";
import { ClassId, ClassList } from "../interfaces/Classes";
import { JobId, JobList } from "../interfaces/Jobs";
import { LocationList } from "../interfaces/Locations";
import { ScavengeId, ScavengeList } from "../interfaces/Scavenge";
import { BundleId } from "../interfaces/Ids";

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

	DiscordUser: DUser | undefined;

	Embed = {
		Private: new CustomEmbedBuilder().setColor(CrColors.BeatUp),
		Channel: new CustomEmbedBuilder().setColor(CrColors.BeatUp),
	};

	constructor(attacker: User, defender: User) {
		this.Attacker = attacker;
		this.Defender = defender;
		this.Date = new Date();
		this.Attacker.GetAttributes(true);
		this.Defender.GetAttributes(true);
	}

	async GetDiscordUser() {
		const client = getClient();
		this.DiscordUser = await client.users.fetch(this.Defender.Id);
	}

	async CanBeatUser() {
		const s = Strings[this.Attacker.Language];
		let canBeat = true;
		let message = "";

		if (this.Defender.Id === this.Attacker.Id) {
			message = s.sameId;
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

		if (this.Attacker.Attributes.Attack == 0) {
			message = s.withoutItem;
			canBeat = false;
		}

		if (this.Defender.Attributes.Attack - this.Attacker.Attributes.Attack > 15) {
			message = s.lowAtk(this.Defender.GetNameWithImage());
			canBeat = false;
		}

		if (this.Attacker.IsScavenging()) {
			message = s.scavengingA(this.Attacker.Scavenge.IsScavengingId!);
			canBeat = false;
		}

		if (this.Defender.IsScavenging()) {
			message = `**${this.Defender.GetNameWithImage()}** ${s.scavengingD(this.Defender.Scavenge.IsScavengingId!)}`;
			canBeat = false;
		}

		if (this.Attacker.IsWorking()) {
			message = s.inJobA(this.Attacker.Job.EndsIn, this.Attacker.Job.Id!);
			canBeat = false;
		}

		if (this.Defender.IsWorking()) {
			message = `**${this.Defender.GetNameWithImage()}** ${s.inJobD(this.Defender.Job.EndsIn, this.Defender.Job.Id!)}`;
			canBeat = false;
		}

		if (this.Attacker.IsInPrison() && !this.Defender.IsInPrison()) {
			message = s.inPrison(this.Attacker.Prison.Time);
			canBeat = false;
		}

		if (this.Defender.IsInPrison() && !this.Attacker.IsInPrison()) {
			message = `**${this.Defender.GetNameWithImage()}** ${s.inPrisonDefender(this.Defender.Prison.Time)}`;
			canBeat = false;
		}

		if (this.Attacker.IsWanted()) {
			message = s.isWanted(this.Attacker.Wanted.Time);
			canBeat = false;
		}

		if (this.Attacker.IsInHospital()) {
			message = s.isInHospital(this.Attacker.Hospital.Time);
			canBeat = false;
		}

		if (this.Defender.IsInHospital()) {
			message = s.isInHospitalDefender(this.Defender.GetNameWithImage(), this.Defender.Hospital.Time);
			canBeat = false;
		}

		if (this.Attacker.BeatUp.Time > new Date()) {
			message = s.isWaitingBeat(this.Attacker.BeatUp.Time);
			canBeat = false;
		}

		if (this.Attacker.BeatUp.IsBeatingId) {
			const user = await Users.findByPk(this.Attacker.BeatUp.IsBeatingId, { attributes: ["class", "nickname"] });
			message = globalStrings[this.Attacker.Language].attackerIsBeatingId(`${ClassList[user!.class].Image.Emote.String} ${user!.nickname!}`);
			canBeat = false;
		}

		if (this.Attacker.BeatUp.IsBeingBeatUpById) {
			const user = await Users.findByPk(this.Attacker.BeatUp.IsBeingBeatUpById, { attributes: ["class", "nickname"] });
			message = globalStrings[this.Attacker.Language].attackerIsBeingBeatedById(`${ClassList[user!.class!].Image.Emote.String} ${user!.nickname!}`);
			canBeat = false;
		}

		if (this.Defender.BeatUp.IsBeatingId) {
			const user = await Users.findByPk(this.Defender.BeatUp.IsBeatingId, { attributes: ["class", "nickname"] });
			message = `**${this.Defender.GetNameWithImage()}** ${globalStrings[this.Attacker.Language].defenderIsBeatingId(`${ClassList[user!.class!].Image.Emote.String} ${user!.nickname!}`)}`;
			canBeat = false;
		}

		if (this.Defender.BeatUp.IsBeingBeatUpById) {
			const user = await Users.findByPk(this.Defender.BeatUp.IsBeingBeatUpById, { attributes: ["class", "nickname"] });
			message = `**${this.Defender.GetNameWithImage()}** ${globalStrings[this.Attacker.Language].defenderIsBeingBeatedById(`${ClassList[user!.class!].Image.Emote.String} ${user!.nickname!}`)}`;
			canBeat = false;
		}

		if (this.Attacker.Robbery.IsRobbingId) {
			const user = await Users.findByPk(this.Attacker.Robbery.IsRobbingId, { attributes: ["class", "nickname"] });
			message = globalStrings[this.Attacker.Language].attackerIsRobbingId(`${ClassList[user!.class].Image.Emote.String} ${user!.nickname!}`);
			canBeat = false;
		}

		if (this.Attacker.Robbery.IsBeingRobbedById) {
			const user = await Users.findByPk(this.Attacker.Robbery.IsBeingRobbedById, { attributes: ["class", "nickname"] });
			message = globalStrings[this.Attacker.Language].attackerIsBeingRobbedById(`${ClassList[user!.class!].Image.Emote.String} ${user!.nickname!}`);
			canBeat = false;
		}

		if (this.Defender.Robbery.IsRobbingId) {
			const user = await Users.findByPk(this.Defender.Robbery.IsRobbingId, { attributes: ["class", "nickname"] });
			message = `**${this.Defender.GetNameWithImage()}** ${globalStrings[this.Attacker.Language].defenderIsRobbingId(`${ClassList[user!.class!].Image.Emote.String} ${user!.nickname!}`)}`;
			canBeat = false;
		}

		if (this.Defender.Robbery.IsBeingRobbedById) {
			const user = await Users.findByPk(this.Defender.Robbery.IsBeingRobbedById, { attributes: ["class", "nickname"] });
			message = `**${this.Defender.GetNameWithImage()}** ${globalStrings[this.Attacker.Language].defenderIsBeingRobbedById(`${ClassList[user!.class!].Image.Emote.String} ${user!.nickname!}`)}`;
			canBeat = false;
		}

		if (this.Attacker.Robbery.IsRobbingLocationId !== null) {
			const location = LocationList[this.Attacker.Robbery.IsRobbingLocationId];
			message = globalStrings[this.Attacker.Language].attackerIsRobbingId(location.Description[this.Attacker.Language]);
			canBeat = false;
		}

		if (this.Defender.Robbery.IsRobbingLocationId !== null) {
			const location = LocationList[this.Defender.Robbery.IsRobbingLocationId];
			message = `**${this.Defender.GetNameWithImage()}** ${globalStrings[this.Attacker.Language].defenderIsRobbingId(location.Description[this.Attacker.Language])}`;
			canBeat = false;
		}

		if (this.Attacker.IsEscaping()) {
			message = s.isEscapingA;
			canBeat = false;
		}

		if (this.Defender.IsEscaping()) {
			message = `**${this.Defender.GetNameWithImage()}** ${s.isEscapingD}`;
			canBeat = false;
		}

		return { canBeat, message };
	}

	async StartBeating(interaction: ChatInputCommandInteraction) {
		const sA = Strings[this.Attacker.Language];
		const sD = Strings[this.Defender.Language];

		this.TimeInHospital = {
			Base: 45 + this.Defender.Attributes.Attack,
			Aditional: 5 + this.Defender.Attributes.Attack,
		};

		if (this.Defender.Attributes.Defense === 0) {
			this.Attacker.Attributes.Attack *= 1.35;
		}

		this.Attacker.BeatUp.IsBeatingId = this.Defender.Id;
		this.Defender.BeatUp.IsBeingBeatUpById = this.Attacker.Id;
		await Promise.all([this.Attacker.Update(), this.Defender.Update()]);

		Log.Info(`User ${this.Attacker.Nickname} (ID: ${this.Attacker.Id}) started beating up user ${this.Defender.Nickname} (ID: ${this.Defender.Id}).`);

		const usedGun = `${this.Attacker.BestGun?.Skin[BundleId.Default].String} ${this.Attacker.BestGun?.Description[this.Defender.Language]}`;

		this.Embed.Private
			.setAuthor({
				name: sD.hands,
				iconURL: interaction.user.avatarURL() ?? undefined,
			})
			.setDescription(`**${this.Attacker.GetNameWithImage()}** ${sD.tryingToBeatYou} **${usedGun}** ${EmoteString.Beat}

-# ${sD.decide}:
### 💪 **${sD.fight}**
${sD.fightDescription(this.TimeInHospital.Aditional)}
### 👟 **${sD.run}**
${sD.runDescription(this.TimeInHospital.Aditional)}
### 🏳️ **${sD.doNothing}**
${sD.doNothingDescription}`)
			.setFooter({ text: sD.secondsToRespond });

		const buttonFight = new ButtonBuilder()
			.setCustomId("fight")
			.setLabel(sD.fight)
			.setStyle(ButtonStyle.Secondary)
			.setEmoji("💪");

		const buttonRun = new ButtonBuilder()
			.setCustomId("run")
			.setLabel(sD.run)
			.setStyle(ButtonStyle.Secondary)
			.setEmoji("👟")
			.setDisabled(this.Defender.Attributes.Attack < 5);

		const buttonNothing = new ButtonBuilder()
			.setCustomId("nothing")
			.setLabel(sD.doNothing)
			.setStyle(ButtonStyle.Secondary)
			.setEmoji("🏳️");

		const defenderRow = new ActionRowBuilder<ButtonBuilder>()
			.addComponents([buttonFight, buttonRun, buttonNothing]);

		const defenderMessage = await sendComplexPrivateMessage(this.DiscordUser?.id, {
			embeds: [this.Embed.Private],
			components: [defenderRow],
		});

		this.Embed.Channel
			.setAuthor({
				name: sA.beatingInProgress,
				iconURL: "https://cdn.discordapp.com/attachments/691019843159326757/820064474995621938/Espancar_20210312194139.png",
			})
			.setUserFooter({
				nickname: this.Attacker.Nickname,
				image: interaction.user.avatarURL(),
				text: `${sA.tryingToBeatUp} ${this.Defender.Nickname}`,
			});

		await replyInteraction(interaction, {
			embeds: [this.Embed.Channel],
		});

		const collectorPrivate = defenderMessage?.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === this.Defender.Id,
			max: 1,
			componentType: ComponentType.Button,
			time: 45_000,
		});

		collectorPrivate?.on("collect", async btn => {
			let descriptionPrivate = "";
			let descriptionChannel = "";

			collectorPrivate?.stop();

			if (btn.customId === "fight") {
				this.Defender.Attributes.Attack += 5;
				this.TimeInHospital.Base += this.TimeInHospital.Aditional;

				descriptionPrivate = `### 💪 ${sD.fighting}...`;
				descriptionChannel = `### 💪 ${this.Defender.GetNameWithImage()} ${sA.isFighting}!`;
			}
			else if (btn.customId === "run") {

				this.Defender.Attributes.Attack -= 5;
				this.TimeInHospital.Base -= this.TimeInHospital.Aditional;

				descriptionPrivate = `### 👟 ${sD.running}...`;
				descriptionChannel = `### 👟 ${this.Defender.GetNameWithImage()} ${sA.isRunning}!`;
			}
			else if (btn.customId === "nothing") {
				descriptionPrivate = `### 🏳️ ${sD.doingNothing}...`;
				descriptionChannel = `### 🏳️ ${this.Defender.GetNameWithImage()} ${sA.isDoingNothing}!`;
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

		await wait(45_000);

		const attackerChance = Math.random() * this.Attacker.Attributes.Attack;
		const defenderChance = Math.random() * this.Defender.Attributes.Attack;

		this.Success = attackerChance > defenderChance;

		await this.EndBeating(interaction, defenderMessage);
	}

	async EndBeating(interaction: ChatInputCommandInteraction, privateMessage: Message | undefined) {
		await Promise.all([this.Attacker.GetInfo(), this.Defender.GetInfo()]);

		const sA = Strings[this.Attacker.Language];
		const sD = Strings[this.Defender.Language];

		if (this.Success) {

			this.Attacker.BeatUp.SuccessCount += 1;
			this.Defender.BeatUp.BeatedUpCount += 1;

			this.Attacker.BeatUp.Time = addMinutes(new Date(), 60);
			this.Attacker.Wanted.Time = addMinutes(new Date(), 60);
			this.Attacker.Wanted.Count += 1;

			this.Defender.Hospital.Time = addMinutes(new Date(), this.TimeInHospital.Base);
			this.Defender.Hospital.Count += 1;

			await Notification.Hospital(this.Defender);

			await Notification.BeatAgain(this.Attacker);

			this.Embed.Channel
				.setDescription(sA.youBeated(this.Defender.Nickname, this.Defender.Hospital.Time));

			this.Embed.Private
				.setDescription(sD.wereBeated(this.Attacker.Nickname, this.Defender.Hospital.Time));

			// Log.Success(`User ${this.Attacker.Nickname} (ID: ${this.Attacker.Id}) successfully robbed user ${this.Defender.Nickname} (ID: ${this.Defender.Id}) and got ${formatMoney(this.MoneyRobbed, Language.English)}. ${willBeBeatenUp ? "The defender was beaten up." : ""}`);
		}
		else {
			this.Attacker.BeatUp.BeatedUpCount += 1;
			this.Attacker.BeatUp.FailureCount += 1;
			this.Defender.BeatUp.SuccessCount += 1;

			this.Attacker.Hospital.Count += 1;
			this.Attacker.Hospital.Time = addMinutes(new Date(), this.TimeInHospital.Base);
			this.Attacker.BeatUp.Time = addMinutes(new Date(), 60);

			await Notification.Hospital(this.Attacker);

			await Notification.BeatAgain(this.Attacker);

			this.Embed.Channel
				.setColor(CrColors.BeatUp)
				.setDescription(sA.youFailed(this.Attacker.Hospital.Time));

			this.Embed.Private
				.setColor(CrColors.BeatUp)
				.setDescription(sD.youBeated(this.Attacker.GetNameWithImage(), this.Attacker.Hospital.Time));

			Log.Success(`User ${this.Attacker.Nickname} (ID: ${this.Attacker.Id}) failed to beat user ${this.Defender.Nickname} (ID: ${this.Defender.Id}).`);
		}

		this.Embed.Channel
			.setAuthor({
				name: sA.finishedBeatUpAttacker(this.Success),
				iconURL: this.DiscordUser?.avatarURL() ?? undefined,
			})
			.setUserFooter({
				nickname: this.Attacker.Nickname,
				image: interaction.user.avatarURL(),
				text: formatMoney(this.Attacker.Money, this.Attacker.Language),
			});

		await replyInteraction(interaction, { embeds: [this.Embed.Channel], components: [] });

		if (privateMessage) {
			this.Embed.Private
				.setAuthor({
					name: sD.finishedBeatUpDefender,
					iconURL: interaction.user.avatarURL() ?? undefined,
				})
				.setFooter({ text: formatMoney(this.Defender.Money, this.Defender.Language) });

			await privateMessage.edit({ embeds: [this.Embed.Private], components: [] });
		}

		this.Attacker.BeatUp.IsBeatingId = null;
		this.Defender.BeatUp.IsBeingBeatUpById = null;
		await Promise.all([this.Attacker.Update(), this.Defender.Update()]);

		await RobHistories.CreateUserBeatUpHistory(this);
	}
}

const Strings = {
	[Language.English]: {
		// CanBeat
		sameId: `You can't beat yourself up, idiot! ${EmoteString.Beat}`,
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
		// Defender
		hands: "I'll break your face!",
		tryingToBeatYou: "is trying to beat you up using",
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
		wereBeated: (attackerNick: string, time: Date) => `You were beaten up by **${attackerNick}** and will stay in the hospital! ${EmoteString.Beat}\n-# Will be healed ${showTime(time.getTime(), true)}!`,
		finishedBeatUpDefender: "Beating finished",
		// Attacker
		beatingInProgress: "Beating in progress...",
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

			return `You ${word} **${defenderNick}**! ${EmoteString.Beat}\n-# They will stay in the hospital until ${showTime(time.getTime())}`;
		},
		youFailed: (time: Date) => `You tried, but you were the one beaten up! ${EmoteString.Beat}\n-# Will stay in the hospital until ${showTime(time.getTime())}`,
		finishedBeatUpAttacker: (success: boolean) => `Beating ${success ? "successful" : "unsuccessful"}`,
	},
	[Language.Portuguese]: {
		// CanBeat
		sameId: `Você não pode espancar a si mesmo, idiota! ${EmoteString.Beat}`,
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
		// Defender
		hands: "Vou quebrar a tura cara!",
		tryingToBeatYou: "está tentando espancar você utilizando",
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
		wereBeated: (attackerNick: string, time: Date) => `Você foi espancado por **${attackerNick}** e ficará hospitalizado! ${EmoteString.Beat}\n-# Será curado ${showTime(time.getTime(), true)}!`,
		finishedBeatUpDefender: "Espancamento finalizado",
		// Attacker
		beatingInProgress: "Espancamento em andamento...",
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

			return `Você ${word} **${defenderNick}**! ${EmoteString.Beat}\n-# Ele ficará hospitalizado até ${showTime(time.getTime())}`;
		},
		youFailed: (time: Date) => `Você até tentou, mas o espancado foi você! ${EmoteString.Beat}\n-# Ficará hospitalizado até ${showTime(time.getTime())}`,
		finishedBeatUpAttacker: (success: boolean) => `Espancamento ${success ? "bem" : "mal"}-sucedido`,
	},
	[Language.Spanish]: {
		// CanBeat
		sameId: `¡No puedes golpearte a ti mismo, idiota! ${EmoteString.Beat}`,
		withoutNick: `¡Este usuario no ha configurado un apodo todavía! ${EmoteString.Beat}`,
		withoutClass: `¡Este usuario no ha elegido una clase todavía! ${EmoteString.Beat}`,
		withoutItem: `¡No puedes golpear a alguien sin un arma! ${EmoteString.Beat}`,
		lowAtk: (nick: string) => `¡No puedes golpear a ${nick} usando tus armas actuales! ${EmoteString.Beat}\n-# Consigue un arma mejor. ¡Necesitas al menos 15 de diferencia!`,
		scavengingA: (placeId: ScavengeId) => `¡No puedes golpear a alguien mientras buscas en ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Spanish]}** ${EmoteString.Scavenge}`,
		scavengingD: (placeId: ScavengeId) => `está buscando en ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Spanish]}**. ¡Espera unos segundos más para iniciar tu acción! ${EmoteString.Scavenge}`,
		inJobA: (jobTime: Date, jobId: JobId) => `¡No puedes golpear a alguien mientras trabajas! ${EmoteString.Jobs}\n-# Terminarás tu trabajo de **${JobList[jobId].Description[Language.Spanish]}** ${showTime(jobTime.getTime(), true)}!`,
		inJobD: (jobTime: Date, jobId: JobId) => `Juan está trabajando. No podrás golpearlo! ${EmoteString.Jobs}\n-# Terminarás el trabajo de **${JobList[jobId].Description[Language.Spanish]}** ${showTime(jobTime.getTime(), true)}!`,
		inPrison: (prisonTime: Date) => `¡No puedes golpear a alguien mientras estás en prisión! ${EmoteString.Prison}\n-# Serás liberado ${showTime(prisonTime.getTime(), true)}!`,
		inPrisonDefender: (prisonTime: Date) => `está en prisión y será liberado ${showTime(prisonTime.getTime(), true)} ${EmoteString.Prison}\n-# Podrás golpearlo si tú también estás en prisión.`,
		isWanted: (wantedTime: Date) => `¡No puedes golpear a alguien mientras eres buscado por la policía! ${EmoteString.Police}\n-# Podrás golpear a alguien de nuevo ${showTime(wantedTime.getTime(), true)}!`,
		isInHospital: (hospitalTime: Date) => `¡No puedes golpear a alguien mientras estás hospitalizado! ${EmoteString.Hospital}\n-# Serás curado ${showTime(hospitalTime.getTime(), true)}!`,
		isInHospitalDefender: (nickname: string, hospitalTime: Date) => `¡No puedes golpear a alguien que está hospitalizado! ${EmoteString.Hospital}\n-# **${nickname}** serás curado ${showTime(hospitalTime.getTime(), true)}!`,
		isWaitingBeat: (beatTime: Date) => `Puedes golpear de nuevo ${showTime(beatTime.getTime(), true)} ${EmoteString.Beat}`,
		isEscapingA: `¡Estás intentando escapar de la prisión y no puedes golpear! ${EmoteString.Escape}\n-# "¡Enfócate!"`,
		isEscapingD: `está intentando escapar de la prisión y no puede ser golpeado. ${EmoteString.Escape}`,
		// Defender
		hands: "¡Te voy a romper la cara!",
		tryingToBeatYou: "está intentando golpearte usando",
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
		wereBeated: (attackerNick: string, time: Date) => `¡Fuiste golpeado por **${attackerNick}** y permanecerás en el hospital! ${EmoteString.Beat}\n-# Serás curado ${showTime(time.getTime(), true)}!`,
		finishedBeatUpDefender: "Golpiza terminada",
		// Attacker
		beatingInProgress: "Golpiza en progreso...",
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

			return `¡${word} **${defenderNick}**! ${EmoteString.Beat}\n-# Permanecerá en el hospital hasta ${showTime(time.getTime())}`;
		},
		youFailed: (time: Date) => `¡Lo intentaste, pero tú fuiste el golpeado! ${EmoteString.Beat}\n-# Permanecerás en el hospital hasta ${showTime(time.getTime())}`,
		finishedBeatUpAttacker: (success: boolean) => `Golpiza ${success ? "exitosa" : "fallida"}`,
	},
} as const;