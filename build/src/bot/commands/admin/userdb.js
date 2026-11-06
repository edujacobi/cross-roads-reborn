"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const UserRepository_1 = require("#core/repositories/UserRepository");
const Language_1 = require("#core/models/Language");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("userdb")
        .setDescription("Get all info from database for a user")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Consiga todas as informações do banco de dados para um usuário")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addStringOption(target => target
        .setName("target")
        .setDescription("The user")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "alvo")
        .setMinLength(3)
        .setRequired(true)
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "O usuário")),
    async execute(interaction) {
        const nameOrId = interaction.options.getString("target", true);
        const user = await UserRepository_1.UserRepository.SearchByNameOrId(nameOrId);
        if (!user) {
            return (0, discordInteractions_1.replyUserDontExist)(interaction, (0, Language_1.getLanguageFromLocale)(interaction.locale));
        }
        const codeblock = (0, discord_js_1.codeBlock)("json", JSON.stringify(user, null, 4));
        const container = new discord_js_1.TextDisplayBuilder()
            .setContent(codeblock);
        return (0, discordInteractions_1.replyInteraction)(interaction, {
            components: [container],
            flags: discord_js_1.MessageFlags.IsComponentsV2,
        });
    },
};
//# sourceMappingURL=userdb.js.map