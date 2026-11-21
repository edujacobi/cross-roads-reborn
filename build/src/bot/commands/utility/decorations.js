"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const UserImageCanvasBuilder_1 = require("#bot/ui/builders/UserImageCanvasBuilder");
const UserRankingCardCanvasBuilder_1 = require("#bot/ui/builders/UserRankingCardCanvasBuilder");
const collectors_1 = require("#bot/utils/collectors");
const colors_1 = require("#bot/utils/colors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const emotes_1 = require("#bot/utils/emotes");
const Language_1 = require("#core/models/Language");
const UserAvatarDecoration_1 = require("#core/models/UserAvatarDecoration");
const UserBackgroundDecoration_1 = require("#core/models/UserBackgroundDecoration");
const AvatarDecorations_1 = require("#core/types/AvatarDecorations");
const BackgroundDecorations_1 = require("#core/types/BackgroundDecorations");
const Ids_1 = require("#core/types/Ids");
const discord_js_1 = require("discord.js");
const CATEGORY_AVATAR = "cat_avatar";
const CATEGORY_RANKING = "cat_ranking";
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("decorations")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "decorações")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "decoraciones")
        .setDescription("Choose the decoration for your avatar or ranking card")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Escolha a decoração para seu avatar ou cartão de ranking")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Elige la decoración para tu avatar o tarjeta de ranking"),
    async execute(interaction, user, language) {
        const s = Strings[language];
        let currentCategory = CATEGORY_AVATAR;
        function addHeader(container = new CustomContainerBuilder_1.CustomContainerBuilder(), hasItems) {
            container
                .setUser(user)
                .setAccentColor(colors_1.CrColors.Default)
                .addTexts([
                `# ${currentCategory === CATEGORY_AVATAR ? s.titleAvatar : s.titleRanking}`,
                hasItems ? s.subtitle : s.dontHave,
            ]);
            if (hasItems) {
                container.addLargeSeparator();
            }
            return container;
        }
        function getAvatarEmote(id) {
            switch (id) {
                case Ids_1.AvatarDecorationId.Developer:
                case Ids_1.AvatarDecorationId.Moderator:
                case Ids_1.AvatarDecorationId.Helper:
                    return emotes_1.EmoteId.Legendary;
                case Ids_1.AvatarDecorationId.Silver:
                case Ids_1.AvatarDecorationId.FrutigerAero:
                case Ids_1.AvatarDecorationId.Rainbow:
                case Ids_1.AvatarDecorationId.MasterOfArms:
                    return emotes_1.EmoteId.Rare;
                case Ids_1.AvatarDecorationId.VIP:
                    return emotes_1.EmoteId.VIP;
                case Ids_1.AvatarDecorationId.Default:
                case Ids_1.AvatarDecorationId.Pistol:
                case Ids_1.AvatarDecorationId.MachinePistol:
                case Ids_1.AvatarDecorationId.HuntRifle:
                case Ids_1.AvatarDecorationId.Shotgun:
                case Ids_1.AvatarDecorationId.SMG:
                case Ids_1.AvatarDecorationId.AssaultRifle:
                case Ids_1.AvatarDecorationId.Carbine:
                case Ids_1.AvatarDecorationId.Sniper:
                case Ids_1.AvatarDecorationId.Katana:
                case Ids_1.AvatarDecorationId.RPG:
                case Ids_1.AvatarDecorationId.Minigun:
                case Ids_1.AvatarDecorationId.Bazooka:
                    return emotes_1.EmoteId.Common;
                default:
                    return emotes_1.EmoteId.Uncommon;
            }
        }
        function getBackgroundEmote(id) {
            switch (id) {
                case Ids_1.BackgroundDecorationId.Silver:
                case Ids_1.BackgroundDecorationId.FrutigerAero:
                case Ids_1.BackgroundDecorationId.Rainbow:
                case Ids_1.BackgroundDecorationId.Cloud:
                    return emotes_1.EmoteId.Rare;
                case Ids_1.BackgroundDecorationId.Default:
                    return emotes_1.EmoteId.Common;
                default:
                    return emotes_1.EmoteId.Uncommon;
            }
        }
        async function generateDefaultContainer() {
            await user.GetInfo();
            const items = currentCategory === CATEGORY_AVATAR
                ? await UserAvatarDecoration_1.UserAvatarDecoration.GetList(user, language)
                : await UserBackgroundDecoration_1.UserBackgroundDecoration.GetList(user, language);
            const hasItems = items.length > 0;
            const container = addHeader(new CustomContainerBuilder_1.CustomContainerBuilder(), hasItems);
            // Category Buttons
            container.addButtonRow(btn => btn
                .setLabel(s.catAvatar)
                .setStyle(currentCategory === CATEGORY_AVATAR ? discord_js_1.ButtonStyle.Primary : discord_js_1.ButtonStyle.Secondary)
                .setCustomId(CATEGORY_AVATAR)
                .setDisabled(currentCategory === CATEGORY_AVATAR), btn => btn
                .setLabel(s.catRanking)
                .setStyle(currentCategory === CATEGORY_RANKING ? discord_js_1.ButtonStyle.Primary : discord_js_1.ButtonStyle.Secondary)
                .setCustomId(CATEGORY_RANKING)
                .setDisabled(currentCategory === CATEGORY_RANKING));
            if (hasItems) {
                container.addTexts([
                    `### ${s.selectDecoration}`,
                ]);
                const chunks = [];
                for (let i = 0; i < items.length; i += 5) {
                    chunks.push(items.slice(i, i + 5));
                }
                for (const chunk of chunks) {
                    container.addButtonRow(...chunk.map(item => {
                        const isAvatar = "AvatarDecorationId" in item;
                        const id = isAvatar ? item.AvatarDecorationId : item.BackgroundDecorationId;
                        const isActive = isAvatar
                            ? user.AvatarDecoration.Id === id
                            : user.BackgroundDecoration.Id === id;
                        return (btn) => btn
                            .setLabel(item.Description)
                            .setStyle(discord_js_1.ButtonStyle.Secondary)
                            .setEmoji(isAvatar ? getAvatarEmote(id) : getBackgroundEmote(id))
                            .setDisabled(isActive)
                            .setCustomId("change-" + id);
                    }));
                }
            }
            container.addFooter({
                text: s.footer,
            });
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
            if (btn.customId === CATEGORY_AVATAR || btn.customId === CATEGORY_RANKING) {
                currentCategory = btn.customId;
                container = await generateDefaultContainer();
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
            if (btn.customId === "back") {
                container = await generateDefaultContainer();
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
            else if (btn.customId.includes("change-")) {
                const id = Number(btn.customId.replace("change-", ""));
                const isAvatar = currentCategory === CATEGORY_AVATAR;
                let previewImage;
                let name = "";
                if (isAvatar) {
                    const decoration = AvatarDecorations_1.AvatarDecorationList[id];
                    name = decoration.Description[language];
                    previewImage = await new UserImageCanvasBuilder_1.UserImageCanvasBuilder(user, interaction.user.avatarURL({ size: 512 }))
                        .SetDecoration(decoration.Id)
                        .GenerateImage();
                }
                else {
                    const bg = BackgroundDecorations_1.BackgroundDecorationList[id];
                    name = bg.Description[language];
                    previewImage = await new UserRankingCardCanvasBuilder_1.UserRankingCardCanvasBuilder(user, 1, "Cr$ 1.500.000", interaction.user.avatarURL({ size: 128 }))
                        .SetDecoration(id)
                        .GenerateImage();
                }
                const previewImageFile = new discord_js_1.AttachmentBuilder(previewImage, { name: "preview.webp" });
                container = addHeader(new CustomContainerBuilder_1.CustomContainerBuilder(), true);
                if (isAvatar) {
                    container
                        .addSectionComponents(section => section
                        .addTexts([
                        `## ${name}`,
                    ])
                        .setThumbnailAccessory(preview => preview
                        .setURL("attachment://preview.webp")));
                }
                else {
                    container
                        .addTexts([
                        `## ${name}`,
                    ])
                        .addImage("attachment://preview.webp");
                }
                container
                    .addButtonRow(btn => btn
                    .setLabel(s.goBack)
                    .setStyle(discord_js_1.ButtonStyle.Secondary)
                    .setCustomId("back"), btn => btn
                    .setLabel(s.confirm)
                    .setStyle(discord_js_1.ButtonStyle.Success)
                    .setCustomId("confirm-" + id));
                container.addFooter();
                await (0, discordInteractions_1.replyInteraction)(interaction, {
                    components: [container],
                    files: [previewImageFile],
                    flags: discord_js_1.MessageFlags.IsComponentsV2,
                });
            }
            else if (btn.customId.includes("confirm-")) {
                const id = Number(btn.customId.replace("confirm-", ""));
                const isAvatar = currentCategory === CATEGORY_AVATAR;
                await user.GetInfo();
                let name = "";
                if (isAvatar) {
                    const decoration = AvatarDecorations_1.AvatarDecorationList[id];
                    name = decoration.Description[language];
                    await user.SetAvatarDecoration(decoration);
                }
                else {
                    const bg = BackgroundDecorations_1.BackgroundDecorationList[id];
                    name = bg.Description[language];
                    await user.SetBackgroundDecoration(bg);
                }
                container = addHeader(new CustomContainerBuilder_1.CustomContainerBuilder(), true)
                    .addTexts([
                    `## ${name}`,
                    `-# ${s.applied}`,
                ])
                    .addButtonRow(btn => btn
                    .setLabel(s.goBack)
                    .setStyle(discord_js_1.ButtonStyle.Secondary)
                    .setCustomId("back"));
                container.addFooter();
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
        });
    },
};
const Strings = {
    [Language_1.Language.English]: {
        titleAvatar: "Avatar decorations",
        titleRanking: "Ranking backgrounds",
        catAvatar: "Avatar",
        catRanking: "Ranking",
        subtitle: "Personalize your look!",
        selectDecoration: "Select item",
        dontHave: "You don't have items in this category.",
        footer: "To buy customizations, access `/specialshop`",
        confirm: "Confirm",
        goBack: "Go back",
        applied: "Applied successfully!",
    },
    [Language_1.Language.Portuguese]: {
        titleAvatar: "Decorações de avatar",
        titleRanking: "Fundos de ranking",
        catAvatar: "Avatar",
        catRanking: "Ranking",
        subtitle: "Personalize seu visual!",
        selectDecoration: "Selecionar item",
        dontHave: "Você não possui itens nesta categoria.",
        footer: "Para comprar customizações, acesse a `/lojaespecial`",
        confirm: "Confirmar",
        goBack: "Voltar",
        applied: "Aplicado com sucesso!",
    },
    [Language_1.Language.Spanish]: {
        titleAvatar: "Decoraciones de avatar",
        titleRanking: "Fondos de ranking",
        catAvatar: "Avatar",
        catRanking: "Ranking",
        subtitle: "¡Personaliza tu look!",
        selectDecoration: "Seleccionar artículo",
        dontHave: "No tienes artículos en esta categoría.",
        footer: "¡Para comprar personalizaciones, ve a `/specialshop`",
        confirm: "Confirmar",
        goBack: "Volver",
        applied: "¡Aplicado con éxito!",
    },
};
//# sourceMappingURL=decorations.js.map