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
import { ClassList } from "./Class";

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

		(async () => {
			this.DiscordUser = await this.GetDiscordUser().then(user => user);
		})();
	}

	private async GetDiscordUser() {
		const client = getClient();
		return await client.users.fetch(this.Defender.Id);
	}

	async CanRobUser() {
		let canRob = true;
		let message = "";

		if (this.Defender.Id === this.Attacker.Id) {
			message = `Você não pode roubar a si mesmo, idiota! ${EmoteString.Robbery}`;
			canRob = false;
		}

		if (!this.Defender.Nickname) {
			message = `Este usuário ainda não cadastrou um nickname! ${EmoteString.Robbery}`;
			canRob = false;
		}

		if (this.Attacker.Attributes.Attack == 0) {
			message = `Você não pode roubar sem uma arma! ${EmoteString.Robbery}`;
			canRob = false;
		}

		if (this.Defender.Attributes.Attack - this.Attacker.Attributes.Attack > 15) {
			message = `Você não pode roubar ${this.Defender.Nickname} usando suas armas atuais! ${EmoteString.Robbery}\n-# Consiga uma arma melhor`;
			canRob = false;
		}

		if (this.Attacker.IsInPrison()) {
			message = `Você não pode roubar enquanto está preso! ${EmoteString.Prison}\n-# Será solto ${showTime(this.Attacker.Prison.Time.getTime(), true)}!`;
			canRob = false;
		}

		if (this.Attacker.IsWanted()) {
			message = `Você não pode roubar enquanto está sendo procurado pela polícia! ${EmoteString.Police}\n-# Poderá roubar novamente ${showTime(this.Attacker.Escape.Time.getTime(), true)}!`;
			canRob = false;
		}

		if (this.Attacker.Robbery.IsRobbingId) {
			const user = await Users.findByPk(this.Attacker.Robbery.IsRobbingId);
			message = `Você já está roubando **${user?.nickname}**! ${EmoteString.Robbery}`;
			canRob = false;
		}

		if (this.Attacker.Robbery.IsBeingRobbedById) {
			const user = await Users.findByPk(this.Attacker.Robbery.IsBeingRobbedById);
			message = `Você está sendo roubado por **${user?.nickname}**! ${EmoteString.Robbery}`;
			canRob = false;
		}

		if (this.Defender.Robbery.IsRobbingId) {
			const user = await Users.findByPk(this.Defender.Robbery.IsRobbingId);
			message = `**${this.Defender.Nickname}** está roubando **${user?.nickname}**. Espere mais alguns segundos para iniciar sua ação! ${EmoteString.Robbery}`;
			canRob = false;
		}

		if (this.Defender.Robbery.IsBeingRobbedById) {
			const user = await Users.findByPk(this.Defender.Robbery.IsBeingRobbedById);
			message = `**${this.Defender.Nickname}** está sendo roubado por **${user?.nickname}**. Espere mais alguns segundos para iniciar sua ação! ${EmoteString.Robbery}`;
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

		const buttoReact = new ButtonBuilder()
			.setCustomId("react")
			.setLabel(sD.react)
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(EmoteId.React)
			.setDisabled(this.Defender.IsWorking() || this.Defender.IsInPrison() || this.Defender.Attributes.Attack === 0);

		const buttoPolice = new ButtonBuilder()
			.setCustomId("police")
			.setLabel(sD.callPolice)
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(EmoteId.Police)
			.setDisabled(this.Defender.Attributes.Defense < 5);

		const buttoNothing = new ButtonBuilder()
			.setCustomId("nothing")
			.setLabel(sD.doNothing)
			.setStyle(ButtonStyle.Secondary)
			.setEmoji("🏳️");

		const defenderRow = new ActionRowBuilder<ButtonBuilder>()
			.addComponents([buttoReact, buttoPolice, buttoNothing]);

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
			this.Attacker.Escape.Time = addHours(new Date(), 1);

			this.Defender.Money -= this.MoneyRobbed;
			this.Defender.Robbery.BeingRobbedCount += 1;
			this.Defender.Robbery.BeingRobbedSum += this.MoneyRobbed;

			await Notification.RobAgain(this.Attacker);

			this.Embed.Channel.setDescription(`${sA.youRobbed(formatMoney(this.MoneyRobbed, this.Attacker.Language), this.Defender.Nickname)} ${EmoteString.Robbery}`);

			this.Embed.Private.setDescription(`${sD.wereRobbed(formatMoney(this.MoneyRobbed, this.Defender.Language), this.Attacker.Nickname)} ${EmoteString.Robbery}`);

			Log.Success(`User ${this.Attacker.Nickname} (ID: ${this.Attacker.Id}) successfully robbed user ${this.Defender.Nickname} (ID: ${this.Defender.Id}) and got ${formatMoney(this.MoneyRobbed, Language.English)}.`);
		}
		else {
			this.Attacker.Prison.Time = addMinutes(new Date(), this.AttackerTimeInPrison);
			this.Attacker.Robbery.FailureCount += 1;

			await Notification.Free(this.Attacker);

			this.Embed.Channel
				.setColor(CrColors.Police)
				.setDescription(`${sA.youFailed}! ${EmoteString.Police}\n-# ${sA.prisonTime(this.Attacker.Prison.Time)}`);

			this.Embed.Private
				.setColor(CrColors.Police)
				.setDescription(`**${this.Attacker.Nickname}** ${sD.robFailed}! ${EmoteString.Police}\n-# ${sD.prisonUntil(this.Attacker.Prison.Time)}!`);

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

		await RobHistories.CreateHistory(this);
	}
}

const Strings = {
	[Language.English]: {
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
		youFailed: "You failed in your attempt",
		prisonTime: (time: Date) => `Will be in prison until ${showTime(time.getTime())}`,
		finishedRobberyAttacker: (success: boolean) => `Robbery ${success ? "successful" : "unsuccessful"}`,
	},
	[Language.Portuguese]: {
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
		youFailed: "Você falhou na sua tentativa",
		prisonTime: (time: Date) => `Ficará preso até ${showTime(time.getTime())}`,
		finishedRobberyAttacker: (success: boolean) => `Roubo ${success ? "bem" : "mal"}-sucedido`,
	},
	[Language.Spanish]: {
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
		youFailed: `Fallaste en tu intento`,
		prisonTime: (time: Date) => `Estará en prisión hasta ${showTime(time.getTime())}`,
		finishedRobberyAttacker: (success: boolean) => `Robo ${success ? "exitoso" : "fallido"}`,
	},
};