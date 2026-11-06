"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const ui_1 = require("#bot/utils/ui");
const Language_1 = require("#core/models/Language");
const Items_1 = require("#core/types/Items");
const emotes_1 = require("#bot/utils/emotes");
const UserItemRepository_1 = require("#core/repositories/UserItemRepository");
const Ids_1 = require("#core/types/Ids");
const Skins_1 = require("#core/types/Skins");
const colors_1 = require("#bot/utils/colors");
const GangColors_1 = require("#core/types/GangColors");
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("item")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "item")
        .setDescription("Check all the stats of a given item!")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Veja todos os dados de um determinado item!")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "¡Consulta todas las estadísticas de un artículo!")
        .addIntegerOption((option) => option
        .setName("item")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "artículo")
        .setDescription("Which item")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Qual item")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Cual artículo")
        .setRequired(true)
        .addChoices(Object.values(Items_1.ItemList).map(item => ({
        name: item.Description[Language_1.Language.English],
        value: item.Id,
        name_localizations: {
            [discord_js_1.Locale.PortugueseBR]: item.Description[Language_1.Language.Portuguese],
            [discord_js_1.Locale.SpanishES]: item.Description[Language_1.Language.Spanish],
        },
    })))),
    async execute(interaction, user, language) {
        const s = Strings[language];
        const itemId = interaction.options.getInteger("item", true);
        const item = Items_1.ItemList[itemId];
        const itemMapper = {
            [Items_1.ItemType.Weapon]: {
                color: discord_js_1.Colors.Red,
                emoji: GangColors_1.GangColor[GangColors_1.GangColorId.Red].Emote.Id,
                type: s.typeWeapon,
            },
            [Items_1.ItemType.Wearable]: {
                color: discord_js_1.Colors.Blue,
                emoji: GangColors_1.GangColor[GangColors_1.GangColorId.Blue].Emote.Id,
                type: s.typeWearable,
            },
            [Items_1.ItemType.Accessory]: {
                color: discord_js_1.Colors.Purple,
                emoji: GangColors_1.GangColor[GangColors_1.GangColorId.Purple].Emote.Id,
                type: s.typeAccessory,
            },
            [Items_1.ItemType.Consumable]: {
                color: discord_js_1.Colors.Green,
                emoji: GangColors_1.GangColor[GangColors_1.GangColorId.Green].Emote.Id,
                type: s.typeConsumable,
            },
            [Items_1.ItemType.BeatUp]: {
                color: colors_1.CrColors.BeatUp,
                emoji: GangColors_1.GangColor[GangColors_1.GangColorId.Orange].Emote.Id,
                type: s.typeBeatUp,
            },
        };
        const usersWithItem = await UserItemRepository_1.UserItemRepository.CountUsersWithItem(item.Id);
        function button(params) {
            const btn = new discord_js_1.ButtonBuilder()
                .setLabel(params.label)
                .setDisabled(true)
                .setCustomId(params.customId)
                .setStyle(params.style ?? discord_js_1.ButtonStyle.Secondary);
            if (params.emoji) {
                btn.setEmoji(params.emoji);
            }
            return btn;
        }
        const container = new CustomContainerBuilder_1.CustomContainerBuilder()
            .setUser(user)
            .setAccentColor(itemMapper[item.Type].color)
            .addTexts([
            `# ${item.Skin[Ids_1.BundleId.Default].String} ${item.Description[language]}`,
            `## ${emotes_1.EmoteString.Attack}${item.Attack} ATK ${emotes_1.EmoteString.Defense}${item.Defense} DEF`,
        ])
            .addLargeSeparator()
            .addButtonRow(() => button({
            label: `${s.type}: ${itemMapper[item.Type].type}`,
            customId: "type",
            emoji: itemMapper[item.Type].emoji,
        }), () => button({
            label: `${s.price}: ${(0, ui_1.formatMoney)(item.Price, language)}`,
            customId: "price",
        }), () => button({
            label: `+${item.MoreAttack} ATK `,
            emoji: emotes_1.EmoteId.Attack,
            customId: "modifierAttack",
        }), () => button({
            label: `+${item.MoreDefense} DEF `,
            emoji: emotes_1.EmoteId.Defense,
            customId: "modifierDefense",
        }))
            .addButtonRow(() => button({
            label: `${s.percentRobbed} ${item.MoneyAttack} (+${item.MoreMoneyATK})%`,
            customId: "percentRobbed",
        }), () => button({
            label: `${s.percentDefended} ${item.MoneyDefense} (+${item.MoreMoneyDEF})%`,
            customId: "percentDefended",
        }), () => button({
            label: `${s.special}: ${item.Special.Day ? `☀️ ${s.specialDay}` : item.Special.Night ? `🌙 ${s.specialNight}` : s.no}`,
            customId: "special",
            style: item.Special.Day || item.Special.Night ? discord_js_1.ButtonStyle.Primary : discord_js_1.ButtonStyle.Secondary,
        }))
            .addButtonRow(() => button({
            label: `${s.shop}: ${item.Shop ? s.yes : s.no}`,
            emoji: emotes_1.EmoteId.Shop,
            customId: "shop",
            style: item.Shop ? discord_js_1.ButtonStyle.Success : discord_js_1.ButtonStyle.Secondary,
        }), () => button({
            label: `${s.blackMarket}: ${item.BlackMarket ? s.yes : s.no}`,
            emoji: emotes_1.EmoteId.BlackMarket,
            customId: "blackmarket",
            style: item.BlackMarket ? discord_js_1.ButtonStyle.Success : discord_js_1.ButtonStyle.Secondary,
        }))
            .addLargeSeparator()
            .addTexts([
            "### Skins",
            Object.entries(item.Skin).map(([bundleId, skin]) => `- ${skin.String} ${Skins_1.BundleList[Number(bundleId)].Description[language]}`).join("\n"),
        ])
            .addFooter({
            text: `Id: ${item.Id.toString()} • ${s.usersWithItem}: ${usersWithItem}`,
        });
        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
    },
};
const Strings = {
    [Language_1.Language.English]: {
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
    [Language_1.Language.Portuguese]: {
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
    [Language_1.Language.Spanish]: {
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
};
//# sourceMappingURL=item.js.map