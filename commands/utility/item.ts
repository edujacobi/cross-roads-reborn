import {
	ChatInputCommandInteraction,
	Colors,
	Locale,
	SlashCommandBuilder,
	SlashCommandIntegerOption,
} from "discord.js";
import { replyInteraction } from "../../utils/logic";
import { formatMoney } from "../../utils/ui";
import { Language } from "../../models/Language";
import { User } from "../../models/User";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { ItemList, ItemType } from "../../interfaces/Items";
import { EmoteString } from "../../utils/emotes";
import { UserItems } from "../../database/UserItems";
import { Op } from "sequelize";
import { BundleId } from "../../interfaces/Ids";
import { BundleList } from "../../interfaces/Skins";

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
				type: s.typeWeapon,
			},
			[ItemType.Wearable]: {
				color: Colors.Blue,
				type: s.typeWearable,
			},
			[ItemType.Accessory]: {
				color: Colors.Purple,
				type: s.typeAccessory,
			},
			[ItemType.Consumable]: {
				color: Colors.Green,
				type: s.typeConsumable,
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

		const itemData: string[][] = [
			["Id", item.Id.toString()],
			[s.type, itemMapper[item.Type].type],
			[s.price, formatMoney(item.Price, language)],
			[s.modifier, `${EmoteString.Attack}+${item.MoreAttack} ATK ${EmoteString.Defense}+${item.MoreDefense} DEF`],
			[s.percentRobbed, `${item.MoneyAttack} (+${item.MoreMoneyATK})%`],
			[s.percentDefended, `${item.MoneyDefense} (+${item.MoreMoneyDEF})%`],
			[s.special, item.Special.Day ? `☀️ ${s.specialDay}` : item.Special.Night ? `🌙 ${s.specialNight}` : s.no],
			[`${EmoteString.Shop} ${s.shop}`, item.Shop ? s.yes : s.no],
			[`${EmoteString.BlackMarket} ${s.blackMarket}`, item.BlackMarket ? s.yes : s.no],
			[`Skins`, Object.entries(item.Skin).map(([bundleId, skin]) => `- ${skin.String} ${BundleList[Number(bundleId)].Description[language]}`).join("\n")],
		];

		const embed = new CustomEmbedBuilder()
			.setColor(itemMapper[item.Type].color)
			.setDescription(`# ${item.Skin[BundleId.Default].String} ${item.Description[language]}
## ${EmoteString.Attack}${item.Attack} ATK ${EmoteString.Defense}${item.Defense} DEF\n`,
			)
			.setFields(itemData.map(([name, value]) => ({
				name,
				value: `-# ${value}`,
				inline: true,
			})))
			.setUserFooter({
				nickname: user.Nickname,
				image: interaction.user.avatarURL(),
				text: `${s.usersWithItem}: ${usersWithItem}`,
			});

		await replyInteraction(interaction, { embeds: [embed] });
	},
};

const Strings = {
	[Language.English]: {
		typeWeapon: "Weapon",
		typeWearable: "Wearable",
		typeAccessory: "Accessory",
		typeConsumable: "Consumable",
		type: "Type",
		price: "Price",
		modifier: "Modifiers",
		percentRobbed: "Rob $ATK$",
		percentDefended: "Defend $DEF$",
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
		type: "Tipo",
		price: "Preço",
		modifier: "Modificadores",
		percentRobbed: "Rouba $ATK$",
		percentDefended: "Defende $DEF$",
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
		type: "Tipo",
		price: "Precio",
		modifier: "Modificadores",
		percentRobbed: "Roba $ATK$",
		percentDefended: "Defende $DEF$",
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