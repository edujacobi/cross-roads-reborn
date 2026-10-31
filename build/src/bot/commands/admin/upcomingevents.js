"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const Event_1 = require("#core/models/Event");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const colors_1 = require("#bot/utils/colors");
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("upcomingevents")
        .setDescription("See the upcoming events")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const events = await Event_1.Event.GetUpcomingEvents();
        if (!events.length) {
            return await (0, discordInteractions_1.replyInteraction)(interaction, { content: "🔸 No upcoming events." });
        }
        let description = "";
        events.forEach(event => {
            description += `### \`${event.id}.\` ${Event_1.Event.GetEventTypeText(event.type)}: ${event.value}\n-# Start: ${event.periodStart}\n-# End: ${event.periodEnd}\n`;
        });
        const container = new CustomContainerBuilder_1.CustomContainerBuilder()
            .setAccentColor(colors_1.CrColors.Default)
            .addTexts([
            "# 🔸 Upcoming Events",
            description,
        ]);
        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
    },
};
//# sourceMappingURL=upcomingevents.js.map