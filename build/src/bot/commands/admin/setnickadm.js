"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const colors_1 = require("#bot/utils/colors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const ui_1 = require("#bot/utils/ui");
const userUtils_1 = require("#bot/utils/userUtils");
const discord_js_1 = require("discord.js");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("setnickadm")
        .setDescription("Set a new nickname for a user!")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Defina um novo nickname para um usuário!")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addStringOption(option => option
        .setName("userid")
        .setDescription("The userId to change the nickname")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "O Id do usuário para mudar o nickname")
        .setRequired(true))
        .addStringOption(option => option
        .setName("nickname")
        .setDescription("The new nickname")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "O novo nickname")
        .setRequired(true)),
    async execute(interaction, user) {
        const userId = interaction.options.getString("userid", true);
        const nickname = interaction.options.getString("nickname", true);
        const target = await (0, userUtils_1.checkUser)(userId, interaction);
        if (!target) {
            return (0, discordInteractions_1.replyInteraction)(interaction, "Didn't find this user");
        }
        const oldNickname = target.Nickname;
        await target.SetNickname(nickname);
        const container = (0, ui_1.defaultComponent)({
            user,
            color: colors_1.CrColors.Admin,
            description: `User **${oldNickname}**'s nickname has been changed to **${target.Nickname}**.`,
        });
        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
    },
};
//# sourceMappingURL=setnickadm.js.map