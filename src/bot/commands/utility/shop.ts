import { ButtonBuilder, ButtonStyle, type ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { Shop } from "#core/models/Shop";
import type { User } from "#core/models/User";
import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { formatMoney, showTime } from "#bot/utils/ui";
import { deferReply, deferUpdate, replyWithContainer } from "#bot/utils/discordInteractions";
import { EmoteString } from "#bot/utils/emotes";
import { ItemList, ItemType } from "#core/types/Items";
import { Language, type Localization } from "#core/models/Language";
import { createButtonCollector, disableButtons } from "#bot/utils/collectors";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("shop")
		.setDescription("Open the shop to buy something")
		.setNameLocalization(Locale.PortugueseBR, "loja")
		.setNameLocalization(Locale.SpanishES, "tienda")
		.setDescriptionLocalization(Locale.PortugueseBR, "Abra a loja para comprar alguma coisa")
		.setDescriptionLocalization(Locale.SpanishES, "Abrir la tienda para comprar algo"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language, shopOverride?: Shop) {
		await deferReply(interaction);
		const shop = shopOverride || new Shop(user);
		const s = Strings[language];
		let currentPage = 0;

		function addContainerHeader() {
			return new CustomContainerBuilder()
				.setUser(user)
				.setAccentColor(shop.Color)
				.addSectionComponents(header => header
					.addTexts([
						`# ${shop.Title}`,
						shop.Description,
					])
					.setThumbnailAccessory(thumb => thumb
						.setURL(shop.Image),
					),
				)
				.addLargeSeparator();
		}

		function addContainerFooter(container: CustomContainerBuilder) {
			container.addFooter({
				text: formatMoney(user.Money, user.Language),
			});
		}

		function generateContainer() {
			const container = addContainerHeader();

			const pages = [];
			for (let i = 0; i < shop.ItemList.length; i += 7) {
				pages.push(shop.ItemList.slice(i, i + 7));
			}

			const currentPageItems = pages[currentPage] || [];

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

				const userItem = user.Items.find(i => i.Id == item.Id);

				const remainigTime = userItem?.RemainingTime;
				const quantity = userItem?.Quantity;

				container.addSectionComponents(section => section
					.addTexts([
						`### ${user.GetItemSkin(item)} ${item.Description[user.Language]}`,
						value,
						remainigTime ? `-# ${s.yourItemEnds} ${showTime(remainigTime.getTime(), true)}` : "",
						quantity ? `-# ${s.youHave} ${quantity}` : "",
					].filter(Boolean))
					.setButtonAccessory(new ButtonBuilder()
						.setLabel(formatMoney(item.Price, user.Language))
						.setCustomId(`buy${item.Id}`)
						.setDisabled(item.Price > user.Money)
						.setStyle(ButtonStyle.Secondary)),
				);

				if (i != currentPageItems.length - 1) {
					container.addLargeSeparator();
				}
			}

			if (pages.length > 1) {
				container.addLargeSeparator();

				container.addButtonRow(
					btn => btn
						.setLabel(s.previous)
						.setStyle(ButtonStyle.Secondary)
						.setCustomId("previous")
						.setEmoji("⬅️")
						.setDisabled(currentPage === 0),
					btn => btn
						.setLabel(s.next)
						.setStyle(ButtonStyle.Secondary)
						.setCustomId("next")
						.setEmoji("➡️")
						.setDisabled(currentPage === pages.length - 1),
				);
			}

			addContainerFooter(container);
			return container;
		}

		let container = generateContainer();

		const response = await replyWithContainer(interaction, container);

		const collector = createButtonCollector(interaction, response);

		collector?.on("collect", async btn => {
			await deferUpdate(btn);

			if (btn.customId === "back") {
				container = generateContainer();
				return replyWithContainer(interaction, container);
			}

			if (btn.customId.includes("buy")) {
				await user.GetInfo();

				const itemId = Number(btn.customId.replace("buy", ""));
				const item = ItemList[itemId];

				const { canBuy, message } = await shop.CanUserBuyItem(item);

				if (!canBuy) {
					container = addContainerHeader();

					container
						.addTexts([
							message,
						])
						.addButtonRow(btn => btn
							.setLabel(s.back)
							.setStyle(ButtonStyle.Secondary)
							.setCustomId("back"),
						);

					addContainerFooter(container);

					return replyWithContainer(interaction, container);
				}

				await user.BuyItem(item);

				const userItem = user.Items.find(i => i.Id == item.Id);

				const remainigTime = userItem?.RemainingTime;
				const quantity = userItem?.Quantity;

				container = addContainerHeader();

				container
					.addTexts([
						s.itemBought(`${user.GetItemSkin(item)} ${item.Description[user.Language]}`),
						remainigTime ? `-# ${s.yourItemEnds} ${showTime(remainigTime.getTime(), true)}` : "",
						quantity ? `-# ${s.youHave} ${quantity}` : "",
					].filter(Boolean))
					.addButtonRow(
						btn => btn
							.setLabel(s.back)
							.setStyle(ButtonStyle.Secondary)
							.setCustomId("back"),
						btn => btn
							.setLabel(s.buyMore(item.Price))
							.setStyle(ButtonStyle.Success)
							.setCustomId(`buy${itemId}`),
					);

				addContainerFooter(container);

				return replyWithContainer(interaction, container);
			}

			if (btn.customId === "previous") {
				currentPage -= 1;
				container = generateContainer();
				return replyWithContainer(interaction, container);
			}
			else if (btn.customId === "next") {
				currentPage += 1;
				container = generateContainer();
				return replyWithContainer(interaction, container);
			}
		});

		collector?.on("end", async () => {
			await disableButtons(interaction, container);
		});
	},
};

const Strings = {
	[Language.English]: {
		day: "day",
		night: "night",
		escape: "escape",
		consumable: "consumable",
		yourItemEnds: "Your item ends",
		youHave: "You have",
		itemBought: (itemName: string) => `You bought **${itemName}**!`,
		buyMore: (price: number) => `Buy more! ${formatMoney(price, Language.English)}`,
		back: "Go back",
		next: "Next",
		previous: "Previous",
	},

	[Language.Portuguese]: {
		day: "dia",
		night: "noite",
		escape: "fuga",
		consumable: "consumível",
		yourItemEnds: "Seu item acaba",
		youHave: "Você possui",
		itemBought: (itemName: string) => `Você comprou **${itemName}**!`,
		buyMore: (price: number) => `Comprar mais! ${formatMoney(price, Language.Portuguese)}`,
		back: "Voltar",
		next: "Próximo",
		previous: "Anterior",
	},

	[Language.Spanish]: {
		day: "día",
		night: "noche",
		escape: "fuga",
		consumable: "consumible",
		yourItemEnds: "Tu item acaba",
		youHave: "Posees",
		itemBought: (itemName: string) => `Tú compraste **${itemName}**!`,
		buyMore: (price: number) => `¡Comprar más! ${formatMoney(price, Language.Spanish)}`,
		back: "Volver",
		next: "Siguiente",
		previous: "Anterior",
	},
} as const satisfies Localization;