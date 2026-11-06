"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const ui_1 = require("#bot/utils/ui");
const colors_1 = require("#bot/utils/colors");
const BeatUp_1 = require("#core/models/BeatUp");
const userUtils_1 = require("#bot/utils/userUtils");
const beatupHelper_1 = require("#bot/utils/beatupHelper");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("debugbeatup")
        .setDescription("Test the beat up system")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Teste o sistema de espancamento")
        .addStringOption(target => target
        .setName("target")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "alvo")
        .setDescription("The user to beat you up")
        .setMinLength(3)
        .setRequired(true)
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "O usuário para te espancar")),
    async execute(interaction, user) {
        const nameOrId = interaction.options.getString("target", true);
        await (0, discordInteractions_1.deferReply)(interaction);
        const target = await (0, userUtils_1.searchUser)(nameOrId, interaction);
        if (!target) {
            return;
        }
        const beatUp = new BeatUp_1.BeatUp(target, user);
        const { canBeat, message } = await beatUp.CanBeatUser();
        if (!canBeat) {
            const container = (0, ui_1.defaultComponent)({
                user,
                color: colors_1.CrColors.BeatUp,
                description: message,
            });
            return (0, discordInteractions_1.replyWithContainer)(interaction, container);
        }
        await (0, beatupHelper_1.runUserBeatUp)(interaction, target, user);
    },
};
//# sourceMappingURL=debugbeatup.js.map