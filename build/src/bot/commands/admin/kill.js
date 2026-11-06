"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const colors_1 = require("#bot/utils/colors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const emotes_1 = require("#bot/utils/emotes");
const ui_1 = require("#bot/utils/ui");
const userUtils_1 = require("#bot/utils/userUtils");
const Language_1 = require("#core/models/Language");
const utils_1 = require("#shared/utils");
const discord_js_1 = require("discord.js");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("kill")
        .setDescription("Kill a player (ban them temporarily)")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Mata um jogador (bane temporariamente)")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Mata a un jugador (bánelo temporalmente)")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addStringOption(option => option
        .setName("userid")
        .setDescription("The target user to kill")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "O usuário alvo para matar")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "El usuario objetivo para matar")
        .setRequired(true))
        .addIntegerOption(option => option
        .setName("days")
        .setDescription("The duration of the ban in days")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "A duração do banimento em dias")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "La duración de la suspensión en días")
        .setRequired(true)),
    async execute(interaction, user, language) {
        const userId = interaction.options.getString("userid", true);
        const days = interaction.options.getInteger("days", true);
        const target = await (0, userUtils_1.checkUser)(userId, interaction);
        if (!target) {
            return;
        }
        const s = Strings[language];
        const deadUntil = await target.Kill(days);
        const container = (0, ui_1.defaultComponent)({
            user,
            color: colors_1.CrColors.Cemetery,
            description: `${emotes_1.EmoteString.Cemetery} **${target.GetNameWithImage()}** ${s.howKill()} ${s.text(deadUntil)}`,
        });
        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
    },
};
const Strings = {
    [Language_1.Language.English]: {
        howKill: () => (0, utils_1.getRandomItemFromArray)([
            `was struck by lightning`,
            `was run over by an Impala`,
            `choked on a raisin`,
            `kicked the corner of a piece of furniture`,
            `was kicked by a horse`,
            `slipped on a banana peel`,
            `got a clothes iron to the head`,
            `had a heart attack`,
            `farted and shit his ass out`,
            `beheld the full power of Jacobi`
        ]),
        text: (until) => `and died. He will be revived ${(0, discord_js_1.time)(until, discord_js_1.TimestampStyles.RelativeTime)}`
    },
    [Language_1.Language.Portuguese]: {
        howKill: () => (0, utils_1.getRandomItemFromArray)([
            `foi atingido por um raio`,
            `foi atropelado por um Opala`,
            `se esgasgou com uma uva passa`,
            `chutou a quina de um móvel`,
            `levou um coice de um cavalo`,
            `resvalou numa casca de banana`,
            `levou um ferro de passar na cabeça`,
            `teve um infarto`,
            `foi peidar e cagou o cu pra fora`,
            `vislumbrou todo o poder do Jacobi`
        ]),
        text: (until) => `e morreu. Ele ressuscitará ${(0, discord_js_1.time)(until, discord_js_1.TimestampStyles.RelativeTime)}`
    },
    [Language_1.Language.Spanish]: {
        howKill: () => (0, utils_1.getRandomItemFromArray)([
            `fue alcanzado por un rayo`,
            `fue atropellado por un Opala`,
            `se atragantó con una pasa`,
            `pateó la esquina de un mueble`,
            `recibió una patada de un caballo`,
            `resbaló con una cáscara de plátano`,
            `recibió una plancha en la cabeza`,
            `tuvo un infarto`,
            `se tiró un pedo y se cagó todo`,
            `vislumbró todo el poder de Jacobi`
        ]),
        text: (until) => `y murió. Él resucitará ${(0, discord_js_1.time)(until, discord_js_1.TimestampStyles.RelativeTime)}`
    },
};
//# sourceMappingURL=kill.js.map