"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DashboardCanvasBuilder_1 = require("#bot/ui/builders/DashboardCanvasBuilder");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const Dashboard_1 = require("#core/models/Dashboard");
const discord_js_1 = require("discord.js");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("dashboard")
        .setDescription("See the game dashboard and statistics")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Veja o painel do jogo e estatísticas")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await (0, discordInteractions_1.deferReply)(interaction);
        const stats = await Dashboard_1.Dashboard.GetCurrentStats();
        const history = await Dashboard_1.Dashboard.GetLast30Days();
        const builder = new DashboardCanvasBuilder_1.DashboardCanvasBuilder();
        const buffer = await builder.Draw(stats, history);
        const attachment = new discord_js_1.AttachmentBuilder(buffer, { name: "dashboard.webp" });
        return (0, discordInteractions_1.replyInteraction)(interaction, {
            files: [attachment],
        });
    },
};
//# sourceMappingURL=dashboard.js.map