import { formatMoney } from "../utils/ui";
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
			.setDefaultFooter(this.User.Nickname, interaction.user.avatarURL(), formatMoney(this.User.Money, this.User.Language));

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
				.setDefaultFooter(this.User.Nickname, interaction.user.avatarURL(), formatMoney(this.User.Money, this.User.Language));

			const item = ItemList[Number(select.values[0])];

			if (!this.User.CanBuySomething()) {
				return await removeEmbedComponents(interaction, [
					embedBought.setDescription(s.cantBuy),
				]);
			}

			if (!await this.User.BuyItem(item)) {
				return await removeEmbedComponents(interaction, [
					embedBought.setDescription(s.noMoney),
				]);
			}

			return await replyInteraction(interaction, {
				embeds: [
					embedBought
						.setDescription(s.itemBought(`${item.Skin.Default.Emote.String} ${item.Description[this.User.Language]}`))
						.setDefaultFooter(this.User.Nickname, interaction.user.avatarURL(), formatMoney(this.User.Money, this.User.Language)),
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
		day: "day",
		night: "night",
		escape: "escape",
		consumable: "consumable",
		itemBought: (itemName: string) => `## You bought ${itemName}!`,
		buyMore: "Buy more!",
	},

	[Language.Portuguese]: {
		title: "Loja",
		description: "Todos os itens tem duração de 72 horas!",
		placeholderSelect: "Selecione um item para comprar",
		cantBuy: "Você não pode comprar algo agora",
		noMoney: "Você não tem dinheiro suficiente para comprar este item",
		day: "dia",
		night: "noite",
		escape: "fuga",
		consumable: "consumível",
		itemBought: (itemName: string) => `## Você comprou ${itemName}`,
		buyMore: "Comprar mais!",
	},

	[Language.Spanish]: {
		title: "Comercio",
		description: "¡Todos los artículos tienen una duración de 72 horas!",
		placeholderSelect: "Seleccione un artículo para comprar",
		cantBuy: "No puedes comprar nada ahora mismo",
		noMoney: "No tienes suficiente dinero para comprar este artículo",
		day: "día",
		night: "noche",
		escape: "fuga",
		consumable: "consumible",
		itemBought: (itemName: string) => `## Tú compraste ${itemName}`,
		buyMore: "¡Comprar más!",
	},
} as const;