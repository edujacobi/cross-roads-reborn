import { Users } from "../database/Users";
import { Log } from "../utils/log";
import { addDays, addMinutes, differenceInHours } from "date-fns";
import { Language } from "./Language";
import { UserItems } from "../database/UserItems";
import { addHours } from "date-fns/addHours";
import { Op } from "sequelize";
import { Item, ItemList, ItemType, UserItem } from "./Item";
import { JobId, JobList } from "./Job";
import { Notification, NotificationType } from "./Notification";
import { defaultEmbed, formatDate, formatMoney, showTime } from "../utils/ui";
import { EmoteString } from "../utils/emotes";
import { ChatInputCommandInteraction } from "discord.js";
import { replyInteraction, sendComplexPrivateMessage } from "../utils/logic";
import { CustomEmbedBuilder } from "./CustomEmbedBuilder";
import { getClient } from "../client";
import { setTimeout as wait } from "timers/promises";
import { CrColors } from "../utils/colors";

export class User {
	Id: string = "";
	CreatedAt: Date;
	UpdatedAt: Date;
	VipTime: Date | null = null;
	VipEternal = false;
	Language: Language;
	Nickname: string = "";
	Money = 0;
	Daily: {
		CurrentStreak: number,
		MaxStreak: number,
		LastReceived: Date | null,
	};
	Job: {
		Id: JobId | null,
		EndsIn: Date,
	};
	Robbery: {
		IsRobbingId: string | null,
		IsBeingRobbedById: string | null,
	};
	BeatUp: {
		IsBeatingId: string | null,
		IsBeingBeatUpById: string | null,
	};
	Timers: {
		Prison: Date,
		Escape: Date,
	};
	Attributes: {
		Attack: number,
		Defense: number,
		MoneyAttack: number,
		MoneyDefense: number,
	};
	Situation: {
		Simple: string,
		Complex: string,
	};

	constructor(id: string) {
		const now = new Date();
		this.Id = id;
		this.CreatedAt = now;
		this.UpdatedAt = now;
		this.Language = Language.English;
		this.Daily = {
			CurrentStreak: 0,
			MaxStreak: 0,
			LastReceived: null,
		};
		this.Job = {
			Id: null,
			EndsIn: now,
		};
		this.Robbery = {
			IsRobbingId: null,
			IsBeingRobbedById: null,
		};
		this.BeatUp = {
			IsBeatingId: null,
			IsBeingBeatUpById: null,
		};
		this.Timers = {
			Prison: now,
			Escape: now,
		};
		this.Attributes = {
			Attack: 0,
			Defense: 0,
			MoneyAttack: 0,
			MoneyDefense: 0,
		};
		this.Situation = {
			Simple: "",
			Complex: "",
		};
	}

	async Create() {
		try {
			await Users.create({
				id: this.Id,
				language: this.Language,
				nickname: this.Nickname,
				money: this.Money,
				dailyStreak: this.Daily.CurrentStreak,
				maxDailyStreak: this.Daily.MaxStreak,
				lastDailyReceived: this.Daily.LastReceived,
			});
			Log.Success(`User ${this.Id} created.`);

		}
		catch (err) {
			//
		}
	}

	async GetInfo() {

		const user = await Users.findOne({
			where: {
				id: this.Id,
			},
		});

		if (!user) {
			return;
		}

		this.Id = user.id;
		this.CreatedAt = user.createdAt;
		this.UpdatedAt = user.updatedAt;
		this.VipTime = user.vipTime;
		this.VipEternal = user.vipEternal;
		this.Language = user.language;
		this.Nickname = user.nickname;
		this.Money = user.money;
		this.Job.Id = user.jobId;
		this.Job.EndsIn = new Date(user.jobTime);
		this.Timers.Prison = new Date(user.prisonTime);
		this.Timers.Escape = new Date(user.escapeTime);
		this.Daily.CurrentStreak = user.dailyStreak;
		this.Daily.MaxStreak = user.maxDailyStreak;
		this.Daily.LastReceived = user.lastDailyReceived;

		if (user.robbingUserId) {
			this.Robbery.IsRobbingId = user.robbingUserId;
		}
		if (user.beingRobbedByUserId) {
			this.Robbery.IsBeingRobbedById = user.beingRobbedByUserId;
		}

		await this.GetAttributes();
		this.GetSituation();

		return this;
	}

	async SetNickname(nickname: string) {
		this.Nickname = nickname;
		await this.Update();
	}

	IsVip() {
		if (this.VipEternal) {
			return true;
		}

		if (this.VipTime == null) {
			return false;
		}

		return this.VipTime > new Date();
	}

	async AddVip(days: number) {
		if (this.VipTime == null || this.VipTime < new Date()) {
			this.VipTime = new Date();
		}

		this.VipTime = addDays(this.VipTime, days);
		await this.Update();
	}

	async SetEternalVip() {
		this.VipEternal = !this.VipEternal;
		await this.Update();
	}

	CanReceiveDaily() {
		const today = new Date();

		return this.Daily.LastReceived == null || differenceInHours(today, this.Daily.LastReceived) > 23;
	}

	async ReceiveDaily() {
		const today = new Date();

		if (this.Daily.LastReceived != null && differenceInHours(today, this.Daily.LastReceived) > 48) {
			this.Daily.CurrentStreak = 0;
		}

		this.Daily.LastReceived = today;
		this.Daily.CurrentStreak += 1;

		if (this.Daily.CurrentStreak > this.Daily.MaxStreak) {
			this.Daily.MaxStreak = this.Daily.CurrentStreak;
		}

		const streakMultiplier = this.Daily.CurrentStreak <= 7 ? this.Daily.CurrentStreak : 7;

		const baseValue = this.IsVip() ? 300 : 200;

		const MULTIPLIER_REMOVE = 50000;

		const money = baseValue * streakMultiplier * MULTIPLIER_REMOVE;

		this.Money += money;

		await this.Update();

		await Notification.Daily(this);

		return money;
	}

	// Maybe change to "CanDoAction"
	CanBuySomething() {
		// TODO Verify if he is in a fight, in prison, in hospital, etc etc
		if (this.Money <= 0) {
			return false;
		}

		if (this.Robbery.IsRobbingId || this.Robbery.IsBeingRobbedById) {
			return false;
		}

		if (this.Timers.Prison > new Date()) {
			return false;
		}

		return true;
	}

	async BuyItem(item: Item) {
		if (this.Money < item.Price) {
			return false;
		}

		this.Money -= item.Price;

		const existingItem = await UserItems.findOne({
			where: {
				userId: this.Id,
				itemId: item.Id,
			},
		});

		const now = new Date();
		const userItem = ItemList[item.Id] as UserItem;

		if (!existingItem) {
			await UserItems.create({
				userId: this.Id,
				itemId: item.Id,
				remainingTime: userItem.Type != ItemType.Consumable ? addHours(now, 72) : undefined,
				quantity: userItem.Type == ItemType.Consumable ? 1 : undefined,
			});

			Log.Info(`User ${this.Nickname} (ID: ${this.Id}) bought item ${item.Description[Language.English]} (ID: ${item.Id}) for ${item.Price} [FIRST TIME!].`);
		}
		else {
			let remaining = addHours(existingItem.remainingTime, 72);
			if (now > existingItem.remainingTime) {
				remaining = addHours(now, 72);
			}

			await UserItems.update({
				remainingTime: userItem.Type != ItemType.Consumable ? remaining : undefined,
				quantity: userItem.Type == ItemType.Consumable ? existingItem.quantity += 1 : undefined,
			}, {
				where: {
					userId: this.Id,
					itemId: item.Id,
				},
			});

			Log.Info(`User ${this.Nickname} (ID: ${this.Id}) bought item ${item.Description[Language.English]} (ID: ${item.Id}) for ${item.Price}. Total time: ${differenceInHours(existingItem.remainingTime, new Date())}h.`);
		}

		await this.Update();
		return true;
	}

	async GetItems() {
		const items = await UserItems.findAll({
			where: {
				userId: this.Id,
				[Op.or]: {
					remainingTime: {
						[Op.gt]: new Date(),
					},
					quantity: {
						[Op.gt]: 0,
					},
				},
			},
			order: [["remainingTime", "DESC"]],
		});

		const itemList: UserItem[] = [];

		for (const item of items) {
			const foundWeapon = ItemList[item.itemId] as UserItem;
			foundWeapon.RemainingTime = item.remainingTime;
			foundWeapon.Quantity = item.quantity;

			itemList.push(foundWeapon);
		}

		return itemList;
	}

	async GetAttributes() {
		const items = await UserItems.findAll({
			where: {
				userId: this.Id,
				remainingTime: {
					[Op.gt]: new Date(),
				},
			},
		});

		let moreATK = 0;
		let moreDEF = 0;
		let moreMoneyATK = 0;
		let moreMoneyDEF = 0;

		const hour = new Date().getHours();
		const isDay = hour >= 6 && hour < 18;
		const isNight = !isDay;

		for (const item of items) {
			const foundItem = ItemList[item.itemId];

			this.Attributes.Attack = Math.max(this.Attributes.Attack, foundItem.Attack);
			this.Attributes.Defense = Math.max(this.Attributes.Defense, foundItem.Defense);
			this.Attributes.MoneyAttack = Math.max(this.Attributes.MoneyAttack, foundItem.MoneyAttack);
			this.Attributes.MoneyDefense = Math.max(this.Attributes.MoneyDefense, foundItem.MoneyDefense);

			if ((foundItem.Special.Day && isDay) || (foundItem.Special.Night && isNight) || (!foundItem.Special.Night && !foundItem.Special.Day)) {
				moreATK += foundItem.MoreAttack;
				moreDEF += foundItem.MoreDefense;
				moreMoneyATK += foundItem.MoreMoneyATK;
				moreMoneyDEF += foundItem.MoreMoneyDEF;
			}
		}

		this.Attributes.Attack += moreATK;
		this.Attributes.Defense += moreDEF;
		this.Attributes.MoneyAttack += moreMoneyATK;
		this.Attributes.MoneyDefense += moreMoneyDEF;
	}

	GetSituation() {
		this.Situation.Simple = "Vadiando";
		this.Situation.Complex = `${EmoteString.Lazy} Vadiando`;

		if (this.Job.Id !== null) {
			this.Situation.Simple = "Trabalhando";
			this.Situation.Complex = `${EmoteString.Working} Trabalhando como ${JobList[this.Job.Id].Description[this.Language]}. Terminará ${showTime(this.Job.EndsIn.getTime(), true)}`;
		}
		if (this.Robbery.IsRobbingId) {
			this.Situation.Simple = "Roubando";
			this.Situation.Complex = `${EmoteString.Robbery} Roubando`;
		}
		if (this.Robbery.IsBeingRobbedById) {
			this.Situation.Simple = "Sendo roubado";
			this.Situation.Complex = `${EmoteString.Robbery} Sendo roubado`;
		}
		if (this.IsEscaping()) {
			this.Situation.Simple = "Fugindo";
			this.Situation.Complex = `${EmoteString.Police} Fugindo até ${showTime(this.Timers.Escape.getTime())}`;
		}
		if (this.IsInPrison()) {
			this.Situation.Simple = "Preso";
			this.Situation.Complex = `${EmoteString.Prison} Preso até ${showTime(this.Timers.Prison.getTime())}`;
		}
	}

	IsWorking() {
		return this.Job.Id != null && this.Job.EndsIn > new Date();
	}

	IsInPrison() {
		return this.Timers.Prison > new Date();
	}

	IsEscaping() {
		return this.Timers.Escape > new Date();
	}

	async StartJob(jobId: JobId) {
		const job = JobList[jobId];
		this.Job.Id = jobId;
		this.Job.EndsIn = addHours(new Date(), job.Duration);

		await Notification.Job(this);
		await this.Update();
		Log.Info(`User ${this.Nickname} (ID: ${this.Id}) started job ${job.Description[this.Language]} (ID: ${jobId}), will finish in ${formatDate(this.Job.EndsIn)}.`);
	}

	async CancelJob() {
		if (this.Job.Id === null) {
			return;
		}
		const job = JobList[this.Job.Id];
		this.Job.Id = null;

		await Notification.Dismiss(this.Id, NotificationType.Job);
		await this.Update();
		Log.Info(`User ${this.Nickname} (ID: ${this.Id}) canceled his job ${job.Description[this.Language]}.`);
	}

	async EndJob() {
		if (this.Job.Id === null) {
			return;
		}
		const job = JobList[this.Job.Id];
		this.Money += job.Salary;
		this.Job.Id = null;

		await this.Update();
		Log.Success(`User ${this.Nickname} (ID: ${this.Id}) finished his job ${job.Description[this.Language]} and received ${formatMoney(job.Salary, Language.English)}.`);
	}

	async CanRobUser(target: User, interaction: ChatInputCommandInteraction) {
		if (target.Id === this.Id) {
			await replyInteraction(interaction, {
				embeds: [defaultEmbed({
					nickname: this.Nickname,
					interaction,
					color: CrColors.Robbery,
					description: `${EmoteString.Robbery} Você não pode roubar a si mesmo, idiota!`,
				})],
			});
			return false;
		}

		if (this.Attributes.Attack == 0) {
			await replyInteraction(interaction, {
				embeds: [defaultEmbed({
					nickname: this.Nickname,
					interaction,
					color: CrColors.Robbery,
					description: `${EmoteString.Robbery} Você não pode roubar sem uma arma!`,
				})],
			});
			return false;
		}

		if (target.Attributes.Attack - this.Attributes.Attack > 15) {
			await replyInteraction(interaction, {
				embeds: [defaultEmbed({
					nickname: this.Nickname,
					interaction,
					color: CrColors.Robbery,
					description: `${EmoteString.Robbery} Você não pode roubar ${target.Nickname} usando suas armas atuais!`,
					footer: "Consiga uma arma melhor",
				})],
			});
			return false;
		}

		if (this.IsInPrison()) {
			await replyInteraction(interaction, {
				embeds: [defaultEmbed({
					nickname: this.Nickname,
					interaction,
					color: CrColors.Robbery,
					description: `${EmoteString.Robbery} Você não pode roubar enquanto está preso!`,
				})],
			});
			return false;
		}

		if (this.IsEscaping()) {
			await replyInteraction(interaction, {
				embeds: [defaultEmbed({
					interaction,
					nickname: this.Nickname,
					color: CrColors.Robbery,
					description: `${EmoteString.Robbery} Você não pode roubar enquanto está fugindo!`,
				})],
			});
			return false;
		}

		return true;
	}

	async RobUser(target: User, interaction: ChatInputCommandInteraction) {
		const userTimeInPrison = 10 + 1.5 * this.Attributes.Attack;

		if (!await this.CanRobUser(target, interaction)) {
			return;
		}

		if (target.Attributes.Defense === 0) {
			this.Attributes.Attack *= 1.35;
		}

		this.Robbery.IsRobbingId = target.Id;
		await this.Update();
		target.Robbery.IsBeingRobbedById = this.Id;
		await target.Update();

		Log.Info(`User ${this.Nickname} (ID: ${this.Id}) started a robbery to user ${target.Nickname} (ID: ${target.Id}).`);

		const privateEmbed = new CustomEmbedBuilder()
			.setColor(CrColors.Robbery)
			.setAuthor({
				name: `Roubo em andamento...`,
				iconURL: interaction.user.avatarURL() ?? "",
			})
			.setDescription(`# ${EmoteString.Robbery} Mãos ao alto!
${this.Nickname} está tentando roubar você!`);

		const client = getClient();
		const targetUser = await client.users.fetch(target.Id);

		const privateMessage = await sendComplexPrivateMessage(targetUser.id, privateEmbed);

		const channelEmbed = new CustomEmbedBuilder()
			.setColor(CrColors.Robbery)
			.setThumbnail("https://media.discordapp.net/attachments/691019843159326757/791444366727708672/roubar_20201223201323.png")
			.setAuthor({
				name: `Roubo em andamento...`,
				iconURL: targetUser.avatarURL() ?? "",
			})
			.setDescription(`# ${this.Nickname}
${EmoteString.Attack}${this.Attributes.Attack} ATK ${EmoteString.Defense}${this.Attributes.Defense} DEF
-# ${EmoteString.Attack}${this.Attributes.MoneyAttack} $ATK! ${EmoteString.Defense}${this.Attributes.MoneyDefense} $DEF!
Tempo preso caso falha: ${userTimeInPrison} minutos
# ${target.Nickname}
${EmoteString.Attack}${target.Attributes.Attack} ATK ${EmoteString.Defense}${target.Attributes.Defense} DEF
-# ${EmoteString.Attack}${target.Attributes.MoneyAttack} $ATK! ${EmoteString.Defense}${target.Attributes.MoneyDefense} $DEF!`)
			.setDefaultFooter(this.Nickname, interaction.user.avatarURL());

		await replyInteraction(interaction, {
			content: `${interaction.options.getUser("target")}`,
			embeds: [channelEmbed],
		});

		await wait(10000);

		function getPercent(percent: number, from: number) {
			return (from / 100) * percent;
		}

		this.Attributes.Attack -= getPercent(target.Attributes.Defense, this.Attributes.Attack);

		const chance = Math.random() * 100;
		const sucess = chance < this.Attributes.Attack;

		if (sucess) {
			if (target.Attributes.Defense > 0) {
				this.Attributes.MoneyAttack -= getPercent(target.Attributes.MoneyDefense, this.Attributes.MoneyAttack);
			}

			const money = Math.floor(getPercent(this.Attributes.MoneyAttack, target.Money));
			this.Money += money;
			target.Money -= money;

			this.Timers.Escape = addHours(new Date(), 1);

			channelEmbed.setDescription(`# Você roubou ${formatMoney(money, this.Language)} de **${target.Nickname}**!`);

			privateEmbed.setDescription(`# Você foi roubado e perdeu ${formatMoney(money, target.Language)} pro ${this.Nickname}!`);

			Log.Success(`User ${this.Nickname} (ID: ${this.Id}) successfully robbed user ${target.Nickname} (ID: ${target.Id}) and got ${formatMoney(money, Language.English)}.`);
		}
		else {
			this.Timers.Prison = addMinutes(new Date(), userTimeInPrison);

			channelEmbed
				.setColor(CrColors.Police)
				.setDescription(`# Você falhou na sua tentativa e ficará preso até ${showTime(this.Timers.Prison.getTime())}`);

			privateEmbed.setDescription(`# ${this.Nickname} tentou lhe roubar, mas a polícia o capturou e deixará ele preso até ${showTime(this.Timers.Prison.getTime())}! ${EmoteString.Police}`);

			Log.Success(`User ${this.Nickname} (ID: ${this.Id}) failed to rob user ${target.Nickname} (ID: ${target.Id}).`);
		}

		channelEmbed
			.setAuthor({
				name: `Roubo ${sucess ? "bem" : "mal"}-sucedido`,
				iconURL: targetUser.avatarURL() ?? "",
			})
			.setDefaultFooter(this.Nickname, interaction.user.avatarURL(), formatMoney(this.Money, this.Language));

		await replyInteraction(interaction, { embeds: [channelEmbed], components: [] });

		if (privateMessage) {
			privateEmbed
				.setAuthor({
					name: `Roubo finalizado`,
					iconURL: interaction.user.avatarURL() ?? "",
				})
				.setFooter({ text: formatMoney(target.Money, target.Language) });
			await privateMessage.edit({ embeds: [privateEmbed] });
		}

		this.Robbery.IsRobbingId = null;
		await this.Update();
		target.Robbery.IsBeingRobbedById = null;
		await target.Update();
	}

	// CheckActions() {
	// 	const availableActions = {
	// 		rob: false,
	// 		beatUp: false,
	// 		bet: false,
	// 		scavenge: false,
	// 	};
	//
	// }

	async Update() {
		try {
			await Users.update({
				createdAt: this.CreatedAt,
				updatedAt: this.UpdatedAt,
				vipTime: this.VipTime,
				vipEternal: this.VipEternal,
				language: this.Language,
				nickname: this.Nickname,
				money: this.Money,
				jobId: this.Job.Id,
				jobTime: this.Job.EndsIn,
				robbingUserId: this.Robbery.IsRobbingId,
				beingRobbedByUserId: this.Robbery.IsBeingRobbedById,
				prisonTime: this.Timers.Prison,
				escapeTime: this.Timers.Escape,
			}, {
				where: { id: this.Id },
			});

			Log.Info(`User ID: ${this.Id} updated.`);

		}
		catch (err) {
			Log.Warning(`Something went wrong with updating user Id: ${this.Id}.`);
		}
	}
}