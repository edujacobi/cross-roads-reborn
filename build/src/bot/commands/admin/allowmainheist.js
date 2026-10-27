"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const colors_1 = require("#bot/utils/colors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const ui_1 = require("#bot/utils/ui");
const UserBadge_1 = require("#core/models/UserBadge");
const Vault_1 = require("#core/models/Vault");
const Language_1 = require("#core/models/Language");
const discord_js_1 = require("discord.js");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("allowmainheist")
        .setDescription("Enable or disable the main heist")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Permitir ou proibir o golpe principal")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Permitir o prohibir el golpe principal")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addBooleanOption(option => option
        .setName("allowed")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "permitido")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "permitido")
        .setDescription("Whether the main heist is enabled (Mon, Wed, Fri)")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Se o golpe principal está permitido (Seg, Qua, Sex)")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Si el golpe principal está permitido (Lun, Mié, Vie)")
        .setRequired(true)),
    async execute(interaction, user, language) {
        const s = Strings[language];
        if (user.Id !== process.env.JACOBI_ID && !await UserBadge_1.UserBadge.IsDeveloper(user.Id)) {
            return (0, discordInteractions_1.replyWithContainer)(interaction, (0, ui_1.defaultComponent)({
                user,
                color: colors_1.CrColors.Admin,
                description: s.forbidden,
            }));
        }
        const allowed = interaction.options.getBoolean("allowed", true);
        await Vault_1.Vault.SetMainHeistAllowed(allowed);
        const container = (0, ui_1.defaultComponent)({
            user,
            color: colors_1.CrColors.Admin,
            description: s.success(allowed),
        });
        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
    },
};
const Strings = {
    [Language_1.Language.English]: {
        forbidden: "Only Developers can change the main heist setting.",
        success: (allowed) => `Main heist execution is now **${allowed ? "ENABLED (Mon, Wed, Fri)" : "DISABLED"}**.`,
    },
    [Language_1.Language.Portuguese]: {
        forbidden: "Somente desenvolvedores podem alterar a configuração do golpe principal.",
        success: (allowed) => `A execução do golpe principal agora está **${allowed ? "ATIVADA (Seg, Qua, Sex)" : "DESATIVADA"}**.`,
    },
    [Language_1.Language.Spanish]: {
        forbidden: "Solo los desarrolladores pueden cambiar la configuración del golpe principal.",
        success: (allowed) => `La ejecución del golpe principal ahora está **${allowed ? "ACTIVADA (Lun, Mié, Vie)" : "DESACTIVADA"}**.`,
    },
};
//# sourceMappingURL=allowmainheist.js.map