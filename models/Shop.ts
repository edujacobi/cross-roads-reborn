import { formatMoney, showTime } from "../utils/ui";
import { User } from "./User";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	Colors,
	ComponentType,
	MessageComponentInteraction,
	MessageFlags,
	RGBTuple,
} from "discord.js";
import { globalStrings, Language } from "./Language";
import { disableButtons, replyInteraction } from "../utils/logic";
import { EmoteString } from "../utils/emotes";
import { getItemList, ItemList, Items, ItemType } from "../interfaces/Items";
import { Users } from "../database/Users";
import { LocationList } from "../interfaces/Locations";
import { ClassList } from "../interfaces/Classes";
import { differenceInHours } from "date-fns";
import { UserItems } from "../database/UserItems";
import { addHours } from "date-fns/addHours";
import { ScavengeId, ScavengeList } from "../interfaces/Scavenge";
import { BundleId } from "../interfaces/Ids";
import { CustomContainerBuilder } from "../ui/builders/CustomContainerBuilder";

export class Shop {
	User: User;
	Title: string;
	Description: string;
	Image: string;
	Color: number | RGBTuple;
	ItemList: Items[];
	Container = new CustomContainerBuilder();
	CurrentPage: number = 0;

	constructor(user: User) {
		const s = Strings[user.Language];

		this.User = user;
		this.Title = s.title;
		this.Description = `# ${this.Title}\n${s.description}`;
		this.Image = "https://media.discordapp.net/attachments/531174573463306240/854876910885797909/Loja.png";
		this.Color = Colors.Green;
		this.ItemList = getItemList().filter((item) => item.Shop);
	}

	AddContainerHeader() {
		this.Container = new CustomContainerBuilder()
			.setUser(this.User)
			.setAccentColor(this.Color)
			.addSectionComponents(header => header
				.addTextDisplayComponents(description => description
					.setContent(this.Description),
				)
				.setThumbnailAccessory(thumb => thumb
					.setURL(this.Image),
				),
			)
			.addLargeSeparator();
	}

	AddContainerFooter() {
		this.Container.addFooter({
			text: formatMoney(this.User.Money, this.User.Language),
		});
	}

	GenerateContainer() {
		const s = Strings[this.User.Language];

		this.AddContainerHeader();

		const pages = [];
		for (let i = 0; i < this.ItemList.length; i += 7) {
			pages.push(this.ItemList.slice(i, i + 7));
		}

		const currentPageItems = pages[this.CurrentPage];

		for (let i = 0; i < currentPageItems.length; i++) {
			const item = currentPageItems[i];
			let value = "";

			if (item.Type == ItemType.Weapon) {
				value = `-# ${EmoteString.Attack}${item.Attack} ATK ${EmoteString.Defense}${item.Defense} DEF`;
			}

			if (item.Type == ItemType.Wearable || item.Type == ItemType.Consumable) {
				const textField = [];

				if (item.MoreAttack) {
					textField.push(`${EmoteString.Attack}+${item.MoreAttack} ATK`);
				}
				if (item.MoreDefense) {
					textField.push(`${EmoteString.Defense}+${item.MoreDefense} DEF`);
				}
				if (item.MoreMoneyATK) {
					textField.push(`${EmoteString.Attack}+${item.MoreMoneyATK} $ATK$`);
				}
				if (item.MoreMoneyDEF) {
					textField.push(`${EmoteString.Defense}+${item.MoreMoneyDEF} $DEF$`);
				}
				if (item.Special.Day) {
					textField.push(`(${s.day})`);
				}
				if (item.Special.Night) {
					textField.push(`(${s.night})`);
				}
				if (item.Type == ItemType.Consumable) {
					textField.push(`(${s.consumable})`);
				}

				value = `-# ${textField.join(" ")}`;
			}

			if (item.Type == ItemType.Accessory) {
				value = `-# +30% ${s.escape}`;
			}

			this.Container.addSectionComponents(section => section
				.addTextDisplayComponents(text => text
					.setContent([
						`### ${item.Skin[BundleId.Default].String} ${item.Description[this.User.Language]}`,
						value,
					].join("\n")),
				)
				.setButtonAccessory(new ButtonBuilder()
					.setLabel(formatMoney(item.Price, this.User.Language))
					.setCustomId(`buy${item.Id}`)
					.setDisabled(item.Price > this.User.Money)
					.setStyle(ButtonStyle.Secondary)),
			);

			if (i != currentPageItems.length - 1) {
				this.Container.addLargeSeparator();
			}
		}

		if (pages.length > 1) {
			this.Container.addLargeSeparator();

			this.Container.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>()
				.addComponents(new ButtonBuilder()
					.setLabel(s.previous)
					.setStyle(ButtonStyle.Secondary)
					.setCustomId("previous")
					.setEmoji("⬅️")
					.setDisabled(this.CurrentPage === 0),
				)
				.addComponents(new ButtonBuilder()
					.setLabel(s.next)
					.setStyle(ButtonStyle.Secondary)
					.setCustomId("next")
					.setEmoji("➡️")
					.setDisabled(this.CurrentPage === pages.length - 1),
				));
		}

		this.AddContainerFooter();
	}

	async CanUserBuyItem(item: Items) {
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

		if (existingItem && differenceInHours(addHours(existingItem.remainingTime, 72), new Date()) > 360) {
			message = s.itemPassLimit(differenceInHours(existingItem.remainingTime, new Date()), `${item.Skin[BundleId.Default].String} ${item.Description[this.User.Language]}`);
			canBuy = false;
		}

		if (this.User.IsScavenging()) {
			message = s.scavenging(this.User.Scavenge.IsScavengingId!);
			canBuy = false;
		}

		if (this.User.IsInPrison()) {
			message = s.inPrison(this.User.Prison.Time);
			canBuy = false;
		}

		if (this.User.IsInHospital()) {
			message = s.inHospital(this.User.Hospital.Time);
			canBuy = false;
		}

		if (this.User.BeatUp.IsBeatingId) {
			const user = await Users.findByPk(this.User.BeatUp.IsBeatingId, { attributes: ["class", "nickname"] });
			message = globalStrings[this.User.Language].attackerIsBeatingId(`${ClassList[user!.class].Image.Emote.String} ${user!.nickname!}`);
			canBuy = false;
		}

		if (this.User.BeatUp.IsBeingBeatUpById) {
			const user = await Users.findByPk(this.User.BeatUp.IsBeingBeatUpById, { attributes: ["class", "nickname"] });
			message = globalStrings[this.User.Language].attackerIsBeingBeatedById(`${ClassList[user!.class!].Image.Emote.String} ${user!.nickname!}`);
			canBuy = false;
		}

		if (this.User.Robbery.IsRobbingId) {
			const user = await Users.findByPk(this.User.Robbery.IsRobbingId, { attributes: ["nickname", "class"] });
			message = globalStrings[this.User.Language].attackerIsRobbingId(`${ClassList[user!.class].Image.Emote.String} ${user!.nickname}`);
			canBuy = false;
		}

		if (this.User.Robbery.IsBeingRobbedById) {
			const user = await Users.findByPk(this.User.Robbery.IsBeingRobbedById, { attributes: ["nickname", "class"] });
			message = globalStrings[this.User.Language].attackerIsBeingRobbedById(`${ClassList[user!.class].Image.Emote.String} ${user!.nickname}`);
			canBuy = false;
		}

		if (this.User.Robbery.IsRobbingLocationId !== null) {
			const location = LocationList[this.User.Robbery.IsRobbingLocationId];
			message = globalStrings[this.User.Language].attackerIsRobbingId(location.Description[this.User.Language]);
			canBuy = false;
		}

		return { canBuy, message };
	}

	async Start(interaction: ChatInputCommandInteraction) {
		const s = Strings[this.User.Language];

		this.GenerateContainer();

		const response = await replyInteraction(interaction, {
			components: [this.Container],
			flags: MessageFlags.IsComponentsV2,
		});

		const collectorButton = response?.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === interaction.user.id,
			componentType: ComponentType.Button,
			idle: 60_000,
		});

		collectorButton?.on("collect", async btn => {
			await btn.deferUpdate({
				withResponse: true,
			});

			if (btn.customId === "more") {
				this.GenerateContainer();
				return await replyInteraction(interaction, { components: [this.Container] });
			}

			if (btn.customId.includes("buy")) {
				await this.User.GetInfo();

				const itemId = Number(btn.customId.replace("buy", ""));
				const item = ItemList[itemId];

				const { canBuy, message } = await this.CanUserBuyItem(item);

				if (!canBuy) {
					this.AddContainerHeader();

					this.Container.addTexts([
						message,
					]);

					this.AddContainerFooter();

					return await replyInteraction(interaction, { components: [this.Container] });
				}

				await this.User.BuyItem(item);

				this.AddContainerHeader();

				this.Container.addSectionComponents(section => section
					.addTextDisplayComponents(text => text
						.setContent(s.itemBought(`${item.Skin[BundleId.Default].String} ${item.Description[this.User.Language]}`)),
					)
					.setButtonAccessory(btn => btn
						.setLabel(s.buyMore)
						.setStyle(ButtonStyle.Secondary)
						.setCustomId("more"),
					),
				);

				this.AddContainerFooter();

				return await replyInteraction(interaction, { components: [this.Container] });
			}

			if (btn.customId === "previous") {
				this.CurrentPage -= 1;
				this.GenerateContainer();
				return await replyInteraction(interaction, { components: [this.Container] });
			}
			else if (btn.customId === "next") {
				this.CurrentPage += 1;
				this.GenerateContainer();
				return await replyInteraction(interaction, { components: [this.Container] });
			}
		});

		collectorButton?.on("end", async () => {
			await disableButtons(interaction, this.Container);
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
		scavenging: (placeId: ScavengeId) => `You can't buy items while scavenging ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.English]}** ${EmoteString.Scavenge}`,
		inPrison: (prisonTime: Date) => `You can't buy items while in prison! ${EmoteString.Prison}\n-# Will be released ${showTime(prisonTime.getTime(), true)}!`,
		inHospital: (hospitalTime: Date) => `You can't buy items while in the hospital! ${EmoteString.Hospital}\n-# Will be healed ${showTime(hospitalTime.getTime(), true)}!`,
		day: "day",
		night: "night",
		escape: "escape",
		consumable: "consumable",
		itemBought: (itemName: string) => `You bought **${itemName}**!`,
		itemPassLimit: (hours: number, itemName: string) => `You can't have more than 360 hours of the same item!\n-# Has ${hours} hours of ${itemName}.`,
		buyMore: "Buy more!",
		next: "Next",
		previous: "Previous",
	},

	[Language.Portuguese]: {
		title: "Loja",
		description: "Todos os itens tem duração de 72 horas!",
		placeholderSelect: "Selecione um item para comprar",
		cantBuy: "Você não pode comprar algo agora",
		noMoney: "Você não tem dinheiro suficiente para comprar este item",
		scavenging: (placeId: ScavengeId) => `Você não pode comprar itens enquanto está vasculhando ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Portuguese]}** ${EmoteString.Scavenge}`,
		inPrison: (prisonTime: Date) => `Você não pode comprar itens enquanto está preso! ${EmoteString.Prison}\n-# Será solto ${showTime(prisonTime.getTime(), true)}!`,
		inHospital: (hospitalTime: Date) => `Você não pode comprar itens enqunato está hospitalizado! ${EmoteString.Hospital}\n-# Será curado ${showTime(hospitalTime.getTime(), true)}!`,
		day: "dia",
		night: "noite",
		escape: "fuga",
		consumable: "consumível",
		itemBought: (itemName: string) => `Você comprou **${itemName}**!`,
		itemPassLimit: (hours: number, itemName: string) => `Você não pode possuir mais de 360 horas de um mesmo item!\n-# Possui ${hours} horas de ${itemName}.`,
		buyMore: "Comprar mais!",
		next: "Próximo",
		previous: "Anterior",
	},

	[Language.Spanish]: {
		title: "Comercio",
		description: "¡Todos los artículos tienen una duración de 72 horas!",
		placeholderSelect: "Seleccione un artículo para comprar",
		cantBuy: "No puedes comprar nada ahora mismo",
		noMoney: "No tienes suficiente dinero para comprar este artículo",
		scavenging: (placeId: ScavengeId) => `¡No puedes comprar artículos mientras estás buscando en ${ScavengeList[placeId].Emote.String} **${ScavengeList[placeId].Description[Language.Spanish]}** ${EmoteString.Scavenge}`,
		inPrison: (prisonTime: Date) => `¡No puedes comprar artículos mientras estás en prisión! ${EmoteString.Prison}\n-# Serás liberado ${showTime(prisonTime.getTime(), true)}!`,
		inHospital: (hospitalTime: Date) => `¡No puedes comprar artículos mientras estás en el hospital! ${EmoteString.Hospital}\n-# Serás curado ${showTime(hospitalTime.getTime(), true)}!`,
		day: "día",
		night: "noche",
		escape: "fuga",
		consumable: "consumible",
		itemBought: (itemName: string) => `Tú compraste **${itemName}**!`,
		itemPassLimit: (hours: number, itemName: string) => `¡No puedes tener más de 360 horas del mismo artículo!\n-# Tiene ${hours} horas de ${itemName}.`,
		buyMore: "¡Comprar más!",
		next: "Siguiente",
		previous: "Anterior",
	},
} as const;