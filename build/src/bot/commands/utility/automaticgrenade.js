"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const collectors_1 = require("#bot/utils/collectors");
const colors_1 = require("#bot/utils/colors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const emotes_1 = require("#bot/utils/emotes");
const Language_1 = require("#core/models/Language");
const discord_js_1 = require("discord.js");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("automaticgrenade")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "granadaautomatica")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "granadaautomatica")
        .setDescription("Enable or disable automatically using grenades in rob and beatup commands")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Ativa ou desativa o uso automático de granadas nos comandos roubar e espancar")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Activa o desactiva el uso automático de granadas en los comandos de robo y golpear"),
    async execute(interaction, user, language) {
        function getStatusText(enabled, lang) {
            const s = Strings[lang];
            return enabled ? `${emotes_1.EmoteString.Online} **${s.enabled}**` : `${emotes_1.EmoteString.Offline} **${s.disabled}**`;
        }
        function buildContainer(currentUser, lang) {
            const s = Strings[lang];
            return new CustomContainerBuilder_1.CustomContainerBuilder()
                .setUser(currentUser)
                .setAccentColor(colors_1.CrColors.Default)
                .addTexts([
                `# ${s.title}`,
                s.explanation,
                "",
                `${s.currentStatus}: ${getStatusText(currentUser.AutomaticGrenade, lang)}`,
            ])
                .addButtonRow(btn => btn
                .setCustomId("enable")
                .setLabel(s.enableButton)
                .setStyle(discord_js_1.ButtonStyle.Success)
                .setDisabled(currentUser.AutomaticGrenade), btn => btn
                .setCustomId("disable")
                .setLabel(s.disableButton)
                .setStyle(discord_js_1.ButtonStyle.Danger)
                .setDisabled(!currentUser.AutomaticGrenade))
                .addFooter();
        }
        let container = buildContainer(user, language);
        const response = await (0, discordInteractions_1.replyWithContainer)(interaction, container);
        const collector = (0, collectors_1.createButtonCollector)(interaction, response);
        collector?.on("end", async () => {
            await (0, collectors_1.disableButtons)(interaction, container);
        });
        collector?.on("collect", async (btn) => {
            await (0, discordInteractions_1.deferUpdate)(btn);
            const isEnable = btn.customId === "enable";
            await user.GetInfo();
            await user.SetAutomaticGrenade(isEnable);
            container = buildContainer(user, language);
            return (0, discordInteractions_1.replyWithContainer)(interaction, container);
        });
    },
};
const Strings = {
    [Language_1.Language.English]: {
        title: "Automatic Grenade",
        explanation: `By enabling this option, whenever you try to ${emotes_1.EmoteString.Robbery} **Rob** or ${emotes_1.EmoteString.Beat} **Beat Up** another user, and you have a ${emotes_1.EmoteString.Granade} **Grenade** in your inventory, you will automatically consume it to gain the advantage, without receiving a confirmation dialog.`,
        currentStatus: "Current status",
        enabled: "Enabled",
        disabled: "Disabled",
        enableButton: "Enable",
        disableButton: "Disable",
    },
    [Language_1.Language.Portuguese]: {
        title: "Granada Automática",
        explanation: `Ao ativar esta opção, sempre que você tentar ${emotes_1.EmoteString.Robbery} **Roubar** ou ${emotes_1.EmoteString.Beat} **Espancar** outro usuário, e tiver uma ${emotes_1.EmoteString.Granade} **Granada** em seu inventário, você a consumirá automaticamente para obter a vantagem, sem precisar confirmar na tela.`,
        currentStatus: "Status atual",
        enabled: "Ativado",
        disabled: "Desativado",
        enableButton: "Ativar",
        disableButton: "Desativar",
    },
    [Language_1.Language.Spanish]: {
        title: "Granada Automática",
        explanation: `Al activar esta opción, cada vez que intentes ${emotes_1.EmoteString.Robbery} **Robar** o ${emotes_1.EmoteString.Beat} **Golpear** a otro usuario, y tengas una ${emotes_1.EmoteString.Granade} **Granada** en tu inventario, la consumirás automáticamente para obtener ventaja, sin tener que confirmar en pantalla.`,
        currentStatus: "Estado actual",
        enabled: "Activado",
        disabled: "Desactivado",
        enableButton: "Activar",
        disableButton: "Desactivar",
    },
};
//# sourceMappingURL=automaticgrenade.js.map