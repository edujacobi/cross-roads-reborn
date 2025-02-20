import { User } from "./User";
import { Log } from "../utils/log";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	Message,
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

export enum RobTypes {
	User = 1,
	Location,
}

export class Robbery {
	Id = 0;
	Attacker: User;
	AttackerTimeInPrison = 0;
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

	CanRobUser() {
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
			message = `Você não pode roubar enquanto está preso! ${EmoteString.Robbery}\n-# Será solto ${showTime(this.Attacker.Prison.Time.getTime(), true)}!`;
			canRob = false;
		}

		if (this.Attacker.IsWanted()) {
			message = `Você não pode roubar enquanto está sendo procurado pela polícia! ${EmoteString.Robbery}\n-# Poderá roubar novamente ${showTime(this.Attacker.Escape.Time.getTime(), true)}!`;
			canRob = false;
		}

		return { canRob, message };
	}

	async StartRobbery(interaction: ChatInputCommandInteraction) {
		this.AttackerTimeInPrison = 10 + 1.5 * this.Attacker.Attributes.Attack;

		if (this.Defender.Attributes.Defense === 0) {
			this.Attacker.Attributes.Attack *= 1.35;
		}

		this.Attacker.Robbery.IsRobbingId = this.Defender.Id;
		await this.Attacker.Update();
		this.Defender.Robbery.IsBeingRobbedById = this.Attacker.Id;
		await this.Defender.Update();

		Log.Info(`User ${this.Attacker.Nickname} (ID: ${this.Attacker.Id}) started a robbery to user ${this.Defender.Nickname} (ID: ${this.Defender.Id}).`);

		this.Embed.Private
			.setAuthor({
				name: `Mãos ao alto!`,
				iconURL: interaction.user.avatarURL() ?? undefined,
			})
			.setDescription(`**${this.Attacker.Nickname}** está tentando roubar você! ${EmoteString.Robbery}`);

		const privateMessage = await sendComplexPrivateMessage(this.DiscordUser?.id, this.Embed.Private);

		this.Embed.Channel
			.setAuthor({
				name: `Roubo em andamento...`,
				iconURL: "https://media.discordapp.net/attachments/691019843159326757/791444366727708672/roubar_20201223201323.png",
			})
			.setDescription(`### Acerte seu alvo!`)
			.setDefaultFooter(this.Attacker.Nickname, interaction.user.avatarURL(), `Tentando roubar ${this.Defender.Nickname}`);

		await replyInteraction(interaction, {
			embeds: [this.Embed.Channel],
			components: this.CreateButtonGrid(),
		});

		await wait(20000);

		this.Attacker.Attributes.Attack -= getPercent(this.Defender.Attributes.Defense, this.Attacker.Attributes.Attack);

		this.Chance = Math.random() * 100;
		this.Success = this.Chance < this.Attacker.Attributes.Attack;

		await this.EndRobbery(interaction, privateMessage);
	}

	async EndRobbery(interaction: ChatInputCommandInteraction, privateMessage: Message | undefined) {
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

			await privateMessage.edit({ embeds: [this.Embed.Private] });
		}

		this.Attacker.Robbery.IsRobbingId = null;
		await this.Attacker.Update();
		this.Defender.Robbery.IsBeingRobbedById = null;
		await this.Defender.Update();

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

