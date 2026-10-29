"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const colors_1 = require("#bot/utils/colors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const ui_1 = require("#bot/utils/ui");
const userUtils_1 = require("#bot/utils/userUtils");
const discord_js_1 = require("discord.js");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("removeaction")
        .setDescription("Remove a user from a specific action!")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Remova um usuário de uma ação específica!")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addStringOption(option => option
        .setName("userid")
        .setDescription("The userId to remove the action from")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "O Id do usuário para remover a ação")
        .setRequired(true))
        .addStringOption(option => option
        .setName("action")
        .setDescription("The action to remove")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "A ação para remover")
        .setRequired(true)
        .addChoices([
        { name: "Job", value: "job" },
        { name: "Scavenge", value: "scavenge" },
        { name: "Robbery", value: "robbery" },
        { name: "Beat Up", value: "beatup" },
        { name: "Casino", value: "casino" },
        { name: "GangAction", value: "gangaction" },
    ])),
    async execute(interaction, user) {
        const userId = interaction.options.getString("userid", true);
        const action = interaction.options.getString("action", true);
        const target = await (0, userUtils_1.checkUser)(userId, interaction);
        if (!target) {
            return (0, discordInteractions_1.replyInteraction)(interaction, "Didn't find this user");
        }
        await target.RemoveAction(action, user.Id);
        const container = (0, ui_1.defaultComponent)({
            user,
            color: colors_1.CrColors.Admin,
            description: `User **${target.GetNameWithImage()}** has been removed from the **${action}** action.`,
        });
        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
    },
};
//# sourceMappingURL=removeaction.js.map