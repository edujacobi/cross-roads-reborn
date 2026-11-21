"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const Event_1 = require("#core/models/Event");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("updateevent")
        .setDescription("Update an existing event")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addIntegerOption((option) => option
        .setName("id")
        .setDescription("Event Id")
        .setRequired(true))
        .addNumberOption((option) => option
        .setName("value")
        .setDescription("Event value")
        .setRequired(false))
        .addStringOption((option) => option
        .setName("start")
        .setDescription("Event start date (pattern: YYYY-MM-DDTHH:mm:ss.sssZ)")
        .setRequired(false))
        .addStringOption((option) => option
        .setName("end")
        .setDescription("Event end date (pattern: YYYY-MM-DDTHH:mm:ss.sssZ)")
        .setRequired(false)),
    async execute(interaction) {
        const id = interaction.options.getInteger("id", true);
        const value = interaction.options.getNumber("value");
        const periodStart = interaction.options.getString("start");
        const periodEnd = interaction.options.getString("end");
        const updatedData = {};
        if (value !== null) {
            updatedData.value = value;
        }
        if (periodStart !== null) {
            updatedData.periodStart = new Date(periodStart);
        }
        if (periodEnd !== null) {
            updatedData.periodEnd = new Date(periodEnd);
        }
        const success = await Event_1.Event.Update(id, updatedData);
        if (success) {
            await (0, discordInteractions_1.replyInteraction)(interaction, { content: "🔸 Event updated successfully!" });
        }
        else {
            await (0, discordInteractions_1.replyInteraction)(interaction, { content: "🔸 Failed to update event." });
        }
    },
};
//# sourceMappingURL=updateevent.js.map