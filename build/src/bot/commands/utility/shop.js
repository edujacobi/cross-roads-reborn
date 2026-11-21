"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const Shop_1 = require("#core/models/Shop");
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const ui_1 = require("#bot/utils/ui");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const emotes_1 = require("#bot/utils/emotes");
const Items_1 = require("#core/types/Items");
const Language_1 = require("#core/models/Language");
const collectors_1 = require("#bot/utils/collectors");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("shop")
        .setDescription("Open the shop to buy something")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "loja")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "tienda")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Abra a loja para comprar alguma coisa")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Abrir la tienda para comprar algo"),
    async execute(interaction, user, language, shopOverride) {
        await (0, discordInteractions_1.deferReply)(interaction);
        const shop = shopOverride || new Shop_1.Shop(user);
        const s = Strings[language];
        let currentPage = 0;
        function addContainerHeader() {
            return new CustomContainerBuilder_1.CustomContainerBuilder()
                .setUser(user)
                .setAccentColor(shop.Color)
                .addSectionComponents(header => header
                .addTexts([
                `# ${shop.Title}`,
                shop.Description,
            ])
                .setThumbnailAccessory(thumb => thumb
                .setURL(shop.Image)))
                .addLargeSeparator();
        }
        function addContainerFooter(container) {
            container.addFooter({
                text: (0, ui_1.formatMoney)(user.Money, user.Language),
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
                if (item.Type == Items_1.ItemType.Weapon) {
                    value = `-# ${emotes_1.EmoteString.Attack}${item.Attack} ATK ${emotes_1.EmoteString.Defense}${item.Defense} DEF`;
                }
                if (item.Type == Items_1.ItemType.Wearable || item.Type == Items_1.ItemType.Consumable) {
                    const textField = [];
                    if (item.MoreAttack) {
                        textField.push(`${emotes_1.EmoteString.Attack}+${item.MoreAttack} ATK`);
                    }
                    if (item.MoreDefense) {
                        textField.push(`${emotes_1.EmoteString.Defense}+${item.MoreDefense} DEF`);
                    }
                    if (item.MoreMoneyATK) {
                        textField.push(`${emotes_1.EmoteString.Attack}+${item.MoreMoneyATK} $ATK$`);
                    }
                    if (item.MoreMoneyDEF) {
                        textField.push(`${emotes_1.EmoteString.Defense}+${item.MoreMoneyDEF} $DEF$`);
                    }
                    if (item.Special.Day) {
                        textField.push(`(${s.day})`);
                    }
                    if (item.Special.Night) {
                        textField.push(`(${s.night})`);
                    }
                    if (item.Type == Items_1.ItemType.Consumable) {
                        textField.push(`(${s.consumable})`);
                    }
                    value = `-# ${textField.join(" ")}`;
                }
                if (item.Type == Items_1.ItemType.Accessory) {
                    value = `-# +30% ${s.escape}`;
                }
                const userItem = user.Items.find(i => i.Id == item.Id);
                const remainigTime = userItem?.RemainingTime;
                const quantity = userItem?.Quantity;
                const isConsumable = item.Type === Items_1.ItemType.Consumable;
                container.addSectionComponents(section => section
                    .addTexts([
                    `### ${user.GetItemSkin(item)} ${item.Description[user.Language]}`,
                    value,
                    (!isConsumable && remainigTime) ? `-# ${s.yourItemEnds} ${(0, discord_js_1.time)(remainigTime, discord_js_1.TimestampStyles.RelativeTime)}` : "",
                    (isConsumable && quantity) ? `-# ${s.youHave} ${quantity}` : "",
                ].filter(Boolean))
                    .setButtonAccessory(new discord_js_1.ButtonBuilder()
                    .setLabel((0, ui_1.formatMoney)(item.Price, user.Language))
                    .setCustomId(`buy${item.Id}`)
                    .setDisabled(item.Price > user.Money)
                    .setStyle(discord_js_1.ButtonStyle.Secondary)));
                if (i != currentPageItems.length - 1) {
                    container.addLargeSeparator();
                }
            }
            if (pages.length > 1) {
                container.addLargeSeparator();
                container.addButtonRow(btn => btn
                    .setLabel(s.previous)
                    .setStyle(discord_js_1.ButtonStyle.Secondary)
                    .setCustomId("previous")
                    .setEmoji("⬅️")
                    .setDisabled(currentPage === 0), btn => btn
                    .setLabel(s.next)
                    .setStyle(discord_js_1.ButtonStyle.Secondary)
                    .setCustomId("next")
                    .setEmoji("➡️")
                    .setDisabled(currentPage === pages.length - 1));
            }
            addContainerFooter(container);
            return container;
        }
        let container = generateContainer();
        const response = await (0, discordInteractions_1.replyWithContainer)(interaction, container);
        const collector = (0, collectors_1.createButtonCollector)(interaction, response);
        let isProcessing = false;
        collector?.on("collect", async (btn) => {
            if (isProcessing)
                return;
            isProcessing = true;
            try {
                await (0, discordInteractions_1.deferUpdate)(btn);
                if (btn.customId === "back") {
                    container = generateContainer();
                    return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                }
                if (btn.customId.includes("buy")) {
                    await user.GetInfo();
                    const itemId = Number(btn.customId.replace("buy", ""));
                    const item = Items_1.ItemList[itemId];
                    const { canBuy, message } = await shop.CanUserBuyItem(item);
                    if (!canBuy) {
                        container = addContainerHeader();
                        container
                            .addTexts([
                            message,
                        ])
                            .addButtonRow(btn => btn
                            .setLabel(s.back)
                            .setStyle(discord_js_1.ButtonStyle.Secondary)
                            .setCustomId("back"));
                        addContainerFooter(container);
                        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                    }
                    await user.BuyItem(item);
                    const userItem = user.Items.find(i => i.Id == item.Id);
                    const remainigTime = userItem?.RemainingTime;
                    const quantity = userItem?.Quantity;
                    const isConsumable = item.Type === Items_1.ItemType.Consumable;
                    container = addContainerHeader();
                    container
                        .addTexts([
                        s.itemBought(`${user.GetItemSkin(item)} ${item.Description[user.Language]}`),
                        (!isConsumable && remainigTime) ? `-# ${s.yourItemEnds} ${(0, discord_js_1.time)(remainigTime, discord_js_1.TimestampStyles.RelativeTime)}` : "",
                        (isConsumable && quantity) ? `-# ${s.youHave} ${quantity}` : "",
                    ].filter(Boolean))
                        .addButtonRow(btn => btn
                        .setLabel(s.back)
                        .setStyle(discord_js_1.ButtonStyle.Secondary)
                        .setCustomId("back"), btn => btn
                        .setLabel(s.buyMore(item.Price))
                        .setStyle(discord_js_1.ButtonStyle.Success)
                        .setCustomId(`buy${itemId}`));
                    addContainerFooter(container);
                    return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                }
                if (btn.customId === "previous") {
                    currentPage -= 1;
                    container = generateContainer();
                    return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                }
                else if (btn.customId === "next") {
                    currentPage += 1;
                    container = generateContainer();
                    return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                }
            }
            finally {
                isProcessing = false;
            }
        });
        collector?.on("end", async () => {
            await (0, collectors_1.disableButtons)(interaction, container);
        });
    },
};
const Strings = {
    [Language_1.Language.English]: {
        day: "day",
        night: "night",
        escape: "escape",
        consumable: "consumable",
        yourItemEnds: "Your item ends",
        youHave: "You have",
        itemBought: (itemName) => `You bought **${itemName}**!`,
        buyMore: (price) => `Buy more! ${(0, ui_1.formatMoney)(price, Language_1.Language.English)}`,
        back: "Go back",
        next: "Next",
        previous: "Previous",
    },
    [Language_1.Language.Portuguese]: {
        day: "dia",
        night: "noite",
        escape: "fuga",
        consumable: "consumível",
        yourItemEnds: "Seu item acaba",
        youHave: "Você possui",
        itemBought: (itemName) => `Você comprou **${itemName}**!`,
        buyMore: (price) => `Comprar mais! ${(0, ui_1.formatMoney)(price, Language_1.Language.Portuguese)}`,
        back: "Voltar",
        next: "Próximo",
        previous: "Anterior",
    },
    [Language_1.Language.Spanish]: {
        day: "día",
        night: "noche",
        escape: "fuga",
        consumable: "consumible",
        yourItemEnds: "Tu item acaba",
        youHave: "Posees",
        itemBought: (itemName) => `Tú compraste **${itemName}**!`,
        buyMore: (price) => `¡Comprar más! ${(0, ui_1.formatMoney)(price, Language_1.Language.Spanish)}`,
        back: "Volver",
        next: "Siguiente",
        previous: "Anterior",
    },
};
//# sourceMappingURL=shop.js.map