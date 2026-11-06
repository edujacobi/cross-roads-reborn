"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const Event_1 = require("#core/models/Event");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("createevent")
        .setDescription("Create a new event")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
        .addIntegerOption((option) => option
        .setName("type")
        .setDescription("Event type")
        .setRequired(true)
        .addChoices([
        {
            name: Event_1.Event.GetEventTypeText(Event_1.EventType.JOB_TIME_MULTIPLIER),
            value: Event_1.EventType.JOB_TIME_MULTIPLIER,
        },
        {
            name: Event_1.Event.GetEventTypeText(Event_1.EventType.SCAVENGE_TIME_MULTIPLIER),
            value: Event_1.EventType.SCAVENGE_TIME_MULTIPLIER,
        },
        {
            name: Event_1.Event.GetEventTypeText(Event_1.EventType.WANTED_TIME_MULTIPLIER),
            value: Event_1.EventType.WANTED_TIME_MULTIPLIER,
        },
        {
            name: Event_1.Event.GetEventTypeText(Event_1.EventType.HOSPITAL_TIME_MULTIPLIER),
            value: Event_1.EventType.HOSPITAL_TIME_MULTIPLIER,
        },
        {
            name: Event_1.Event.GetEventTypeText(Event_1.EventType.PRISON_TIME_MULTIPLIER),
            value: Event_1.EventType.PRISON_TIME_MULTIPLIER,
        },
        {
            name: Event_1.Event.GetEventTypeText(Event_1.EventType.SCAVENGE_CHANCE_BONUS),
            value: Event_1.EventType.SCAVENGE_CHANCE_BONUS,
        },
        {
            name: Event_1.Event.GetEventTypeText(Event_1.EventType.ROB_LOCATION_CHANCE_BONUS),
            value: Event_1.EventType.ROB_LOCATION_CHANCE_BONUS,
        },
        {
            name: Event_1.Event.GetEventTypeText(Event_1.EventType.PRISON_ESCAPE_CHANCE_BONUS),
            value: Event_1.EventType.PRISON_ESCAPE_CHANCE_BONUS,
        },
    ]))
        .addNumberOption((option) => option
        .setName("value")
        .setDescription("Event value")
        .setRequired(true))
        .addStringOption((option) => option
        .setName("start")
        .setDescription("Event start date (pattern: YYYY-MM-DDTHH:mm:ss.sssZ)")
        .setRequired(true))
        .addStringOption((option) => option
        .setName("end")
        .setDescription("Event end date (pattern: YYYY-MM-DDTHH:mm:ss.sssZ)")
        .setRequired(true)),
    async execute(interaction) {
        const type = interaction.options.getInteger("type", true);
        const value = interaction.options.getNumber("value", true);
        const periodStart = new Date(interaction.options.getString("start", true));
        const periodEnd = new Date(interaction.options.getString("end", true));
        const success = await Event_1.Event.Create(type, value, periodStart, periodEnd);
        if (success) {
            await (0, discordInteractions_1.replyInteraction)(interaction, { content: "🔸 Event created successfully!" });
        }
        else {
            await (0, discordInteractions_1.replyInteraction)(interaction, { content: "🔸 Failed to create event." });
        }
    },
};
//# sourceMappingURL=createevent.js.map