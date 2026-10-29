"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const colors_1 = require("#bot/utils/colors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const ui_1 = require("#bot/utils/ui");
const userUtils_1 = require("#bot/utils/userUtils");
const discord_js_1 = require("discord.js");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("resetcooldown")
        .setDescription("Reset a specific cooldown for a user!")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Zere um tempo de recarga específico para um usuário!")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addStringOption(option => option
        .setName("userid")
        .setDescription("The userId to reset the cooldown")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "O Id do usuário para zerar o tempo de recarga")
        .setRequired(true))
        .addStringOption(option => option
        .setName("cooldown")
        .setDescription("The cooldown to reset")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "O tempo de recarga para zerar")
        .setRequired(true)
        .addChoices([
        { name: "Scavenge", value: "scavenge" },
        { name: "Robbery (Wanted)", value: "robbery" },
        { name: "Beat Up", value: "beatup" },
    ])),
    async execute(interaction, user) {
        const userId = interaction.options.getString("userid", true);
        const cooldown = interaction.options.getString("cooldown", true);
        const target = await (0, userUtils_1.checkUser)(userId, interaction);
        if (!target) {
            return (0, discordInteractions_1.replyInteraction)(interaction, "Didn't find this user");
        }
        await target.ResetCooldown(cooldown, user.Id);
        const container = (0, ui_1.defaultComponent)({
            user,
            color: colors_1.CrColors.Admin,
            description: `The **${cooldown}** cooldown for user **${target.GetNameWithImage()}** has been reset.`,
        });
        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
    },
};
//# sourceMappingURL=resetcooldown.js.map