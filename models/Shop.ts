import { formatMoney, showTime } from "../utils/ui";
import { User } from "./User";
import { CustomEmbedBuilder } from "./CustomEmbedBuilder";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	ColorResolvable,
	Colors,
	ComponentType,
	MessageComponentInteraction,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} from "discord.js";
import { Language } from "./Language";
import { removeEmbedComponents, replyInteraction } from "../utils/logic";
import { EmoteString } from "../utils/emotes";
import { getItemList, Item, ItemList, ItemType } from "./Item";
import { Users } from "../database/Users";
import { LocationList } from "./Locations";
import { ClassList } from "./Class";
import { differenceInHours } from "date-fns";
import { UserItems } from "../database/UserItems";
import { addHours } from "date-fns/addHours";

export class Shop {
	User: User;
	Title: string;
	Description: string;
	Image: string;
	Color: ColorResolvable;
	ItemList: Item[];

	constructor(user: User) {
		const s = Strings[user.Language];

		this.User = user;
		this.Title = s.title;
		this.Description = `# ${this.Title}\n${s.description}`;
		this.Image = "https://media.discordapp.net/attachments/531174573463306240/854876910885797909/Loja.png";
		this.Color = Colors.Green;
		this.ItemList = getItemList().filter((item) => item.Shop);
	}

	GenerateEmbed(interaction: ChatInputCommandInteraction) {
		const s = Strings[this.User.Language];

		const embed = new CustomEmbedBuilder()
			.setDescription(this.Description)
			.setThumbnail(this.Image)
			.setColor(this.Color)
			.setUserFooter({
				nickname: this.User.Nickname,
				image: interaction.user.avatarURL(),
				text: formatMoney(this.User.Money, this.User.Language),
			});

		const select = new StringSelectMenuBuilder()
			.setCustomId("select")
			.setPlaceholder(s.placeholderSelect);

		this.ItemList.forEach((item: Item) => {
			let textSelect = "";

			if (item.Type == ItemType.Weapon) {
				embed.addFields({
					name: `${item.Skin.Default.Emote.String} ${item.Description[this.User.Language]}`,
					value: `${formatMoney(item.Price, this.User.Language)}\n-# ${EmoteString.Attack}${item.Attack} ATK\n-# ${EmoteString.Defense}${item.Defense} DEF`,
					inline: true,
				});
				textSelect = ` • ${item.Attack} ATK • ${item.Defense} DEF`;
			}

			if (item.Type == ItemType.Armor) {
				const textField = [];
				const _textSelect = [];

				if (item.MoreAttack) {
					textField.push(`-# ${EmoteString.Attack}+${item.MoreAttack} ATK`);
					_textSelect.push(`+${item.MoreAttack} ATK`);
				}
				if (item.MoreDefense) {
					textField.push(`-# ${EmoteString.Defense}+${item.MoreDefense} DEF`);
					_textSelect.push(`+${item.MoreDefense} DEF`);
				}
				if (item.MoreMoneyATK) {
					textField.push(`-# ${EmoteString.Attack}+${item.MoreMoneyATK} $ATK!`);
					_textSelect.push(`+${item.MoreMoneyATK} $ATK!`);
				}
				if (item.MoreMoneyDEF) {
					textField.push(`-# ${EmoteString.Defense}+${item.MoreMoneyDEF} $DEF!`);
					_textSelect.push(`+${item.MoreMoneyDEF} $DEF!`);
				}
				if (item.Special.Day) {
					textField.push(`-# (${s.day})`);
					_textSelect.push(`(${s.day})`);
				}
				if (item.Special.Night) {
					textField.push(`-# (${s.night})`);
					_textSelect.push(`(${s.night})`);
				}

				embed.addFields({
					name: `${item.Skin.Default.Emote.String} ${item.Description[this.User.Language]}`,
					value: `${formatMoney(item.Price, this.User.Language)}\n${textField.join("\n")}`,
					inline: true,
				});
				textSelect = ` • ${_textSelect.join(" • ")}`;
			}

			if (item.Type == ItemType.Accessory) {
				embed.addFields({
					name: `${item.Skin.Default.Emote.String} ${item.Description[this.User.Language]}`,
					value: `${formatMoney(item.Price, this.User.Language)}\n-# +30% ${s.escape}`,
					inline: true,
				});
				textSelect = ` • +30% ${s.escape}`;
			}

			if (item.Type == ItemType.Consumable) {
				const textField = [];
				const _textSelect = [];

				if (item.MoreAttack) {
					textField.push(`-# ${EmoteString.Attack}+${item.MoreAttack} ATK`);
					_textSelect.push(`+${item.MoreAttack} ATK`);
				}
				if (item.MoreDefense) {
					textField.push(`-# ${EmoteString.Defense}+${item.MoreDefense} DEF`);
					_textSelect.push(`+${item.MoreDefense} DEF`);
				}
				if (item.MoreMoneyATK) {
					textField.push(`-# ${EmoteString.Attack}+${item.MoreMoneyATK} $ATK!`);
					_textSelect.push(`+${item.MoreMoneyATK} $ATK!`);
				}
				if (item.MoreMoneyDEF) {
					textField.push(`-# ${EmoteString.Defense}+${item.MoreMoneyDEF} $DEF!`);
					_textSelect.push(`+${item.MoreMoneyDEF} $DEF!`);
				}
				if (item.Special.Day) {
					textField.push(`-# (${s.day})`);
					_textSelect.push(`(${s.day})`);
				}
				if (item.Special.Night) {
					textField.push(`-# (${s.night})`);
					_textSelect.push(`(${s.night})`);
				}
				embed.addFields({
					name: `${item.Skin.Default.Emote.String} ${item.Description[this.User.Language]}`,
					value: `${formatMoney(item.Price, this.User.Language)}\n${textField.join("\n")}\n-# (${s.consumable})`,
					inline: true,
				});
				textSelect = ` • ${_textSelect.join(" • ")} (${s.consumable})`;
			}

			select.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel(item.Description[this.User.Language])
					.setValue(String(item.Id))
					.setDescription(`${formatMoney(item.Price, this.User.Language)}${textSelect}`)
					.setEmoji(item.Skin.Default.Emote.String),
			);
		});

		const rowSelector = new ActionRowBuilder<StringSelectMenuBuilder>()
			.setComponents(select);

		const buttonBuyMore = new ButtonBuilder()
			.setCustomId("buyMore")
			.setLabel(s.buyMore)
			.setEmoji("◀")
			.setStyle(ButtonStyle.Secondary);

		const rowButton = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(buttonBuyMore);

		const components = rowSelector.components[0].options.length > 0 ? [rowSelector] : [];

		return { embed, components, rowButton };
	}

	async CanUserBuyItem(item: Item) {
		const s = Strings[this.User.Language];
		let canBuy = true;
		let message = "";

		if (this.User.Money < item.Price) {
			message = s.noMoney;
			canBuy = false;
		}

		const existingItem = await UserItems.findOne({
			where: {
				userId: this.User.Id,
				itemId: item.Id,
			},
		});

		if (existingItem && differenceInHours(addHours(existingItem.remainingTime, 72), new Date()) > 320) {
			message = s.itemPassLimit(differenceInHours(existingItem.remainingTime, new Date()), `${item.Skin.Default.Emote.String} ${item.Description[this.User.Language]}`);
			canBuy = false;
		}

		if (this.User.IsInPrison()) {
			message = s.inPrison(this.User.Prison.Time);
			canBuy = false;
		}

		if (this.User.Robbery.IsRobbingId) {
			const user = await Users.findByPk(this.User.Robbery.IsRobbingId);
			message = `${s.robbing(`${ClassList[user!.class].Image.Emote.String} ${user!.nickname}`)} ${EmoteString.Robbery}`;
			canBuy = false;
		}

		if (this.User.Robbery.IsBeingRobbedById) {
			const user = await Users.findByPk(this.User.Robbery.IsBeingRobbedById);
			message = `${s.beingRobbed(`${ClassList[user!.class].Image.Emote.String} ${user!.nickname}`)} ${EmoteString.Robbery}`;
			canBuy = false;
		}

		if (this.User.Robbery.IsRobbingLocationId) {
			const location = LocationList[this.User.Robbery.IsRobbingLocationId];
			message = `${s.robbing(location.Description[this.User.Language])} ${EmoteString.Robbery}`;
			canBuy = false;
		}

		return { canBuy, message };
	}

	async Start(interaction: ChatInputCommandInteraction) {
		const s = Strings[this.User.Language];

		const { embed, components, rowButton } = this.GenerateEmbed(interaction);

		const response = await replyInteraction(interaction, { embeds: [embed], components });

		const collectorSelector = response?.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === interaction.user.id,
			componentType: ComponentType.StringSelect,
			idle: 60_000,
		});

		const collectorButton = response?.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === interaction.user.id,
			componentType: ComponentType.Button,
			idle: 60_000,
		});

		collectorSelector?.on("collect", async select => {
			await select.deferUpdate();
			await this.User.GetInfo();

			const embedBought = new CustomEmbedBuilder()
				.setThumbnail(this.Image)
				.setColor(this.Color)
				.setUserFooter({
					nickname: this.User.Nickname,
					image: interaction.user.avatarURL(),
					text: formatMoney(this.User.Money, this.User.Language),
				});

			const item = ItemList[Number(select.values[0])];

			const { canBuy, message } = await this.CanUserBuyItem(item);

			if (!canBuy) {
				return await removeEmbedComponents(interaction, [
					embedBought.setDescription(message),
				]);
			}

			await this.User.BuyItem(item);


			return await replyInteraction(interaction, {
				embeds: [
					embedBought
						.setDescription(s.itemBought(`${item.Skin.Default.Emote.String} ${item.Description[this.User.Language]}`))
						.setUserFooter({
							nickname: this.User.Nickname,
							image: interaction.user.avatarURL(),
							text: formatMoney(this.User.Money, this.User.Language),
						}),
				],
				components: [rowButton],
			});
		});

		collectorSelector?.on("end", async () => {
			await removeEmbedComponents(interaction);
		});

		collectorButton?.on("collect", async btn => {
			if (btn.customId === "buyMore") {
				const { embed } = this.GenerateEmbed(interaction);
				await btn.update({ embeds: [embed], components });
			}
		});

		collectorButton?.on("end", async () => {
			await removeEmbedComponents(interaction);
		});
	}
}


const Strings = {
	[Language.English]: {
		title: "Shop",
		description: "All items have a duration of 72 hours!",
		placeholderSelect: "Select an item to buy",
		cantBuy: "You can't buy anything right now",
		noMoney: "You don't have enough money to buy this item",
		inPrison: (prisonTime: Date) => `You can't buy items while in prison! ${EmoteString.Prison}\n-# You will be released ${showTime(prisonTime.getTime(), true)}!`,
		robbing: (nickname: string) => `You are robbing **${nickname}** and can't buy items now!`,
		beingRobbed: (nickname: string) => `You are being robbed by **${nickname}** and can't buy items now!`,
		day: "day",
		night: "night",
		escape: "escape",
		consumable: "consumable",
		itemBought: (itemName: string) => `## You bought ${itemName}!`,
		itemPassLimit: (hours: number, itemName: string) => `You can't have more than 360 hours of the same item!\n-# Has ${hours} hours of ${itemName}.`,
		buyMore: "Buy more!",
	},

	[Language.Portuguese]: {
		title: "Loja",
		description: "Todos os itens tem duração de 72 horas!",
		placeholderSelect: "Selecione um item para comprar",
		cantBuy: "Você não pode comprar algo agora",
		noMoney: "Você não tem dinheiro suficiente para comprar este item",
		inPrison: (prisonTime: Date) => `Você não pode comprar itens enquanto está preso! ${EmoteString.Prison}\n-# Será solto ${showTime(prisonTime.getTime(), true)}!`,
		robbing: (nickname: string) => `Você está roubando **${nickname}** e não pode comprar itens agora!`,
		beingRobbed: (nickname: string) => `Você está sendo roubado por **${nickname}** e não pode comprar itens agora!`,
		day: "dia",
		night: "noite",
		escape: "fuga",
		consumable: "consumível",
		itemBought: (itemName: string) => `## Você comprou ${itemName}!`,
		itemPassLimit: (hours: number, itemName: string) => `Você não pode possuir mais de 360 horas de um mesmo item!\n-# Possui ${hours} horas de ${itemName}.`,
		buyMore: "Comprar mais!",
	},

	[Language.Spanish]: {
		title: "Comercio",
		description: "¡Todos los artículos tienen una duración de 72 horas!",
		placeholderSelect: "Seleccione un artículo para comprar",
		cantBuy: "No puedes comprar nada ahora mismo",
		noMoney: "No tienes suficiente dinero para comprar este artículo",
		inPrison: (prisonTime: Date) => `¡No puedes comprar artículos mientras estás en prisión! ${EmoteString.Prison}\n-# Serás liberado ${showTime(prisonTime.getTime(), true)}!`,
		robbing: (nickname: string) => `¡Estás robando a **${nickname}** y no puedes comprar artículos ahora mismo!`,
		beingRobbed: (nickname: string) => `¡Estás siendo robado por **${nickname}** y no puedes comprar artículos ahora mismo!`,
		day: "día",
		night: "noche",
		escape: "fuga",
		consumable: "consumible",
		itemBought: (itemName: string) => `## Tú compraste ${itemName}!`,
		itemPassLimit: (hours: number, itemName: string) => `¡No puedes tener más de 360 horas del mismo artículo!\n-# Tiene ${hours} horas de ${itemName}.`,
		buyMore: "¡Comprar más!",
	},
} as const;