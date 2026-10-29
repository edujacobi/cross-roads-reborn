"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const UserRepository_1 = require("#core/repositories/UserRepository");
const Language_1 = require("#core/models/Language");
const Classes_1 = require("#core/types/Classes");
const ui_1 = require("#bot/utils/ui");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("classes")
        .setDescription("See all Classes of users")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Veja todos as Classes dos usuários")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator),
    async execute(interaction, user) {
        await (0, discordInteractions_1.deferReply)(interaction);
        const groupedCountResultItems = await UserRepository_1.UserRepository.CountGroupedByClass();
        let text = "";
        const total = groupedCountResultItems.reduce((acc, currentValue) => acc + currentValue.count, 0);
        for (const item of groupedCountResultItems.sort((a, b) => b.count - a.count)) {
            const classData = Classes_1.ClassList[item.class];
            text += `### ${classData.Image.Emote.String} ${classData.Name[Language_1.Language.English]}: ${item.count} (${(item.count / total * 100).toFixed(2)}%)\n`;
        }
        const container = (0, ui_1.defaultComponent)({
            user,
            description: text,
        });
        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
    },
};
//# sourceMappingURL=classes.js.map