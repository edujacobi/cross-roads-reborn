"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const colors_1 = require("#bot/utils/colors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const robberyHelper_1 = require("#bot/utils/robberyHelper");
const ui_1 = require("#bot/utils/ui");
const userUtils_1 = require("#bot/utils/userUtils");
const UserRobberyStrategy_1 = require("#core/models/strategies/robbery/UserRobberyStrategy");
const discord_js_1 = require("discord.js");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("debugrobbery")
        .setDescription("Test the robbery system")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Teste o sistema de roubos")
        .addStringOption(target => target
        .setName("target")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "alvo")
        .setDescription("The user to rob you")
        .setMinLength(3)
        .setRequired(true)
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "O usuário para te roubar")),
    async execute(interaction, user) {
        const nameOrId = interaction.options.getString("target", true);
        await (0, discordInteractions_1.deferReply)(interaction);
        const target = await (0, userUtils_1.searchUser)(nameOrId, interaction);
        if (!target) {
            return;
        }
        const robbery = new UserRobberyStrategy_1.UserRobberyStrategy(target, user);
        const { canRob, message } = await robbery.CanRob();
        if (!canRob) {
            const container = (0, ui_1.defaultComponent)({
                user,
                color: colors_1.CrColors.Robbery,
                description: message,
            });
            return (0, discordInteractions_1.replyWithContainer)(interaction, container);
        }
        await (0, robberyHelper_1.runUserRobbery)(interaction, target, user);
    },
};
//# sourceMappingURL=debugrobbery.js.map