"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const Language_1 = require("#core/models/Language");
const discord_js_1 = require("discord.js");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("avatar")
        .setDescription("View user avatar")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Veja o avatar do usuário")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Ver el avatar del usuario")
        .addUserOption((option) => option
        .setName("target")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "alvo")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "objetivo")
        .setDescription("The user")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "O usuário")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "El usuario")),
    async execute(interaction, user, language) {
        const target = interaction.options.getUser("target");
        const s = Strings[language];
        if (target) {
            return (0, discordInteractions_1.replyInteraction)(interaction, `${s.targetAvatar(target.displayName)}: ${target.displayAvatarURL({
                forceStatic: false,
                size: 4096,
            })}`);
        }
        return (0, discordInteractions_1.replyInteraction)(interaction, `${s.yourAvatar}: ${interaction.user.displayAvatarURL({
            forceStatic: false,
            size: 4096,
        })}`);
    },
};
const Strings = {
    [Language_1.Language.English]: {
        targetAvatar: (name) => `${name}'s avatar`,
        yourAvatar: "Your avatar",
    },
    [Language_1.Language.Portuguese]: {
        targetAvatar: (name) => `Avatar de ${name}`,
        yourAvatar: "Seu avatar",
    },
    [Language_1.Language.Spanish]: {
        targetAvatar: (name) => `Avatar de ${name}`,
        yourAvatar: "Tu avatar",
    },
};
//# sourceMappingURL=avatar.js.map