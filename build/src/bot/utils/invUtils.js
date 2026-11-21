"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Inventory = void 0;
const InventoryCanvasBuilder_1 = require("#bot/ui/builders/InventoryCanvasBuilder");
const Language_1 = require("#core/models/Language");
const UserBadge_1 = require("#core/models/UserBadge");
const date_fns_1 = require("date-fns");
const discord_js_1 = require("discord.js");
const discordInteractions_1 = require("./discordInteractions");
const emotes_1 = require("./emotes");
const ui_1 = require("./ui");
const colors_1 = require("./colors");
class Inventory {
    Interaction;
    Target;
    Language;
    FullSize = false;
    Badges = [];
    DiscordUser;
    Gang = null;
    IsOnline = false;
    Attachments = [];
    Medias = [];
    IsCallerDevOrMod = false;
    ActiveMenu = null;
    constructor(interaction, target, discordUser, language) {
        this.Interaction = interaction;
        this.Target = target;
        this.DiscordUser = discordUser;
        this.Language = language;
    }
    async Load() {
        const callerId = this.Interaction.user.id;
        const [badges, gang, isDev, isMod] = await Promise.all([
            UserBadge_1.UserBadge.GetList(this.Target.Id),
            this.Target.GetGang(),
            UserBadge_1.UserBadge.IsDeveloper(callerId),
            UserBadge_1.UserBadge.IsModerator(callerId),
        ]);
        this.Badges = badges;
        this.Gang = gang;
        this.IsCallerDevOrMod = isDev || isMod;
        if (this.Target.IsVip()) {
            this.Badges = UserBadge_1.UserBadge.AddVIPBadgeInList(this.Badges, this.Target, this.Language);
        }
        const lastCommand = this.Interaction.client.userLastCommand.get(this.Target.Id) || 0;
        this.IsOnline = new Date(lastCommand) > (0, date_fns_1.subMinutes)(new Date(), 15);
    }
    async Render() {
        const builder = new InventoryCanvasBuilder_1.InventoryCanvasBuilder({
            User: this.Target,
            Badges: this.Badges,
            DiscordUser: this.DiscordUser,
            Language: this.Language,
            FullSize: this.FullSize,
            Gang: this.Gang,
            IsOnline: this.IsOnline,
        });
        const s = Strings[this.Language];
        const buffer = await builder.GenerateImage();
        const name = `inventory${this.FullSize ? "_full" : ""}.webp`;
        const media = new discord_js_1.MediaGalleryBuilder().addItems(image => image
            .setDescription(s.inventoryOf + " " + this.Target.Nickname)
            .setURL(`attachment://${name}`));
        const attachment = new discord_js_1.AttachmentBuilder(buffer, { name });
        let row;
        if (this.ActiveMenu === "removeAction") {
            const selectMenu = new discord_js_1.StringSelectMenuBuilder()
                .setCustomId("selectRemoveAction")
                .setPlaceholder(s.selectActionPlaceholder)
                .addOptions([
                new discord_js_1.StringSelectMenuOptionBuilder().setLabel(s.actionJob).setValue("job").setEmoji(emotes_1.EmoteId.Jobs),
                new discord_js_1.StringSelectMenuOptionBuilder().setLabel(s.actionScavenge).setValue("scavenge").setEmoji(emotes_1.EmoteId.Scavenge),
                new discord_js_1.StringSelectMenuOptionBuilder().setLabel(s.actionRobbery).setValue("robbery").setEmoji(emotes_1.EmoteId.Robbery),
                new discord_js_1.StringSelectMenuOptionBuilder().setLabel(s.actionBeatUp).setValue("beatup").setEmoji(emotes_1.EmoteId.Beat),
                new discord_js_1.StringSelectMenuOptionBuilder().setLabel(s.actionCasino).setValue("casino").setEmoji(emotes_1.EmoteId.Casino),
                new discord_js_1.StringSelectMenuOptionBuilder().setLabel(s.actionGangAction).setValue("gangaction").setEmoji(emotes_1.EmoteId.Gang),
                new discord_js_1.StringSelectMenuOptionBuilder().setLabel(s.cancel).setValue("cancel"),
            ]);
            row = new discord_js_1.ActionRowBuilder().setComponents(selectMenu);
        }
        else if (this.ActiveMenu === "resetCooldown") {
            const selectMenu = new discord_js_1.StringSelectMenuBuilder()
                .setCustomId("selectResetCooldown")
                .setPlaceholder(s.selectCooldownPlaceholder)
                .addOptions([
                new discord_js_1.StringSelectMenuOptionBuilder().setLabel(s.cooldownScavenge).setValue("scavenge").setEmoji(emotes_1.EmoteId.Scavenge),
                new discord_js_1.StringSelectMenuOptionBuilder().setLabel(s.cooldownRobbery).setValue("robbery").setEmoji(emotes_1.EmoteId.Police),
                new discord_js_1.StringSelectMenuOptionBuilder().setLabel(s.cooldownBeatUp).setValue("beatup").setEmoji(emotes_1.EmoteId.Beat),
                new discord_js_1.StringSelectMenuOptionBuilder().setLabel(s.cancel).setValue("cancel"),
            ]);
            row = new discord_js_1.ActionRowBuilder().setComponents(selectMenu);
        }
        else {
            const button = new discord_js_1.ButtonBuilder()
                .setCustomId(this.FullSize ? "lessInfo" : "moreInfo")
                .setLabel(this.FullSize ? s.closeInv : s.openInv)
                .setEmoji(this.FullSize ? emotes_1.EmoteId.CloseInv : emotes_1.EmoteId.OpenInv)
                .setStyle(discord_js_1.ButtonStyle.Secondary);
            const defaultRow = new discord_js_1.ActionRowBuilder().setComponents(button);
            if (this.IsCallerDevOrMod) {
                const healButton = new discord_js_1.ButtonBuilder()
                    .setCustomId("adminHeal")
                    .setLabel(s.heal)
                    .setEmoji(emotes_1.EmoteId.Hospital)
                    .setStyle(discord_js_1.ButtonStyle.Secondary)
                    .setDisabled(!this.Target.IsInHospital());
                const freeButton = new discord_js_1.ButtonBuilder()
                    .setCustomId("adminFree")
                    .setLabel(s.free)
                    .setEmoji(emotes_1.EmoteId.Prison)
                    .setStyle(discord_js_1.ButtonStyle.Secondary)
                    .setDisabled(!this.Target.IsInPrison());
                const removeActionButton = new discord_js_1.ButtonBuilder()
                    .setCustomId("triggerRemoveAction")
                    .setLabel(s.removeActionBtn)
                    .setStyle(discord_js_1.ButtonStyle.Secondary);
                const resetCooldownButton = new discord_js_1.ButtonBuilder()
                    .setCustomId("triggerResetCooldown")
                    .setLabel(s.resetCooldownBtn)
                    .setStyle(discord_js_1.ButtonStyle.Secondary);
                defaultRow.addComponents(healButton, freeButton, removeActionButton, resetCooldownButton);
            }
            row = defaultRow;
        }
        this.Attachments = [attachment];
        this.Medias = [media];
        return { row };
    }
    async Generate() {
        const render = await this.Render();
        const response = await (0, discordInteractions_1.replyInteraction)(this.Interaction, {
            components: [...this.Medias, render.row],
            files: this.Attachments,
            flags: discord_js_1.MessageFlags.IsComponentsV2,
        });
        if (!response) {
            return;
        }
        const collector = response.createMessageComponentCollector({
            filter: i => i.user.id === this.Interaction.user.id,
            idle: 60_000,
        });
        collector?.on("collect", async (btn) => {
            await (0, discordInteractions_1.deferUpdate)(btn);
            if (btn.customId === "moreInfo") {
                this.FullSize = true;
            }
            else if (btn.customId === "lessInfo") {
                this.FullSize = false;
            }
            else if (btn.customId === "adminHeal") {
                await this.Target.Cure(this.Interaction.user.id);
                const container = (0, ui_1.defaultComponent)({
                    color: colors_1.CrColors.Hospital,
                    description: `User **${this.Target.GetNameWithImage()}** is now free from ${emotes_1.EmoteString.Hospital} Hospital.`,
                });
                return (0, discordInteractions_1.replyWithContainer)(btn, container);
            }
            else if (btn.customId === "adminFree") {
                await this.Target.Free(this.Interaction.user.id);
                const container = (0, ui_1.defaultComponent)({
                    color: colors_1.CrColors.Police,
                    description: `User **${this.Target.GetNameWithImage()}** is now free from ${emotes_1.EmoteString.Prison} Prison.`,
                });
                return (0, discordInteractions_1.replyWithContainer)(btn, container);
            }
            else if (btn.customId === "triggerRemoveAction") {
                this.ActiveMenu = "removeAction";
            }
            else if (btn.customId === "triggerResetCooldown") {
                this.ActiveMenu = "resetCooldown";
            }
            else if (btn.isStringSelectMenu()) {
                const selectedValue = btn.values[0];
                this.ActiveMenu = null;
                if (selectedValue !== "cancel") {
                    if (btn.customId === "selectRemoveAction") {
                        await this.Target.RemoveAction(selectedValue, this.Interaction.user.id);
                    }
                    else if (btn.customId === "selectResetCooldown") {
                        await this.Target.ResetCooldown(selectedValue, this.Interaction.user.id);
                    }
                }
            }
            const { row } = await this.Render();
            return (0, discordInteractions_1.replyInteraction)(this.Interaction, {
                files: this.Attachments,
                components: [...this.Medias, row],
            });
        });
        collector?.on("end", async () => {
            this.ActiveMenu = null;
            await (0, discordInteractions_1.replyInteraction)(this.Interaction, {
                files: this.Attachments,
                components: this.Medias,
            });
        });
    }
}
exports.Inventory = Inventory;
const Strings = {
    [Language_1.Language.English]: {
        inventoryOf: "Inventory of",
        closeInv: "Close",
        openInv: "Open",
        heal: "Heal",
        free: "Free",
        selectActionPlaceholder: "Choose action to remove...",
        selectCooldownPlaceholder: "Choose cooldown to reset...",
        actionJob: "Job",
        actionScavenge: "Scavenge",
        actionRobbery: "Robbery",
        actionBeatUp: "Beat Up",
        actionCasino: "Casino",
        actionGangAction: "Gang Action",
        cancel: "Cancel",
        cooldownScavenge: "Scavenge",
        cooldownRobbery: "Robbery (Wanted)",
        cooldownBeatUp: "Beat Up",
        removeActionBtn: "Remove action",
        resetCooldownBtn: "Reset cooldown",
    },
    [Language_1.Language.Portuguese]: {
        inventoryOf: "Inventário de",
        closeInv: "Fechar",
        openInv: "Abrir",
        heal: "Curar",
        free: "Libertar",
        selectActionPlaceholder: "Escolha a ação para remover...",
        selectCooldownPlaceholder: "Escolha o tempo de recarga para zerar...",
        actionJob: "Trabalho",
        actionScavenge: "Vasculhar",
        actionRobbery: "Roubar",
        actionBeatUp: "Espancar",
        actionCasino: "Cassino",
        actionGangAction: "Ação de Gangue",
        cancel: "Cancelar",
        cooldownScavenge: "Vasculhar",
        cooldownRobbery: "Roubar (Procurado)",
        cooldownBeatUp: "Espancar",
        removeActionBtn: "Remover ação",
        resetCooldownBtn: "Zerar cooldown",
    },
    [Language_1.Language.Spanish]: {
        inventoryOf: "Inventario de",
        closeInv: "Cerrar",
        openInv: "Abrir",
        heal: "Curar",
        free: "Liberar",
        selectActionPlaceholder: "Elige la acción a eliminar...",
        selectCooldownPlaceholder: "Elige el tiempo de recarga a reiniciar...",
        actionJob: "Trabajo",
        actionScavenge: "Buscar",
        actionRobbery: "Robar",
        actionBeatUp: "Golpear",
        actionCasino: "Casino",
        actionGangAction: "Acción de Banda",
        cancel: "Cancelar",
        cooldownScavenge: "Buscar",
        cooldownRobbery: "Robar (Buscado)",
        cooldownBeatUp: "Golpear",
        removeActionBtn: "Eliminar acción",
        resetCooldownBtn: "Reiniciar cooldown",
    },
};
//# sourceMappingURL=invUtils.js.map