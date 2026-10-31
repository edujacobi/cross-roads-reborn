"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("#bot/client");
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const GangImageCanvasBuilder_1 = require("#bot/ui/builders/GangImageCanvasBuilder");
const UserImageCanvasBuilder_1 = require("#bot/ui/builders/UserImageCanvasBuilder");
const collectors_1 = require("#bot/utils/collectors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const emotes_1 = require("#bot/utils/emotes");
const invUtils_1 = require("#bot/utils/invUtils");
const ui_1 = require("#bot/utils/ui");
const userUtils_1 = require("#bot/utils/userUtils");
const Language_1 = require("#core/models/Language");
const UserBadge_1 = require("#core/models/UserBadge");
const Classes_1 = require("#core/types/Classes");
const GangColors_1 = require("#core/types/GangColors");
const Investments_1 = require("#core/types/Investments");
const Items_1 = require("#core/types/Items");
const date_fns_1 = require("date-fns");
const discord_js_1 = require("discord.js");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("inv")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "inv")
        .setDescription("See the inventory of a user")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Veja o inventário de um usuário")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Ver el inventario de un usuario")
        .addStringOption(target => target
        .setName("target")
        .setDescription("The user")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "alvo")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "objetivo")
        .setMinLength(3)
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "O usuário")),
    async execute(interaction, user, language) {
        const nameOrId = interaction.options.getString("target");
        const FEATURE_FLAG_NEW_INV = true;
        await (0, discordInteractions_1.deferReply)(interaction);
        const target = nameOrId ? await (0, userUtils_1.searchUser)(nameOrId, interaction, language) : user;
        const _user = target ? await (0, client_1.getClient)().users.fetch(target.Id) : interaction.user;
        if (!target) {
            return;
        }
        if (FEATURE_FLAG_NEW_INV) {
            const inventory = new invUtils_1.Inventory(interaction, target, _user, language);
            await inventory.Load();
            await inventory.Generate();
            return;
        }
        const s = Strings[language];
        // eslint-disable-next-line prefer-const
        let [badges, gang] = await Promise.all([
            UserBadge_1.UserBadge.GetList(target.Id),
            target.GetGang(),
        ]);
        if (target.IsVip()) {
            badges = UserBadge_1.UserBadge.AddVIPBadgeInList(badges, target, language);
        }
        const userImage = await new UserImageCanvasBuilder_1.UserImageCanvasBuilder(target, _user.avatarURL({ size: 512 }))
            .SetBadges(badges)
            .SetDecoration(target.AvatarDecoration.Id)
            .GenerateImage();
        const userImageFile = new discord_js_1.AttachmentBuilder(userImage, { name: "user.webp" });
        let badgeText = "";
        badges.forEach(badge => badgeText += `${badge.Emoji} `);
        const emoteItems = [...target.Items].sort((a, b) => a.Id - b.Id).map(weapon => weapon.Skin[weapon.SelectedSkin].String);
        const textItems = target.Items.map(userItem => {
            const name = `${userItem.Skin[userItem.SelectedSkin].String} ${userItem.Description[language]}`;
            const consumable = userItem.Type === Items_1.ItemType.Consumable;
            const value = consumable ? String(userItem.Quantity) : (0, discord_js_1.time)(userItem.RemainingTime, discord_js_1.TimestampStyles.RelativeTime);
            const isLessThan24Hours = consumable ? userItem.Quantity <= 2 : (0, date_fns_1.differenceInHours)(userItem.RemainingTime, Date.now()) < 24;
            const isLessThan12Hours = consumable ? userItem.Quantity <= 1 : (0, date_fns_1.differenceInHours)(userItem.RemainingTime, Date.now()) < 12;
            const emote = isLessThan12Hours ? emotes_1.EmoteString.LessThan12Hours : isLessThan24Hours ? emotes_1.EmoteString.LessThan24Hours : "";
            return `**${name}** ${value}${emote}`;
        }).join("\n");
        const lastCommand = interaction.client.userLastCommand.get(target.Id) || 0;
        const online = new Date(lastCommand) > (0, date_fns_1.subMinutes)(new Date(), 15);
        const emoteOnline = online ? emotes_1.EmoteString.Online : emotes_1.EmoteString.Offline;
        const textOnline = online ? `${emotes_1.EmoteString.Online} Online` : `${emotes_1.EmoteString.Offline} Offline`;
        let gangImage = null;
        let gangImageFile = null;
        async function generateContainer(isClosed, target) {
            const container = new CustomContainerBuilder_1.CustomContainerBuilder()
                .setUser(user);
            if (target.IsVip()) {
                container.setAccentColor(discord_js_1.Colors.Gold);
            }
            if (gang) {
                container.setAccentColor((0, ui_1.hexToRGB)((0, ui_1.convertHexNumberToString)(GangColors_1.GangColor[gang.Color].Color)));
            }
            const gangAcronym = gang ? `[${gang.Acronym}] ` : "";
            let investTextSimple = undefined;
            let investTextComplex = undefined;
            if (target.Investment.Id !== null) {
                const investEmote = target.Investment.ExpiresAt.getTime() > Date.now() ? emotes_1.EmoteString.InvestmentActive : emotes_1.EmoteString.InvestmentInactive;
                const investment = Investments_1.InvestmentList[target.Investment.Id];
                investTextSimple = `${investEmote} ${investment.Name[language]}`;
                investTextComplex = `${investTextSimple}: ${(0, discord_js_1.time)(target.Investment.ExpiresAt, discord_js_1.TimestampStyles.RelativeTime)}`;
            }
            if (isClosed) {
                container
                    .addSectionComponents(headerSection => headerSection
                    .addTexts([
                    `### ${emoteOnline} ${s.inventoryOf} ${gangAcronym}${target.GetNameWithImage()}`,
                    badgeText ? `### -# ${badgeText}` : "\u200b",
                    `# ${(0, ui_1.formatMoney)(target.Money, language)}`,
                ])
                    .setThumbnailAccessory(avatar => avatar
                    .setDescription(`Image of ${user.Nickname}`)
                    .setURL("attachment://user.webp")))
                    .addTexts([
                    `-# ${target.Situation.SimpleEmote} •${emotes_1.EmoteString.Attack}${target.Attributes.Attack}${emotes_1.EmoteString.Defense}${target.Attributes.Defense}`,
                ])
                    .addLargeSeparator()
                    .addTexts([
                    emoteItems.length ? `# ${emoteItems.join("\u0009")}` : `-# ${s.emptyInventory}`,
                ]);
                if (investTextSimple) {
                    container
                        .addLargeSeparator()
                        .addTexts([investTextSimple]);
                }
                container.addFooter({
                    button: new discord_js_1.ButtonBuilder()
                        .setCustomId("moreInfo")
                        .setLabel(s.openInv)
                        .setStyle(discord_js_1.ButtonStyle.Secondary)
                        .setEmoji(emotes_1.EmoteId.OpenInv),
                });
            }
            else {
                if (gang) {
                    if (!gangImageFile) {
                        gangImage = await new GangImageCanvasBuilder_1.GangImageCanvasBuilder(target, gang, language, true).GenerateImage();
                        gangImageFile = new discord_js_1.AttachmentBuilder(gangImage, { name: "gang.webp" });
                    }
                    container
                        .addImage("attachment://gang.webp")
                        .addSmallSeparator(false);
                }
                container
                    .addSectionComponents(headerSection => headerSection
                    .addTexts([
                    `### ${s.inventoryOf} ${target.GetNameWithImage()}, ${Classes_1.ClassList[target.Class].Name[language]}`,
                    `-# ${textOnline}`,
                    badgeText ? `### ${badgeText}` : "\u200b",
                    `# ${(0, ui_1.formatMoney)(target.Money, language)}`,
                ])
                    .setThumbnailAccessory(avatar => avatar
                    .setDescription(`Image of ${user.Nickname}`)
                    .setURL("attachment://user.webp")))
                    .addTexts([
                    `${target.Situation.Complex} • ${emotes_1.EmoteString.Attack}${target.Attributes.Attack} ATK • ${emotes_1.EmoteString.Defense}${target.Attributes.Defense} DEF`,
                ])
                    .addLargeSeparator()
                    .addTexts([
                    `-# ${s.inventoryItems}`,
                    textItems || `-# ${s.emptyInventory}`,
                ]);
                if (investTextComplex) {
                    container
                        .addLargeSeparator()
                        .addTexts([
                        `-# ${s.investment}`,
                        investTextComplex,
                    ]);
                }
                container.addFooter({
                    button: new discord_js_1.ButtonBuilder()
                        .setCustomId("lessInfo")
                        .setLabel(s.closeInv)
                        .setStyle(discord_js_1.ButtonStyle.Secondary)
                        .setEmoji(emotes_1.EmoteId.CloseInv),
                });
            }
            return container;
        }
        let container = await generateContainer(true, target);
        const files = [];
        if (userImageFile) {
            files.push(userImageFile);
        }
        const response = await (0, discordInteractions_1.replyInteraction)(interaction, {
            components: [container],
            files,
            flags: discord_js_1.MessageFlags.IsComponentsV2,
        });
        const collector = (0, collectors_1.createButtonCollector)(interaction, response);
        collector?.on("collect", async (btn) => {
            await (0, discordInteractions_1.deferUpdate)(btn);
            if (btn.customId === "moreInfo") {
                container = await generateContainer(false, target);
                if (gangImageFile && !files.includes(gangImageFile)) {
                    files.push(gangImageFile);
                }
                return (0, discordInteractions_1.replyInteraction)(interaction, {
                    components: [container],
                    files,
                });
            }
            else if (btn.customId === "lessInfo") {
                container = await generateContainer(true, target);
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
        });
        collector?.on("end", async () => {
            await (0, collectors_1.disableButtons)(interaction, container);
        });
    },
};
const Strings = {
    [Language_1.Language.English]: {
        inventoryOf: "Inventory of",
        closeInv: "Close",
        openInv: "Open",
        inventoryItems: "Items in the inventory",
        emptyInventory: "Empty inventory",
        investment: "Investment",
    },
    [Language_1.Language.Portuguese]: {
        inventoryOf: "Inventário de",
        closeInv: "Fechar",
        openInv: "Abrir",
        inventoryItems: "Itens no inventário",
        emptyInventory: "Inventário vazio",
        investment: "Investimento",
    },
    [Language_1.Language.Spanish]: {
        inventoryOf: "Inventario de",
        closeInv: "Cerrar",
        openInv: "Abrir",
        inventoryItems: "Artículos en el inventario",
        emptyInventory: "Inventario vacío",
        investment: "Inversión",
    },
};
//# sourceMappingURL=inv.js.map