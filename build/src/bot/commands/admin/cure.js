"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const colors_1 = require("#bot/utils/colors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const emotes_1 = require("#bot/utils/emotes");
const ui_1 = require("#bot/utils/ui");
const userUtils_1 = require("#bot/utils/userUtils");
const discord_js_1 = require("discord.js");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("cure")
        .setDescription("Cure a user from hospital!")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Cure um usuário do hospital!")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addStringOption(option => option
        .setName("userid")
        .setDescription("The userId to cure")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "O Id do usuário para curar")
        .setRequired(true)),
    async execute(interaction, user) {
        const userId = interaction.options.getString("userid", true);
        const target = await (0, userUtils_1.checkUser)(userId, interaction);
        if (!target) {
            return (0, discordInteractions_1.replyInteraction)(interaction, "Didn't find this user");
        }
        await target.Cure(user.Id);
        const container = (0, ui_1.defaultComponent)({
            user,
            color: colors_1.CrColors.Hospital,
            description: `User **${target.GetNameWithImage()}** is now cured from the ${emotes_1.EmoteString.Hospital} Hospital.`,
        });
        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
    },
};
//# sourceMappingURL=cure.js.map