import { User } from "./User";
import { Log } from "../utils/log";
import {
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	ComponentType,
	Message,
	MessageComponentInteraction,
	MessageFlags,
	User as DUser,
} from "discord.js";
import { getPercent, replyWithContainer, sendComplexPrivateMessage } from "../utils/logic";
import { formatMoney, showTime } from "../utils/ui";
import { CrColors } from "../utils/colors";
import { EmoteId, EmoteString } from "../utils/emotes";
import { getClient } from "../client";
import { setTimeout as wait } from "timers/promises";
import { addHours } from "date-fns/addHours";
import { Notification } from "./Notification";
import { addMinutes } from "date-fns";
import { globalStrings, Language } from "./Language";
import { RobHistories } from "../database/RobHistories";
import { Users } from "../database/Users";
import { ClassId, ClassList, getRobberyClassModifier } from "../interfaces/Classes";
import { JobId, JobList } from "../interfaces/Jobs";
import { LocationList } from "../interfaces/Locations";
import { ScavengeId, ScavengeList } from "../interfaces/Scavenge";
import { CustomContainerBuilder } from "../ui/builders/CustomContainerBuilder";

export enum ClashType {
	User = 1,
	Location,
	BeatUp,
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
	Type = ClashType.User;

	DiscordUser: DUser | undefined;

	Container = {
		Private: new CustomContainerBuilder().setAccentColor(CrColors.Robbery),
		Channel: new CustomContainerBuilder().setAccentColor(CrColors.Robbery),
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

		if (!this.Attacker.BestGun) {
			message = `${s.withoutItem} ${EmoteString.Robbery}`;
			canRob = false;
		}

		if (this.Defender.Attributes.Attack - this.Attacker.Attributes.Attack > 15) {
			message = s.lowAtk(this.Defender.GetNameWithImage());
			canRob = false;
		}

		if (this.Attacker.IsScavenging()) {
			message = s.scavengingA(this.Attacker.Scavenge.IsScavengingId!);
			canRob = false;
		}

		if (this.Defender.IsScavenging()) {
			message = s.scavengingD(this.Defender.Scavenge.IsScavengingId!);
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

		if (this.Defender.BeatUp.IsBeatingId) {
			const user = await Users.findByPk(this.Defender.BeatUp.IsBeatingId, { attributes: ["class", "nickname"] });
			message = `**${this.Defender.GetNameWithImage()}** ${globalStrings[this.Attacker.Language].defenderIsBeatingId(`${ClassList[user!.class!].Image.Emote.String} ${user!.nickname!}`)}`;
			canRob = false;
		}

		if (this.Defender.BeatUp.IsBeingBeatUpById) {
			const user = await Users.findByPk(this.Defender.BeatUp.IsBeingBeatUpById, { attributes: ["class", "nickname"] });
			message = `**${this.Defender.GetNameWithImage()}** ${globalStrings[this.Attacker.Language].defenderIsBeingBeatedById(`${ClassList[user!.class!].Image.Emote.String} ${user!.nickname!}`)}`;
			canRob = false;
		}

		if (this.Attacker.Robbery.IsRobbingId) {
			const user = await Users.findByPk(this.Attacker.Robbery.IsRobbingId, { attributes: ["class", "nickname"] });
			message = globalStrings[this.Attacker.Language].attackerIsRobbingId(`${ClassList[user!.class].Image.Emote.String} ${user!.nickname!}`);
			canRob = false;
		}

		if (this.Attacker.Robbery.IsBeingRobbedById) {
			const user = await Users.findByPk(this.Attacker.Robbery.IsBeingRobbedById, { attributes: ["class", "nickname"] });
			message = globalStrings[this.Attacker.Language].attackerIsBeingRobbedById(`${ClassList[user!.class!].Image.Emote.String} ${user!.nickname!}`);
			canRob = false;
		}

		if (this.Defender.Robbery.IsRobbingId) {
			const user = await Users.findByPk(this.Defender.Robbery.IsRobbingId, { attributes: ["class", "nickname"] });
			message = `**${this.Defender.GetNameWithImage()}** ${globalStrings[this.Attacker.Language].defenderIsRobbingId(`${ClassList[user!.class!].Image.Emote.String} ${user!.nickname!}`)}`;
			canRob = false;
		}

		if (this.Defender.Robbery.IsBeingRobbedById) {
			const user = await Users.findByPk(this.Defender.Robbery.IsBeingRobbedById, { attributes: ["class", "nickname"] });
			message = `**${this.Defender.GetNameWithImage()}** ${globalStrings[this.Attacker.Language].defenderIsBeingRobbedById(`${ClassList[user!.class!].Image.Emote.String} ${user!.nickname!}`)}`;
			canRob = false;
		}

		if (this.Attacker.Robbery.IsRobbingLocationId !== null) {
			const location = LocationList[this.Attacker.Robbery.IsRobbingLocationId];
			message = globalStrings[this.Attacker.Language].attackerIsRobbingId(location.Name[this.Attacker.Language]);
			canRob = false;
		}

		if (this.Defender.Robbery.IsRobbingLocationId !== null) {
			const location = LocationList[this.Defender.Robbery.IsRobbingLocationId];
			message = `**${this.Defender.GetNameWithImage()}** ${globalStrings[this.Attacker.Language].defenderIsRobbingId(location.Name[this.Attacker.Language])}`;
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

		if (this.Defender.Attributes.Defense <= 0) {
			this.Attacker.Attributes.Attack *= 1.35;
		}

		this.Attacker.Robbery.IsRobbingId = this.Defender.Id;
		this.Defender.Robbery.IsBeingRobbedById = this.Attacker.Id;

		await Promise.all([
			this.Attacker.Update(),
			this.Defender.Update(),
		]);

		Log.Info(`User ${this.Attacker.Nickname} (ID: ${this.Attacker.Id}) started a robbery to user ${this.Defender.Nickname} (ID: ${this.Defender.Id}).`);

		const usedGun = `${this.Attacker.GetItemSkin(this.Attacker.BestGun!)} ${this.Attacker.BestGun?.Description[this.Defender.Language]}`;

		const cannotReact = this.Defender.IsWorking() ||
			this.Defender.IsInPrison() ||
			this.Defender.IsInHospital() ||
			this.Defender.Attributes.Attack === 0;

		const cannotCallPolice = this.Defender.IsInHospital() || this.Defender.Attributes.Defense < 5;

		this.Container.Private
			.addTexts([
				`${EmoteString.Robbery} ${sD.robberyInProgress}`,
			])
			.addLargeSeparator()
			.addTexts([
				`**${this.Attacker.GetNameWithImage()}** ${sD.tryingToRobYou} **${usedGun}** • ${EmoteString.Attack}${this.Attacker.Attributes.Attack} ATK`,
				``,
				`-# ${sD.decide}:`,
			])
			.addSectionComponents(react => react
				.addTexts([
					`### ${EmoteString.React} **${sD.react}**`,
					`${sD.reactDescription(this.DefenderTimeInHospital)}`,
				])
				.setButtonAccessory(new ButtonBuilder()
					.setCustomId("react")
					.setLabel(sD.react)
					.setStyle(ButtonStyle.Secondary)
					.setEmoji(EmoteId.React)
					.setDisabled(cannotReact),
				),
			)
			.addLargeSeparator()
			.addSectionComponents(callPolice => callPolice
				.addTexts([
					`### ${EmoteString.Police} **${sD.callPolice}**`,
					`${sD.callPoliceDescription(this.AttackerAditionalTimeCallPolice)}`,
				])
				.setButtonAccessory(new ButtonBuilder()
					.setCustomId("police")
					.setLabel(sD.callPolice)
					.setStyle(ButtonStyle.Secondary)
					.setEmoji(EmoteId.Police)
					.setDisabled(cannotCallPolice),
				),
			)
			.addLargeSeparator()
			.addSectionComponents(nothing => nothing
				.addTexts([
					`### 🏳️ **${sD.doNothing}**`,
					`${sD.doNothingDescription}`,
				])
				.setButtonAccessory(new ButtonBuilder()
					.setCustomId("nothing")
					.setLabel(sD.doNothing)
					.setStyle(ButtonStyle.Secondary)
					.setEmoji("🏳️"),
				),
			)
			.addFooter({ text: sD.secondsToRespond });

		const defenderMessage = await sendComplexPrivateMessage(this.DiscordUser?.id, {
			components: [this.Container.Private],
			flags: MessageFlags.IsComponentsV2,
		});

		this.Container.Channel
			.setUser(this.Attacker)
			.addTexts([
				`${EmoteString.Robbery} ${sA.robberyInProgress}`,
			], 1)
			.addLargeSeparator()
			.addTexts([
				`${sA.tryingToRob} **${this.Defender.GetNameWithImage()}** ${EmoteString.Waiting}`,
			], 50)
			.addFooter();

		await replyWithContainer(interaction, this.Container.Channel);

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

				descriptionPrivate = `### ${EmoteString.React} ${sD.reacting} ${EmoteString.Waiting}`;
				descriptionChannel = `### ${EmoteString.React} ${this.Defender.GetNameWithImage()} ${sA.isReacting}!`;
				// this.Defender.Robbery.ReactedCount += 1;
			}
			else if (btn.customId === "police") {
				this.Defender.Attributes.Defense -= 5;
				this.AttackerTimeInPrison += this.AttackerAditionalTimeCallPolice;

				descriptionPrivate = `### ${EmoteString.Police} ${sD.callingPolice} ${EmoteString.Waiting}`;
				descriptionChannel = `### ${EmoteString.Police} ${this.Defender.GetNameWithImage()} ${sA.isCallingPolice}!`;
				// this.Defender.Robbery.CallPoliceCount += 1;
			}
			else if (btn.customId === "nothing") {
				descriptionPrivate = `### 🏳️ ${sD.doingNothing} ${EmoteString.Waiting}`;
				descriptionChannel = `### 🏳️ ${this.Defender.GetNameWithImage()} ${sA.isDoingNothing}!`;
			}

			this.Container.Private = new CustomContainerBuilder()
				.setAccentColor(CrColors.Robbery)
				.addTexts([
					`${EmoteString.Robbery} ${sD.robberyInProgress}`,
				])
				.addLargeSeparator()
				.addTexts([
					descriptionPrivate,
				])
				.addFooter({ text: sD.secondsToRespond });

			this.Container.Channel.changeTextFromSectionId(50, descriptionChannel);

			defenderMessage?.edit({
				components: [this.Container.Private],
			});

			await replyWithContainer(interaction, this.Container.Channel);
		});

		await wait(60_000);

		this.Attacker.Attributes.Attack -= getPercent(this.Defender.Attributes.Defense, this.Attacker.Attributes.Attack);

		this.Chance = Math.random() * 100;
		this.Success = this.Chance < this.Attacker.Attributes.Attack;

		await this.EndRobbery(interaction, defenderMessage);
	}

	async EndRobbery(interaction: ChatInputCommandInteraction, privateMessage: Message | undefined) {
		await Promise.all([
			this.Attacker.GetInfo(),
			this.Defender.GetInfo(),
		]);

		const sA = Strings[this.Attacker.Language];
		const sD = Strings[this.Defender.Language];

		this.Container.Private = new CustomContainerBuilder()
			.setAccentColor(CrColors.Robbery)
			.addTexts([
				`${EmoteString.Robbery} ${sD.finishedRobberyDefender}`,
			])
			.addLargeSeparator();

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

			this.Container.Private
				.addTexts([
					`### ${EmoteString.Defeat} ${sD.success}.`,
					`${sD.wereRobbed(formatMoney(this.MoneyRobbed, this.Defender.Language), this.Attacker.GetNameWithImage())}${willBeBeatenUp ? `
${sD.beatedUp(this.Defender.Hospital.Time)} ${EmoteString.Hospital}` : ""}`,
				]);

			const randomSuccessMessage = sA.successMessages[Math.floor(Math.random() * sA.successMessages.length)];
			const successMessage = randomSuccessMessage(formatMoney(this.MoneyRobbed, this.Attacker.Language), this.Defender.GetNameWithImage());

			const texts = [
				`### ${EmoteString.Victory} ${sA.success}!`,
				`${successMessage}${willBeBeatenUp ? `
${sA.beatenUp(this.Defender.Hospital.Time)} ${EmoteString.Hospital}` : ""}`,
				`-# ${sA.willBeAbleAgain} ${showTime(this.Attacker.Wanted.Time.getTime(), true)}`,
			].join("\n");

			this.Container.Channel.changeTextFromSectionId(50, texts);

			Log.Success(`User ${this.Attacker.Nickname} (ID: ${this.Attacker.Id}) successfully robbed user ${this.Defender.Nickname} (ID: ${this.Defender.Id}) and got ${formatMoney(this.MoneyRobbed, Language.English)}. ${willBeBeatenUp ? "The defender was beaten up." : ""}`);
		}
		else {
			this.Attacker.Prison.Time = addMinutes(new Date(), this.AttackerTimeInPrison);
			this.Attacker.Prison.HasPaidBribe = false;
			this.Attacker.Escape.HasTried = false;
			this.Attacker.Robbery.FailureCount += 1;
			this.Attacker.Prison.Count += 1;

			await Notification.Free(this.Attacker);

			this.Container.Private
				.addTexts([
					`### ${EmoteString.Victory} ${sD.failure}!`,
					`**${this.Attacker.GetNameWithImage()}** ${sD.robFailed} ${EmoteString.Police}
-# ${sD.prisonUntil(this.Attacker.Prison.Time)}!`,
				]);

			const randomFailureMessage = sA.failureMessages[Math.floor(Math.random() * sA.failureMessages.length)];

			const texts = [
				`### ${EmoteString.Defeat} ${sA.failure}!`,
				`${sA.youFailed}!`,
				`-# ${EmoteString.Prison} ${randomFailureMessage} ${sA.prisonTime(this.Attacker.Prison.Time)}`,
			].join("\n");

			this.Container.Channel.changeTextFromSectionId(50, texts);

			Log.Success(`User ${this.Attacker.Nickname} (ID: ${this.Attacker.Id}) failed to rob user ${this.Defender.Nickname} (ID: ${this.Defender.Id}).`);
		}

		this.Container.Channel
			.changeTextFromSectionId(1, `${EmoteString.Robbery} ${sA.finishedRobberyAttacker(this.Success)}`)
			.changeFooterText(formatMoney(this.Attacker.Money, this.Attacker.Language));

		await replyWithContainer(interaction, this.Container.Channel);

		if (privateMessage) {
			this.Container.Private
				.addFooter({
					text: formatMoney(this.Defender.Money, this.Defender.Language),
				});
			await privateMessage.edit({ components: [this.Container.Private] });
		}

		this.Attacker.Robbery.IsRobbingId = null;
		this.Defender.Robbery.IsBeingRobbedById = null;
		await Promise.all([
			this.Attacker.Update(),
			this.Defender.Update(),
		]);

		await RobHistories.CreateUserRobberyHistory(this);
	}
}

const Strings = {
	[Language.English]: {
		// CanRob
		sameId: "You can't rob yourself, idiot!",
		withoutNick: "This user hasn't set a nickname yet!",
		withoutClass: "This user hasn't choose a class yet!",
		withoutItem: "You can't rob without a weapon!",
		lowAtk: (nick: string) => `You can't rob ${nick} with your current weapons! ${EmoteString.Robbery}\n-# Get a better weapon. You need at least 15 difference!`,
		scavengingA: (placeId: ScavengeId) => `You can't rob while scavenging ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.English]}** ${EmoteString.Scavenge}`,
		scavengingD: (placeId: ScavengeId) => `is scavenging ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.English]}**. Wait a few more seconds to start your action! ${EmoteString.Scavenge}`,
		inJob: (jobTime: Date, jobId: JobId) => `You can't rob while working! ${EmoteString.Jobs}\n-# Will finish your **${JobList[jobId].Description[Language.English]}** job ${showTime(jobTime.getTime(), true)}!`,
		inPrison: (prisonTime: Date) => `You can't rob while you're in prison! ${EmoteString.Prison}\n-# Will be released ${showTime(prisonTime.getTime(), true)}!`,
		isWanted: (wantedTime: Date) => `You can't rob while you're wanted by the police! ${EmoteString.Police}\n-# Will be able to rob again ${showTime(wantedTime.getTime(), true)}!`,
		isInHospital: (hospitalTime: Date) => `You can't rob while you're hospitalized! ${EmoteString.Hospital}\n-# Will be healed ${showTime(hospitalTime.getTime(), true)}!`,
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
		robberyInProgress: `Robbery in progress`,
		tryingToRob: "Trying to rob",
		isReacting: "is reacting",
		isCallingPolice: "is calling the police",
		isDoingNothing: "is doing nothing",
		success: "Success",
		failure: "Failure",
		willBeAbleAgain: "Will be able to rob again",
		beatenUp: (time: Date) => `You beat him up and he will be hospitalized until ${showTime(time.getTime())}`,
		youFailed: "You failed in your attempt",
		prisonTime: (time: Date) => `Will be in prison until ${showTime(time.getTime())}`,
		finishedRobberyAttacker: (success: boolean) => `Robbery ${success ? "successful" : "unsuccessful"}`,
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
		// CanRob
		sameId: "Você não pode roubar a si mesmo, idiota!",
		withoutNick: "Este usuário ainda não cadastrou um nickname!",
		withoutClass: "Este usuário ainda não escolheu uma classe!",
		withoutItem: "Você não pode roubar sem uma arma!",
		lowAtk: (nick: string) => `Você não pode roubar ${nick} usando suas armas atuais! ${EmoteString.Robbery}\n-# Consiga uma arma melhor. Você precisa de no mínimo 15 de diferença!`,
		scavengingA: (placeId: ScavengeId) => `Você não pode roubar enquanto está vasculhando ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Portuguese]}** ${EmoteString.Scavenge}`,
		scavengingD: (placeId: ScavengeId) => `está vasculhando ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Portuguese]}**. Espere mais alguns segundos para iniciar sua ação! ${EmoteString.Scavenge}`,
		inJob: (jobTime: Date, jobId: JobId) => `Você não pode roubar enquanto está trabalhando! ${EmoteString.Jobs}\n-# Terminará seu trabalho de **${JobList[jobId].Description[Language.Portuguese]}** ${showTime(jobTime.getTime(), true)}!`,
		inPrison: (prisonTime: Date) => `Você não pode roubar enquanto está preso! ${EmoteString.Prison}\n-# Será solto ${showTime(prisonTime.getTime(), true)}!`,
		isWanted: (wantedTime: Date) => `Você não pode roubar enquanto está sendo procurado pela polícia! ${EmoteString.Police}\n-# Poderá roubar novamente ${showTime(wantedTime.getTime(), true)}!`,
		isInHospital: (hospitalTime: Date) => `Você não pode roubar enquanto está hospitalizado! ${EmoteString.Hospital}\n-# Será curado ${showTime(hospitalTime.getTime(), true)}!`,
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
		robberyInProgress: `Roubo em andamento`,
		tryingToRob: "Tentando roubar",
		isReacting: "está reagindo",
		isCallingPolice: "está chamando a polícia",
		isDoingNothing: "não está fazendo nada",
		success: "Sucesso",
		failure: "Falha",
		willBeAbleAgain: "Poderá roubar novamente",
		beatenUp: (time: Date) => `Você detonou e ele ficará hospitalizado até ${showTime(time.getTime())}`,
		youFailed: "Você falhou na sua tentativa",
		prisonTime: (time: Date) => `Ficará preso até ${showTime(time.getTime())}`,
		finishedRobberyAttacker: (success: boolean) => `Roubo ${success ? "bem" : "mal"}-sucedido`,
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
		// CanRob
		sameId: "¡No puedes robarte a ti mismo, idiota!",
		withoutNick: "¡Este usuario aún no ha establecido un apodo!",
		withoutClass: "¡Este usuario aún no ha elegido una clase!",
		withoutItem: "¡No puedes robar sin un arma!",
		lowAtk: (nick: string) => `¡No puedes robar a ${nick} con tus armas actuales! ${EmoteString.Robbery}\n-# Consigue un arma mejor. ¡Necesitas al menos 15 de diferencia!`,
		scavengingA: (placeId: ScavengeId) => `No puedes robar mientras estás buscando en ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Spanish]}** ${EmoteString.Scavenge}`,
		scavengingD: (placeId: ScavengeId) => `está buscando en ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Spanish]}**. ¡Espere unos segundos más para iniciar su acción! ${EmoteString.Scavenge}`,
		inJob: (jobTime: Date, jobId: JobId) => `¡No puedes robar mientras trabajas! ${EmoteString.Jobs}\n-# ¡Terminará tu trabajo de **${JobList[jobId].Description[Language.Spanish]}** ${showTime(jobTime.getTime(), true)}!`,
		inPrison: (prisonTime: Date) => `¡No puedes robar mientras estás en prisión! ${EmoteString.Prison}\n-# Será liberado ${showTime(prisonTime.getTime(), true)}!`,
		isWanted: (wantedTime: Date) => `¡No puedes robar mientras estás siendo buscado por la policía! ${EmoteString.Police}\n-# Podrá robar nuevamente ${showTime(wantedTime.getTime(), true)}!`,
		isInHospital: (hospitalTime: Date) => `¡No puedes robar mientras estás hospitalizado! ${EmoteString.Hospital}\n-# ¡Será curado ${showTime(hospitalTime.getTime(), true)}!`,
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
		robberyInProgress: `Robo en progreso`,
		tryingToRob: "Intentando robar",
		isReacting: "está reaccionando",
		isCallingPolice: "está llamando a la policía",
		isDoingNothing: "no está haciendo nada",
		success: "Éxito",
		failure: "Fracaso",
		willBeAbleAgain: "Podrás robar de nuevo",
		beatenUp: (time: Date) => `Lo golpeaste y estará hospitalizado hasta ${showTime(time.getTime())}`,
		youFailed: `Fallaste en tu intento`,
		prisonTime: (time: Date) => `Estará en prisión hasta ${showTime(time.getTime())}`,
		finishedRobberyAttacker: (success: boolean) => `Robo ${success ? "exitoso" : "fallido"}`,
		failureMessages: [
			"La policía llegó más rápido de lo que esperabas.",
			"Alguien vio tu arma, reaccionó y atrajo la atención de todos.",
			"Un transeúnte intervino y llamó a las autoridades.",
			"Escuchaste sirenas cerca y entraste en pánico.",
			"Las cámaras de seguridad captaron tu rostro, obligándote a huir.",
			"Olvidaste cargar tu arma. Error de novato.",
			"Habías robado tanto dinero que te desmayaste de alegría.",
			"Intentaste parecer rudo pero terminaste pareciendo sospechoso para un policía cercano.",
			"Un perro callejero rabioso te atacó, lo que le dio tiempo a la policía para que llegara.",
			"Al intentar escapar, tropezaste y se te cayó todo el dinero.",
		],
		successMessages: [
			(formattedMoney: string, defenderNick: string) => `¡Robaste ${formattedMoney} de **${defenderNick}**!`,
			(formattedMoney: string, defenderNick: string) => `¡Dinero fácil! Le quitaste ${formattedMoney} a **${defenderNick}**.`,
			(formattedMoney: string, defenderNick: string) => `**${defenderNick}** no tuvo ninguna oportunidad. Te escapaste con ${formattedMoney}!`,
			(formattedMoney: string, defenderNick: string) => `¡Otro atraco exitoso! Te embolsaste ${formattedMoney} de **${defenderNick}**.`,
			(formattedMoney: string, defenderNick: string) => `Ahora tienes ${formattedMoney} más, cortesía de **${defenderNick}**.`,
		],
	},
} as const;