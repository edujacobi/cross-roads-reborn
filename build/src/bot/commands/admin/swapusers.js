"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const collectors_1 = require("#bot/utils/collectors");
const colors_1 = require("#bot/utils/colors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const ui_1 = require("#bot/utils/ui");
const userUtils_1 = require("#bot/utils/userUtils");
const UserRepository_1 = require("#core/repositories/UserRepository");
const log_1 = require("#shared/log");
const discord_js_1 = require("discord.js");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("swapusers")
        .setDescription("Swaps two users across all database tables")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Troca dois usuários em todas as tabelas do banco de dados")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addStringOption(option => option
        .setName("oldid")
        .setDescription("The old user Id")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "O Id antigo do usuário")
        .setRequired(true))
        .addStringOption(option => option
        .setName("newid")
        .setDescription("The new user Id")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "O novo Id do usuário")
        .setRequired(true)),
    async execute(interaction, user) {
        const oldId = interaction.options.getString("oldid", true);
        const newId = interaction.options.getString("newid", true);
        const oldUser = await (0, userUtils_1.checkUser)(oldId, interaction);
        const newUser = await (0, userUtils_1.checkUser)(newId, interaction);
        // Old Id must be a user in the database
        if (!oldUser || !newUser) {
            return (0, discordInteractions_1.replyUserDontExist)(interaction, user.Language);
        }
        const confirmButton = new discord_js_1.ButtonBuilder()
            .setCustomId("confirm")
            .setLabel("Confirm")
            .setStyle(discord_js_1.ButtonStyle.Danger);
        const cancelButton = new discord_js_1.ButtonBuilder()
            .setCustomId("cancel")
            .setLabel("Cancel")
            .setStyle(discord_js_1.ButtonStyle.Secondary);
        const row = new discord_js_1.ActionRowBuilder()
            .addComponents(confirmButton, cancelButton);
        let container = (0, ui_1.defaultComponent)({
            user,
            color: colors_1.CrColors.Admin,
            description: `### Confirmation required\nDo you really want to swap **${oldUser.Nickname}** for **${newUser.Nickname}**?\n\nThis will exchange ALL progress, items, and history between both accounts.`,
            buttons: row,
        });
        const response = await (0, discordInteractions_1.replyWithContainer)(interaction, container);
        const collector = (0, collectors_1.createButtonCollector)(interaction, response);
        collector?.on("collect", async (btn) => {
            await (0, discordInteractions_1.deferUpdate)(btn);
            if (btn.customId === "cancel") {
                container = (0, ui_1.defaultComponent)({
                    user,
                    color: discord_js_1.Colors.Grey,
                    description: "### Swap cancelled\nNo changes were made to the database.",
                });
                await (0, discordInteractions_1.replyWithContainer)(interaction, container);
                return collector.stop();
            }
            try {
                // Temporary ID to avoid primary key collisions during swap
                const tempId = `TEMP_${interaction.id.slice(0, 13)}`;
                const details = await UserRepository_1.UserRepository.SwapUsers(oldId, newId, tempId);
                container = (0, ui_1.defaultComponent)({
                    user,
                    color: colors_1.CrColors.Admin,
                    description: `### User swap successful\nSuccessfully swapped data between **${oldUser.Nickname}** (Id: ${oldId}) and **${newUser.Nickname}** (Id: ${newId}).\n\n**Tables updated:**\n${details.join("\n")}`,
                });
                log_1.Log.Success(`Admin ${user.Nickname} (Id: ${user.Id}) swapped Users ${oldUser.Nickname} (Id: ${oldId}) and ${newUser.Nickname} (Id: ${newId}).`);
                await (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
            catch (error) {
                log_1.Log.Error(`Failed to swap Users ${oldUser.Nickname} (Id: ${oldId}) and ${newUser.Nickname} (Id: ${newId}): ${error}`);
                container = (0, ui_1.defaultComponent)({
                    user,
                    color: discord_js_1.Colors.Red,
                    description: `### Swap failed\nChanges have been rolled back.\n\nError: \`${error instanceof Error ? error.message : "Unknown error"}\``,
                });
                await (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
            collector.stop();
        });
        collector?.on("end", async () => {
            await (0, collectors_1.disableButtons)(interaction, container);
        });
    },
};
//# sourceMappingURL=swapusers.js.map