import {
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	Colors,
	ComponentEmojiResolvable,
	Locale,
	SlashCommandBuilder,
	SlashCommandIntegerOption,
} from "discord.js";
import { replyWithContainer } from "@bot/utils/discordInteractions";
import { formatMoney } from "@bot/utils/ui";
import { Language } from "@core/models/Language";
import { User } from "@core/models/User";
import { ItemList, ItemType } from "@core/types/Items";
import { EmoteId, EmoteString } from "@bot/utils/emotes";
import { UserItems } from "@core/database/UserItems";
import { Op } from "sequelize";
import { BundleId } from "@core/types/Ids";
import { BundleList } from "@core/types/Skins";
import { CrColors, GangColor, GangColorId } from "@bot/utils/colors";
import { CustomContainerBuilder } from "@bot/ui/builders/CustomContainerBuilder";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("item")
		.setDescription("Check all the stats of a given item!")
		.setDescriptionLocalization(Locale.PortugueseBR, "Veja todos os dados de um determinado item!")
		.addIntegerOption((option: SlashCommandIntegerOption) =>
			option
				.setName("item")
				.setDescription("Which item")
				.setDescriptionLocalization(Locale.PortugueseBR, "Qual item")
				.setRequired(true)
				.addChoices(Object.values(ItemList).map(item => ({
					name: item.Description[Language.English],
					value: item.Id,
					name_localizations: {
						[Locale.PortugueseBR]: item.Description[Language.Portuguese],
					},
				} as {
					name: string; value: number; name_localizations: Record<Locale, string>
				}))),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const s = Strings[language];
		const itemId = interaction.options.getInteger("item", true);
		const item = ItemList[itemId];

		const itemMapper = {
			[ItemType.Weapon]: {
				color: Colors.Red,
				emoji: GangColor[GangColorId.Red].Emote.Id,
				type: s.typeWeapon,
			},
			[ItemType.Wearable]: {
				color: Colors.Blue,
				emoji: GangColor[GangColorId.Blue].Emote.Id,
				type: s.typeWearable,
			},
			[ItemType.Accessory]: {
				color: Colors.Purple,
				emoji: GangColor[GangColorId.Purple].Emote.Id,
				type: s.typeAccessory,
			},
			[ItemType.Consumable]: {
				color: Colors.Green,
				emoji: GangColor[GangColorId.Green].Emote.Id,
				type: s.typeConsumable,
			},
			[ItemType.BeatUp]: {
				color: CrColors.BeatUp,
				emoji: GangColor[GangColorId.Orange].Emote.Id,
				type: s.typeBeatUp,
			},
		};

		const usersWithItem = await UserItems.count({
			where: {
				[Op.and]: {
					itemId: item.Id,
					[Op.or]: {
						remainingTime: {
							[Op.gt]: new Date(),
						},
						quantity: {
							[Op.gt]: 0,
						},
					},
				},
			},
		});

		interface buttonParams {
			label: string;
			customId: string;
			style?: ButtonStyle;
			emoji?: ComponentEmojiResolvable;
		}

		function button(params: buttonParams) {
			const btn = new ButtonBuilder()
				.setLabel(params.label)
				.setDisabled(true)
				.setCustomId(params.customId)
				.setStyle(params.style ?? ButtonStyle.Secondary);

			if (params.emoji) {
				btn.setEmoji(params.emoji);
			}

			return btn;
		}

		const container = new CustomContainerBuilder()
			.setUser(user)
			.setAccentColor(itemMapper[item.Type].color)
			.addTexts([
				`# ${item.Skin[BundleId.Default].String} ${item.Description[language]}`,
				`## ${EmoteString.Attack}${item.Attack} ATK ${EmoteString.Defense}${item.Defense} DEF`,
			])
			.addLargeSeparator()
			.addButtonRow(
				() => button({
					label: `${s.type}: ${itemMapper[item.Type].type}`,
					customId: "type",
					emoji: itemMapper[item.Type].emoji,
				}),
				() => button({
					label: `${s.price}: ${formatMoney(item.Price, language)}`,
					customId: "price",
				}),
				() => button({
					label: `+${item.MoreAttack} ATK `,
					emoji: EmoteId.Attack,
					customId: "modifierAttack",
				}),
				() => button({
					label: `+${item.MoreDefense} DEF `,
					emoji: EmoteId.Defense,
					customId: "modifierDefense",
				}),
			)
			.addButtonRow(
				() => button({
					label: `${s.percentRobbed} ${item.MoneyAttack} (+${item.MoreMoneyATK})%`,
					customId: "percentRobbed",
				}),
				() => button({
					label: `${s.percentDefended} ${item.MoneyDefense} (+${item.MoreMoneyDEF})%`,
					customId: "percentDefended",
				}),
				() => button({
					label: `${s.special}: ${item.Special.Day ? `☀️ ${s.specialDay}` : item.Special.Night ? `🌙 ${s.specialNight}` : s.no}`,
					customId: "special",
					style: item.Special.Day || item.Special.Night ? ButtonStyle.Primary : ButtonStyle.Secondary,
				}),
			)
			.addButtonRow(
				() => button({
					label: `${s.shop}: ${item.Shop ? s.yes : s.no}`,
					emoji: EmoteId.Shop,
					customId: "shop",
					style: item.Shop ? ButtonStyle.Success : ButtonStyle.Secondary,
				}),
				() => button({
					label: `${s.blackMarket}: ${item.BlackMarket ? s.yes : s.no}`,
					emoji: EmoteId.BlackMarket,
					customId: "blackmarket",
					style: item.BlackMarket ? ButtonStyle.Success : ButtonStyle.Secondary,
				}),
			)
			.addLargeSeparator()
			.addTexts([
				"### Skins",
				Object.entries(item.Skin).map(([bundleId, skin]) => `- ${skin.String} ${BundleList[Number(bundleId)].Description[language]}`).join("\n"),
			])
			.addFooter({
				text: `Id: ${item.Id.toString()} • ${s.usersWithItem}: ${usersWithItem}`,
			});

		return replyWithContainer(interaction, container);
	},
};

const Strings = {
	[Language.English]: {
		typeWeapon: "Weapon",
		typeWearable: "Wearable",
		typeAccessory: "Accessory",
		typeConsumable: "Consumable",
		typeBeatUp: "Beat Up",
		type: "Type",
		price: "Price",
		modifier: "Modifiers",
		percentRobbed: "Rob",
		percentDefended: "Defend",
		special: "Special",
		specialDay: "Only day",
		specialNight: "Only night",
		shop: "Shop",
		blackMarket: "Black market",
		yes: "Yes",
		no: "No",
		usersWithItem: "Users with this item",
	},

	[Language.Portuguese]: {
		typeWeapon: "Arma",
		typeWearable: "Vestível",
		typeAccessory: "Acessório",
		typeConsumable: "Consumível",
		typeBeatUp: "Espancamento",
		type: "Tipo",
		price: "Preço",
		modifier: "Modificadores",
		percentRobbed: "Rouba",
		percentDefended: "Defende",
		special: "Especial",
		specialDay: "Somente dia",
		specialNight: "Somente noite",
		shop: "Loja",
		blackMarket: "Mercado negro",
		yes: "Sim",
		no: "Não",
		usersWithItem: "Usuários com este item",
	},
	[Language.Spanish]: {
		typeWeapon: "Arma",
		typeWearable: "Vestible",
		typeAccessory: "Accesorio",
		typeConsumable: "Consumible",
		typeBeatUp: "Golpeamento",
		type: "Tipo",
		price: "Precio",
		modifier: "Modificadores",
		percentRobbed: "Roba",
		percentDefended: "Defende",
		special: "Especial",
		specialDay: "Solo día",
		specialNight: "Solo noche",
		shop: "Tienda",
		blackMarket: "Mercado negro",
		yes: "Sí",
		no: "No",
		usersWithItem: "Usuarios con este item",
	},
} as const;