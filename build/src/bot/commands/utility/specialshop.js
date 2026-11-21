"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const UserImageCanvasBuilder_1 = require("#bot/ui/builders/UserImageCanvasBuilder");
const UserRankingCardCanvasBuilder_1 = require("#bot/ui/builders/UserRankingCardCanvasBuilder");
const collectors_1 = require("#bot/utils/collectors");
const colors_1 = require("#bot/utils/colors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const emotes_1 = require("#bot/utils/emotes");
const ui_1 = require("#bot/utils/ui");
const Language_1 = require("#core/models/Language");
const UserAvatarDecoration_1 = require("#core/models/UserAvatarDecoration");
const UserBackgroundDecoration_1 = require("#core/models/UserBackgroundDecoration");
const UserBundle_1 = require("#core/models/UserBundle");
const AvatarDecorations_1 = require("#core/types/AvatarDecorations");
const BackgroundDecorations_1 = require("#core/types/BackgroundDecorations");
const Items_1 = require("#core/types/Items");
const Skins_1 = require("#core/types/Skins");
const discord_js_1 = require("discord.js");
var SpecialShopCategory;
(function (SpecialShopCategory) {
    SpecialShopCategory["Menu"] = "MENU";
    SpecialShopCategory["Skins"] = "SKINS";
    SpecialShopCategory["VIP"] = "VIP";
    SpecialShopCategory["Avatar"] = "AVATAR";
    SpecialShopCategory["Ranking"] = "RANKING";
})(SpecialShopCategory || (SpecialShopCategory = {}));
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("specialshop")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "lojaespecial")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "tiendaespecial")
        .setDescription("Buy permanent customizations using the special coin")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Compre customizações permanentes utilizando a moeda especial")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Comprar personalizaciones permanentes usando la moneda especial"),
    async execute(interaction, user, language) {
        await (0, discordInteractions_1.deferReply)(interaction);
        const s = Strings[language];
        let currentCategory = SpecialShopCategory.Menu;
        let skinsOffset = 0;
        function addHeader(container = new CustomContainerBuilder_1.CustomContainerBuilder()) {
            container.setUser(user)
                .setAccentColor(colors_1.CrColors.SpecialShop)
                .addSectionComponents(section => section
                .addTexts([
                `# ${s.title}`,
                s.permanent,
            ])
                .setThumbnailAccessory(thumb => thumb
                .setURL("https://media.discordapp.net/attachments/1233604589064818808/1458922510782431507/SpecialCoinShop.png")))
                .addLargeSeparator();
            return container;
        }
        function addFooter(container) {
            let footerText = s.youHaveCoins(user.SpecialCoin);
            if (currentCategory === SpecialShopCategory.Skins) {
                const skinBundles = (0, Skins_1.getSkinBundleList)().filter(bundle => bundle.Shop);
                const start = skinsOffset + 1;
                const end = Math.min(skinsOffset + 5, skinBundles.length);
                footerText += ` | ${s.showing(start, end, skinBundles.length)}`;
            }
            container.addFooter({
                text: footerText,
            });
            return container;
        }
        function addReturnButton(container) {
            return container.addButtonRow(btn => btn
                .setLabel(s.goBack)
                .setStyle(discord_js_1.ButtonStyle.Secondary)
                .setCustomId("back_to_section"));
        }
        const VIP_BASE_PRICE = 5_000;
        async function generateDefaultContainer() {
            await user.GetInfo();
            let container = addHeader();
            if (currentCategory === SpecialShopCategory.Menu) {
                container.addTexts([`## ${s.mainMenu}`]);
                container.addButtonRow(btn => btn
                    .setLabel("VIP")
                    .setStyle(discord_js_1.ButtonStyle.Secondary)
                    .setEmoji(emotes_1.EmoteId.VIP)
                    .setCustomId(SpecialShopCategory.VIP), btn => btn
                    .setLabel(s.skinBundles)
                    .setStyle(discord_js_1.ButtonStyle.Secondary)
                    .setCustomId(SpecialShopCategory.Skins), btn => btn
                    .setLabel(s.avatarDecoration)
                    .setStyle(discord_js_1.ButtonStyle.Secondary)
                    .setCustomId(SpecialShopCategory.Avatar), btn => btn
                    .setLabel(s.rankingBackground)
                    .setStyle(discord_js_1.ButtonStyle.Secondary)
                    .setCustomId(SpecialShopCategory.Ranking));
                container.addLargeSeparator()
                    .addTexts([
                    `### ${s.howToAcquireTitle}`,
                    `-# ${s.howToAcquireDescription}`,
                ]);
            }
            else if (currentCategory === SpecialShopCategory.Skins) {
                container.addTexts([`## ${s.skinBundles}`]);
                const skinBundles = (0, Skins_1.getSkinBundleList)().filter(bundle => bundle.Shop);
                const pageBundles = skinBundles.slice(skinsOffset, skinsOffset + 5);
                for (let idx = 0; idx < pageBundles.length; idx++) {
                    const bundle = pageBundles[idx];
                    if (bundle.Items.length > 0) {
                        const itemEmotes = bundle.Items.map(item => Items_1.ItemList[item].Skin[bundle.Id].String);
                        const userHasBundle = await UserBundle_1.UserBundle.HasBundle(user.Id, bundle.Id);
                        const meanValuePerSkin = bundle.Price / bundle.Items.length;
                        let rarityEmote = emotes_1.EmoteString.Common;
                        if (meanValuePerSkin > 500) {
                            rarityEmote = emotes_1.EmoteString.Mythic;
                        }
                        else if (meanValuePerSkin > 400) {
                            rarityEmote = emotes_1.EmoteString.Legendary;
                        }
                        else if (meanValuePerSkin > 300) {
                            rarityEmote = emotes_1.EmoteString.Rare;
                        }
                        else if (meanValuePerSkin > 200) {
                            rarityEmote = emotes_1.EmoteString.Uncommon;
                        }
                        container.addSectionComponents(section => section
                            .addTexts([
                            `### ${rarityEmote}${bundle.Description[language]}`,
                            `-# ${s.howManyItems(itemEmotes)}`,
                            `# ${itemEmotes.join(" ")}`,
                        ])
                            .setButtonAccessory(new discord_js_1.ButtonBuilder()
                            .setLabel((0, ui_1.formatMoney)(bundle.Price, language, ""))
                            .setEmoji(emotes_1.EmoteId.SpecialCoinShop)
                            .setStyle(discord_js_1.ButtonStyle.Secondary)
                            .setDisabled(userHasBundle)
                            .setCustomId("buy" + bundle.Id)));
                        if (idx !== pageBundles.length - 1) {
                            container.addLargeSeparator();
                        }
                    }
                }
            }
            else if (currentCategory === SpecialShopCategory.VIP) {
                container.addSectionComponents(section => section
                    .addTexts([
                    `# VIP`,
                    s.vipDescription,
                    `-# ${s.vipMoreInfo}`,
                ])
                    .setThumbnailAccessory(thumb => thumb
                    .setURL("https://media.discordapp.net/attachments/531174573463306240/799060089503875072/VIP.png")));
                const vipButtons = [];
                for (let idx = 1; idx <= 3; idx++) {
                    vipButtons.push((btn) => btn
                        .setLabel(`${s.months(idx)}: ${(0, ui_1.formatMoney)(idx * VIP_BASE_PRICE, language, "")}`)
                        .setEmoji(emotes_1.EmoteId.SpecialCoinShop)
                        .setStyle(discord_js_1.ButtonStyle.Secondary)
                        .setCustomId("vip" + idx));
                }
                container.addButtonRow(...vipButtons);
            }
            else if (currentCategory === SpecialShopCategory.Avatar) {
                container.addSectionComponents(section => section
                    .addTexts([
                    `# ${s.avatarDecoration}`,
                    s.defeatDecoration,
                    `-# ${s.testDecoration}`,
                ])
                    .setThumbnailAccessory(thumb => thumb
                    .setURL("https://media.discordapp.net/attachments/1455628323848851639/1458923128968445983/preview.webp")));
                const avatarDecorations = (0, AvatarDecorations_1.getAvatarDecorationList)().filter(decoration => decoration.Shop).sort((a, b) => a.Price - b.Price);
                const avatarDecorationsChunks = [];
                for (let i = 0; i < avatarDecorations.length; i += 5) {
                    avatarDecorationsChunks.push(avatarDecorations.slice(i, i + 5));
                }
                for (const chunk of avatarDecorationsChunks) {
                    const buttons = await Promise.all(chunk.map(async (decoration) => {
                        const disabled = await UserAvatarDecoration_1.UserAvatarDecoration.HasAvatarDecoration(user.Id, decoration.Id);
                        return (btn) => btn
                            .setLabel(`${decoration.Description[language]}: ${(0, ui_1.formatMoney)(decoration.Price, language, "")}`)
                            .setEmoji(emotes_1.EmoteId.SpecialCoinShop)
                            .setStyle(discord_js_1.ButtonStyle.Secondary)
                            .setDisabled(disabled)
                            .setCustomId("decoration" + decoration.Id);
                    }));
                    container.addButtonRow(...buttons);
                }
            }
            else if (currentCategory === SpecialShopCategory.Ranking) {
                container
                    .addTexts([
                    `# ${s.rankingBackground}`,
                    s.defeatBackground,
                    `-# ${s.testBackground}`,
                ])
                    .addImage("https://media.discordapp.net/attachments/777715925382201364/1491561252055416892/image.png");
                const backgroundDecorations = (0, BackgroundDecorations_1.getBackgroundDecorationList)().filter(bg => bg.Shop).sort((a, b) => a.Price - b.Price);
                const backgroundChunks = [];
                for (let i = 0; i < backgroundDecorations.length; i += 5) {
                    backgroundChunks.push(backgroundDecorations.slice(i, i + 5));
                }
                for (const chunk of backgroundChunks) {
                    const buttons = await Promise.all(chunk.map(async (bg) => {
                        const disabled = await UserBackgroundDecoration_1.UserBackgroundDecoration.HasBackgroundDecoration(user.Id, bg.Id);
                        return (btn) => btn
                            .setLabel(`${bg.Description[language]}: ${(0, ui_1.formatMoney)(bg.Price, language, "")}`)
                            .setEmoji(emotes_1.EmoteId.SpecialCoinShop)
                            .setStyle(discord_js_1.ButtonStyle.Secondary)
                            .setDisabled(disabled)
                            .setCustomId("background" + bg.Id);
                    }));
                    container.addButtonRow(...buttons);
                }
            }
            if (currentCategory !== SpecialShopCategory.Menu) {
                container.addLargeSeparator();
                if (currentCategory === SpecialShopCategory.Skins) {
                    const skinBundles = (0, Skins_1.getSkinBundleList)().filter(bundle => bundle.Shop);
                    container.addButtonRow(btn => btn
                        .setLabel(s.previous)
                        .setStyle(discord_js_1.ButtonStyle.Secondary)
                        .setEmoji("⬅️")
                        .setCustomId("prev_skins")
                        .setDisabled(skinsOffset === 0), btn => btn
                        .setLabel(s.goBack)
                        .setStyle(discord_js_1.ButtonStyle.Secondary)
                        .setCustomId("back"), btn => btn
                        .setLabel(s.next)
                        .setStyle(discord_js_1.ButtonStyle.Secondary)
                        .setEmoji("➡️")
                        .setCustomId("next_skins")
                        .setDisabled(skinsOffset + 5 >= skinBundles.length));
                }
                else {
                    container.addButtonRow(btn => btn
                        .setLabel(s.goBack)
                        .setStyle(discord_js_1.ButtonStyle.Secondary)
                        .setCustomId("back"));
                }
            }
            container = addFooter(container);
            return container;
        }
        let container = await generateDefaultContainer();
        const response = await (0, discordInteractions_1.replyWithContainer)(interaction, container);
        const collector = (0, collectors_1.createButtonCollector)(interaction, response);
        collector?.on("end", async () => {
            await (0, collectors_1.disableButtons)(interaction, container);
        });
        collector?.on("collect", async (btn) => {
            await (0, discordInteractions_1.deferUpdate)(btn);
            if (btn.customId === SpecialShopCategory.Skins ||
                btn.customId === SpecialShopCategory.VIP ||
                btn.customId === SpecialShopCategory.Avatar ||
                btn.customId === SpecialShopCategory.Ranking) {
                currentCategory = btn.customId;
                container = await generateDefaultContainer();
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
            if (btn.customId === "back") {
                currentCategory = SpecialShopCategory.Menu;
                skinsOffset = 0;
                container = await generateDefaultContainer();
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
            else if (btn.customId === "prev_skins") {
                skinsOffset = Math.max(0, skinsOffset - 5);
                container = await generateDefaultContainer();
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
            else if (btn.customId === "next_skins") {
                skinsOffset += 5;
                container = await generateDefaultContainer();
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
            else if (btn.customId.includes("confirmbuy")) {
                const bundleId = Number(btn.customId.replace("confirmbuy", ""));
                const bundle = Skins_1.BundleList[bundleId];
                await user.GetInfo();
                const userHasBundle = await UserBundle_1.UserBundle.HasBundle(user.Id, bundle.Id);
                if (userHasBundle) {
                    container = addHeader()
                        .addTexts([`${s.alreadyHaveBundle} **${bundle.Description[language]}**!`]);
                    addReturnButton(container);
                    container = addFooter(container);
                    return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                }
                if (user.SpecialCoin < bundle.Price) {
                    container = addHeader()
                        .addTexts([s.dontHaveCoins(bundle.Price)]);
                    addReturnButton(container);
                    container = addFooter(container);
                    return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                }
                const success = await user.BuySkinBundle(bundleId);
                if (!success) {
                    container = addHeader()
                        .addTexts([`${s.error} **${bundle.Description[language]}**`]);
                    addReturnButton(container);
                    container = addFooter(container);
                    return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                }
                container = addHeader()
                    .addTexts([`${s.bundleBought} **${bundle.Description[language]}**!`]);
                addReturnButton(container);
                container = addFooter(container);
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
            else if (btn.customId.includes("buy")) {
                const bundleId = Number(btn.customId.replace("buy", ""));
                const bundle = Skins_1.BundleList[bundleId];
                const itemData = bundle.Items.map(item => `- ${Items_1.ItemList[item].Skin[bundle.Id].String} ${Items_1.ItemList[item].Description[language]}`);
                const canBuy = bundle.Price <= user.SpecialCoin;
                container = addHeader(new CustomContainerBuilder_1.CustomContainerBuilder())
                    .addTexts([
                    `## ${s.skinBundleUnit} - ${bundle.Description[language]}`,
                    `${s.price}: ${emotes_1.EmoteString.SpecialCoinShop}${(0, ui_1.formatMoney)(bundle.Price, language, "")}`,
                    `-# ${s.content}:\n${itemData.join("\n")}`,
                ])
                    .addButtonRow(btn => btn
                    .setLabel(s.goBack)
                    .setStyle(discord_js_1.ButtonStyle.Secondary)
                    .setCustomId("back_to_section"), btn => btn
                    .setLabel(s.buy)
                    .setStyle(discord_js_1.ButtonStyle.Success)
                    .setDisabled(!canBuy)
                    .setCustomId("confirmbuy" + bundle.Id));
                container = addFooter(container);
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
            else if (btn.customId === "back_to_section") {
                container = await generateDefaultContainer();
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
            else if (btn.customId.includes("confirmvip")) {
                const vipMonths = Number(btn.customId.replace("confirmvip", ""));
                const price = vipMonths * VIP_BASE_PRICE;
                await user.GetInfo();
                if (user.SpecialCoin < price) {
                    container = addHeader()
                        .addTexts([s.dontHaveCoins(price)]);
                    addReturnButton(container);
                    container = addFooter(container);
                    return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                }
                await user.BuyVip(vipMonths);
                container = addHeader()
                    .addTexts([`${s.vipBought(vipMonths)}`]);
                addReturnButton(container);
                container = addFooter(container);
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
            else if (btn.customId.includes("vip")) {
                const vipMonths = Number(btn.customId.replace("vip", ""));
                const price = vipMonths * VIP_BASE_PRICE;
                const canBuy = price <= user.SpecialCoin;
                container = addHeader(new CustomContainerBuilder_1.CustomContainerBuilder())
                    .addTexts([
                    `## ${emotes_1.EmoteString.VIP} VIP - ${s.months(vipMonths)}`,
                    `${s.price}: ${emotes_1.EmoteString.SpecialCoinShop}${(0, ui_1.formatMoney)(price, language, "")}`,
                ])
                    .addButtonRow(btn => btn
                    .setLabel(s.goBack)
                    .setStyle(discord_js_1.ButtonStyle.Secondary)
                    .setCustomId("back_to_section"), btn => btn
                    .setLabel(s.buy)
                    .setStyle(discord_js_1.ButtonStyle.Success)
                    .setDisabled(!canBuy)
                    .setCustomId("confirmvip" + vipMonths));
                container = addFooter(container);
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
            else if (btn.customId.includes("confirmdecoration")) {
                const decorationId = Number(btn.customId.replace("confirmdecoration", ""));
                const decoration = AvatarDecorations_1.AvatarDecorationList[decorationId];
                await user.GetInfo();
                const userHasDecoration = await UserAvatarDecoration_1.UserAvatarDecoration.HasAvatarDecoration(user.Id, decoration.Id);
                if (userHasDecoration) {
                    container = addHeader()
                        .addTexts([`${s.alreadyHaveDecoration} **${decoration.Description[language]}**!`]);
                    addReturnButton(container);
                    container = addFooter(container);
                    return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                }
                if (user.SpecialCoin < decoration.Price) {
                    container = addHeader()
                        .addTexts([s.dontHaveCoins(decoration.Price)]);
                    addReturnButton(container);
                    container = addFooter(container);
                    return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                }
                const success = await user.BuyAvatarDecoration(decorationId);
                if (!success) {
                    container = addHeader()
                        .addTexts([`${s.error} **${decoration.Description[language]}**`]);
                    addReturnButton(container);
                    container = addFooter(container);
                    return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                }
                container = addHeader()
                    .addTexts([
                    `${s.decorationBought} **${decoration.Description[language]}**!`,
                    `-# ${s.activateDecoration}`,
                ]);
                addReturnButton(container);
                container = addFooter(container);
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
            else if (btn.customId.includes("decoration")) {
                const decorationId = Number(btn.customId.replace("decoration", ""));
                const decoration = AvatarDecorations_1.AvatarDecorationList[decorationId];
                const canBuy = decoration.Price <= user.SpecialCoin;
                const previewImage = await new UserImageCanvasBuilder_1.UserImageCanvasBuilder(user, interaction.user.avatarURL({ size: 512 }))
                    .SetDecoration(decoration.Id)
                    .GenerateImage();
                const previewImageFile = new discord_js_1.AttachmentBuilder(previewImage, { name: "preview.webp" });
                container = addHeader(new CustomContainerBuilder_1.CustomContainerBuilder())
                    .addSectionComponents(section => section
                    .addTexts([
                    `## ${s.avatarDecoration} - ${decoration.Description[language]}`,
                    `${s.price}: ${emotes_1.EmoteString.SpecialCoinShop}${(0, ui_1.formatMoney)(decoration.Price, language, "")}`,
                ])
                    .setThumbnailAccessory(preview => preview
                    .setURL("attachment://preview.webp")))
                    .addButtonRow(btn => btn
                    .setLabel(s.goBack)
                    .setStyle(discord_js_1.ButtonStyle.Secondary)
                    .setCustomId("back_to_section"), btn => btn
                    .setLabel(s.buy)
                    .setStyle(discord_js_1.ButtonStyle.Success)
                    .setDisabled(!canBuy)
                    .setCustomId("confirmdecoration" + decoration.Id));
                container = addFooter(container);
                await (0, discordInteractions_1.replyInteraction)(interaction, {
                    components: [container],
                    files: [previewImageFile],
                    flags: discord_js_1.MessageFlags.IsComponentsV2,
                });
            }
            else if (btn.customId.includes("confirmbackground")) {
                const bgId = Number(btn.customId.replace("confirmbackground", ""));
                const bg = BackgroundDecorations_1.BackgroundDecorationList[bgId];
                await user.GetInfo();
                const userHasBg = await UserBackgroundDecoration_1.UserBackgroundDecoration.HasBackgroundDecoration(user.Id, bg.Id);
                if (userHasBg) {
                    container = addHeader()
                        .addTexts([`${s.alreadyHaveBackground} **${bg.Description[language]}**!`]);
                    addReturnButton(container);
                    container = addFooter(container);
                    return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                }
                if (user.SpecialCoin < bg.Price) {
                    container = addHeader()
                        .addTexts([s.dontHaveCoins(bg.Price)]);
                    addReturnButton(container);
                    container = addFooter(container);
                    return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                }
                const success = await user.BuyBackgroundDecoration(bgId);
                if (!success) {
                    container = addHeader()
                        .addTexts([`${s.error} **${bg.Description[language]}**`]);
                    addReturnButton(container);
                    container = addFooter(container);
                    return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                }
                container = addHeader()
                    .addTexts([
                    `${s.backgroundBought} **${bg.Description[language]}**!`,
                    `-# ${s.activateDecoration}`,
                ]);
                addReturnButton(container);
                container = addFooter(container);
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
            else if (btn.customId.includes("background")) {
                const bgId = Number(btn.customId.replace("background", ""));
                const bg = BackgroundDecorations_1.BackgroundDecorationList[bgId];
                const canBuy = bg.Price <= user.SpecialCoin;
                const previewImage = await new UserRankingCardCanvasBuilder_1.UserRankingCardCanvasBuilder(user, 1, "Cr$ 1.500.000", interaction.user.avatarURL({ size: 256 }))
                    .SetDecoration(bgId)
                    .GenerateImage();
                const previewImageFile = new discord_js_1.AttachmentBuilder(previewImage, { name: "preview_rank.webp" });
                container = addHeader(new CustomContainerBuilder_1.CustomContainerBuilder())
                    .addTexts([
                    `## ${s.rankingBackground} - ${bg.Description[language]}`,
                    `${s.price}: ${emotes_1.EmoteString.SpecialCoinShop}${(0, ui_1.formatMoney)(bg.Price, language, "")}`,
                ])
                    .addImage("attachment://preview_rank.webp")
                    .addButtonRow(btn => btn
                    .setLabel(s.goBack)
                    .setStyle(discord_js_1.ButtonStyle.Secondary)
                    .setCustomId("back_to_section"), btn => btn
                    .setLabel(s.buy)
                    .setStyle(discord_js_1.ButtonStyle.Success)
                    .setDisabled(!canBuy)
                    .setCustomId("confirmbackground" + bg.Id));
                container = addFooter(container);
                await (0, discordInteractions_1.replyInteraction)(interaction, {
                    components: [container],
                    files: [previewImageFile],
                    flags: discord_js_1.MessageFlags.IsComponentsV2,
                });
            }
        });
    },
};
const Strings = {
    [Language_1.Language.English]: {
        title: "Special shop",
        mainMenu: "Selection Menu",
        permanent: "All customizations are permanent!",
        youHaveCoins: (coins) => `You have ${emotes_1.EmoteString.SpecialCoinShop}${(0, ui_1.formatMoney)(coins, Language_1.Language.English, "")} Special Coins`,
        skinBundles: "Skin Bundles",
        howManyItems: (itemArray) => `${itemArray.length} ${itemArray.length === 1 ? "item" : "items"}`,
        alreadyHaveBundle: "You already own the skin bundle",
        alreadyHaveDecoration: "You already own the avatar decoration",
        dontHaveCoins: (price) => `You don't have ${emotes_1.EmoteString.SpecialCoinShop}${(0, ui_1.formatMoney)(price, Language_1.Language.English, "")} to buy this item`,
        error: "An error occurred while trying to buy this item",
        bundleBought: "You bought the skin bundle",
        decorationBought: "You bought the avatar decoration",
        activateDecoration: "Activate in `/decorations`",
        skinBundleUnit: "Skin Bundle",
        price: "Price",
        content: "Content",
        goBack: "Go back",
        months: (months) => `${months} ${months === 1 ? "Month" : "Months"}`,
        vipDescription: `All that a new aristrocrat needs!`,
        vipMoreInfo: `For more information, see \`/vip\``,
        vipBought: (months) => `You bought **${months} ${months === 1 ? "Month" : "Months"}** of ${emotes_1.EmoteString.VIP} VIP!`,
        buy: "Buy",
        avatarDecoration: "Avatar decorations",
        defeatDecoration: "Defeat your opponents in style",
        testDecoration: "You can preview the decor before you buy",
        rankingBackground: "Ranking Backgrounds",
        defeatBackground: "Custom backgrounds for your ranking card",
        testBackground: "You can preview the background before you buy",
        alreadyHaveBackground: "You already own the ranking background",
        backgroundBought: "You bought the ranking background",
        howToAcquireTitle: "How to acquire",
        howToAcquireDescription: "On the official server, in the #special-coins channel",
        showing: (start, end, howMany) => `Showing ${start} - ${end} of ${howMany}`,
        previous: "Previous",
        next: "Next",
    },
    [Language_1.Language.Portuguese]: {
        title: "Loja especial",
        mainMenu: "Menu de Seleção",
        permanent: "Todas as customizações são permanentes!",
        youHaveCoins: (coins) => `Você possui ${emotes_1.EmoteString.SpecialCoinShop}${(0, ui_1.formatMoney)(coins, Language_1.Language.Portuguese, "")} Moedas Especiais`,
        skinBundles: "Pacotes de skins",
        howManyItems: (itemArray) => `${itemArray.length} ${itemArray.length === 1 ? "item" : "itens"}`,
        alreadyHaveBundle: "Você já possui o pacote de skins",
        alreadyHaveDecoration: "Você já possui a decoração de avatar",
        dontHaveCoins: (price) => `Você não possui ${emotes_1.EmoteString.SpecialCoinShop}${(0, ui_1.formatMoney)(price, Language_1.Language.Portuguese, "")} para comprar este item`,
        error: "Ocorreu um erro ao tentar comprar este item",
        bundleBought: "Você comprou o pacote de skins",
        decorationBought: "Você comprou a decoração de avatar",
        activateDecoration: "Ative em `/decorações`",
        skinBundleUnit: "Pacote de skins",
        price: "Preço",
        content: "Conteúdo",
        goBack: "Voltar",
        months: (months) => `${months} ${months === 1 ? "Mês" : "Meses"}`,
        vipDescription: `Tudo que um novo aristocrata precisa!`,
        vipMoreInfo: `Para mais informações, veja \`/vip\``,
        vipBought: (months) => `Você comprou **${months} ${months === 1 ? "Mês" : "Meses"}** de ${emotes_1.EmoteString.VIP} VIP!`,
        buy: "Comprar",
        avatarDecoration: "Decorações de avatar",
        defeatDecoration: "Derrote seus oponentes com estilo",
        testDecoration: "Você pode pré visualizar a decoração antes de comprar",
        rankingBackground: "Fundos de Ranking",
        defeatBackground: "Fundos customizados para o seu cartão de ranking",
        testBackground: "Você pode pré visualizar o fundo antes de comprar",
        alreadyHaveBackground: "Você já possui o fundo de ranking",
        backgroundBought: "Você comprou o fundo de ranking",
        howToAcquireTitle: "Como adquirir",
        howToAcquireDescription: "No servidor oficial, no canal #moedas-especiais",
        showing: (start, end, howMany) => `Exibindo ${start} - ${end} de ${howMany}`,
        previous: "Anterior",
        next: "Próximo",
    },
    [Language_1.Language.Spanish]: {
        title: "Comercio especial",
        mainMenu: "Menú de Selección",
        permanent: "¡Todas las personalizaciones son permanentes!",
        youHaveCoins: (coins) => `Tienes ${emotes_1.EmoteString.SpecialCoinShop}${(0, ui_1.formatMoney)(coins, Language_1.Language.Spanish, "")} Monedas Especiales`,
        skinBundles: "Paquetes de skins",
        howManyItems: (itemArray) => `${itemArray.length} ${itemArray.length === 1 ? "artículo" : "artículos"}`,
        alreadyHaveBundle: "Ya tienes el paquete de skins",
        alreadyHaveDecoration: "Ya tienes la decoración del avatar",
        dontHaveCoins: (price) => `No tienes ${emotes_1.EmoteString.SpecialCoinShop}${(0, ui_1.formatMoney)(price, Language_1.Language.Spanish, "")} para comprar este artículo`,
        error: "Ocurrió un error al intentar comprar este artículo",
        bundleBought: "Compraste el paquete de skins",
        decorationBought: "Compraste la decoración del avatar",
        activateDecoration: "Activar en `/decorations`",
        skinBundleUnit: "Paquete de skins",
        price: "Precio",
        content: "Contenido",
        goBack: "Volver",
        months: (months) => `${months} ${months === 1 ? "Mes" : "Meses"}`,
        vipDescription: `Todo lo que necesita un nuevo aristócrata!`,
        vipMoreInfo: `Para obtener más información, consulte \`/vip\``,
        vipBought: (months) => `Compraste **${months} ${months === 1 ? "Mes" : "Meses"}** de ${emotes_1.EmoteString.VIP} VIP!`,
        buy: "Comprar",
        avatarDecoration: "Decoraciones de avatar",
        defeatDecoration: "Derrota a tus oponentes con estilo",
        testDecoration: "Puedes obtener una vista previa de la decoración antes de comprarla",
        rankingBackground: "Fondos de Ranking",
        defeatBackground: "Fondos personalizados para tu tarjeta de ranking",
        testBackground: "Puedes previsualizar el fondo antes de comprarlo",
        alreadyHaveBackground: "Ya tienes el fondo de ranking",
        backgroundBought: "Compraste el fondo de ranking",
        howToAcquireTitle: "Cómo adquirir",
        howToAcquireDescription: "En el servidor oficial, en el canal #special-coins.",
        showing: (start, end, howMany) => `Mostrando ${start} - ${end} de ${howMany}`,
        previous: "Anterior",
        next: "Siguiente",
    },
};
//# sourceMappingURL=specialshop.js.map