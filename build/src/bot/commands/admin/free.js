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
        .setName("free")
        .setDescription("Free a user from prison!")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Liberte um usuário da prisão!")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addStringOption(option => option
        .setName("userid")
        .setDescription("The userId to free")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "O Id do usuário para libertar")
        .setRequired(true)),
    async execute(interaction, user) {
        const userId = interaction.options.getString("userid", true);
        const target = await (0, userUtils_1.checkUser)(userId, interaction);
        if (!target) {
            return (0, discordInteractions_1.replyInteraction)(interaction, "Didn't find this user");
        }
        await target.Free(user.Id);
        const container = (0, ui_1.defaultComponent)({
            user,
            color: colors_1.CrColors.Police,
            description: `User **${target.GetNameWithImage()}** is now free from ${emotes_1.EmoteString.Prison} Prison.`,
        });
        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
    },
};
//# sourceMappingURL=free.js.map