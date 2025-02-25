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
				name: `Mãos ao alto!`,
				iconURL: interaction.user.avatarURL() ?? undefined,
			})
			.setDescription(`${ClassList[this.Attacker.Class].Image.Emote.String} **${this.Attacker.Nickname}** está tentando roubar você utilizando **${usedGun}** ${EmoteString.Robbery}

-# Decida o que fazer:
### ${EmoteString.React} **Reagir**
${EmoteString.Defense}+5 DEF, mas você ficará hospitalizado por ${this.DefenderTimeInHospital} minutos caso seja roubado
### ${EmoteString.Police} **Chamar a polícia**
${EmoteString.Defense}-5 DEF, mas ele ficará preso por ${this.AttackerAditionalTimeCallPolice} minutos caso falhe
### 🏳️ **Não fazer nada**
Nenhum efeito adicional`)
			.setFooter({ text: "Você tem 60 segundos para responder" });

		const buttoReact = new ButtonBuilder()
			.setCustomId("react")
			.setLabel("Reagir")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(EmoteId.React)
			.setDisabled(this.Defender.IsWorking() || this.Defender.IsInPrison() || this.Defender.Attributes.Attack === 0);

		const buttoPolice = new ButtonBuilder()
			.setCustomId("police")
			.setLabel("Chamar a polícia")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(EmoteId.Police)
			.setDisabled(this.Defender.Attributes.Defense < 5);

		const buttoNothing = new ButtonBuilder()
			.setCustomId("nothing")
			.setLabel("Não fazer nada")
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
				name: `Roubo em andamento...`,
				iconURL: "https://media.discordapp.net/attachments/691019843159326757/791444366727708672/roubar_20201223201323.png",
			})
			.setDefaultFooter(this.Attacker.Nickname, interaction.user.avatarURL(), `Tentando roubar ${this.Defender.Nickname}`);

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

				descriptionPrivate = `### ${EmoteString.React} Reagindo...`;
				descriptionChannel = `### ${EmoteString.React} ${this.Defender.Nickname} está reagindo!`;
				// this.Defender.Robbery.ReactedCount += 1;
			}
			else if (btn.customId === "police") {

				this.Defender.Attributes.Defense -= 5;
				this.AttackerTimeInPrison += this.AttackerAditionalTimeCallPolice;

				descriptionPrivate = `### ${EmoteString.Police} Chamando a polícia...`;
				descriptionChannel = `### ${EmoteString.Police} ${this.Defender.Nickname} está chamando a polícia!`;
				// this.Defender.Robbery.CallPoliceCount += 1;
			}
			else if (btn.customId === "nothing") {
				descriptionPrivate = `### 🏳️ Fazendo nada...`;
				descriptionChannel = `### 🏳️ ${this.Defender.Nickname} não está fazendo nada!`;
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

			this.Embed.Channel.setDescription(`Você roubou ${formatMoney(this.MoneyRobbed, this.Attacker.Language)} de **${this.Defender.Nickname}**! ${EmoteString.Robbery}`);

			this.Embed.Private.setDescription(`Você foi roubado e perdeu ${formatMoney(this.MoneyRobbed, this.Defender.Language)} pro **${this.Attacker.Nickname}**! ${EmoteString.Robbery}`);

			Log.Success(`User ${this.Attacker.Nickname} (ID: ${this.Attacker.Id}) successfully robbed user ${this.Defender.Nickname} (ID: ${this.Defender.Id}) and got ${formatMoney(this.MoneyRobbed, Language.English)}.`);
		}
		else {
			this.Attacker.Prison.Time = addMinutes(new Date(), this.AttackerTimeInPrison);
			this.Attacker.Robbery.FailureCount += 1;

			await Notification.Free(this.Attacker);

			this.Embed.Channel
				.setColor(CrColors.Police)
				.setDescription(`Você falhou na sua tentativa! ${EmoteString.Police}\n-# Ficará preso até ${showTime(this.Attacker.Prison.Time.getTime())}`);

			this.Embed.Private
				.setColor(CrColors.Police)
				.setDescription(`**${this.Attacker.Nickname}** tentou lhe roubar, mas a polícia o capturou! ${EmoteString.Police}\n-# Ele ficará preso até ${showTime(this.Attacker.Prison.Time.getTime())}!`);

			Log.Success(`User ${this.Attacker.Nickname} (ID: ${this.Attacker.Id}) failed to rob user ${this.Defender.Nickname} (ID: ${this.Defender.Id}).`);
		}

		this.Embed.Channel
			.setAuthor({
				name: `Roubo ${this.Success ? "bem" : "mal"}-sucedido`,
				iconURL: this.DiscordUser?.avatarURL() ?? undefined,
			})
			.setDefaultFooter(this.Attacker.Nickname, interaction.user.avatarURL(), formatMoney(this.Attacker.Money, this.Attacker.Language));

		await replyInteraction(interaction, { embeds: [this.Embed.Channel], components: [] });

		if (privateMessage) {
			this.Embed.Private
				.setAuthor({
					name: `Roubo finalizado`,
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

	private CreateButtonGrid() {
		const buttons = Array.from({ length: 25 }, (_, i) =>
			new ButtonBuilder()
				.setCustomId(`button_${i}`)
				.setEmoji(i === 0 ? EmoteId.Attack : EmoteId.Defense)
				.setStyle(i === 0 ? ButtonStyle.Danger : ButtonStyle.Secondary),
		);

		// Shuffle the buttons array
		for (let i = buttons.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[buttons[i], buttons[j]] = [buttons[j], buttons[i]];
		}

		const rows = Array.from({ length: 5 }, (_, i) =>
			new ActionRowBuilder<ButtonBuilder>()
				.addComponents(...buttons.slice(i * 5, i * 5 + 5)),
		);

		return rows;
	}
}

