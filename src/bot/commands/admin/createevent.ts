import {
	type ChatInputCommandInteraction,
	PermissionFlagsBits,
	SlashCommandBuilder,
	type SlashCommandIntegerOption,
	type SlashCommandNumberOption,
	type SlashCommandStringOption,
} from "discord.js";
import { Event, EventType } from "#core/models/Event";
import { replyInteraction } from "#bot/utils/discordInteractions";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("createevent")
		.setDescription("Create a new event")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addIntegerOption((option: SlashCommandIntegerOption) =>
			option
				.setName("type")
				.setDescription("Event type")
				.setRequired(true)
				.addChoices([
					{
						name: Event.GetEventTypeText(EventType.JOB_TIME_MULTIPLIER),
						value: EventType.JOB_TIME_MULTIPLIER,
					},
					{
						name: Event.GetEventTypeText(EventType.SCAVENGE_TIME_MULTIPLIER),
						value: EventType.SCAVENGE_TIME_MULTIPLIER,
					},
					{
						name: Event.GetEventTypeText(EventType.WANTED_TIME_MULTIPLIER),
						value: EventType.WANTED_TIME_MULTIPLIER,
					},
					{
						name: Event.GetEventTypeText(EventType.HOSPITAL_TIME_MULTIPLIER),
						value: EventType.HOSPITAL_TIME_MULTIPLIER,
					},
					{
						name: Event.GetEventTypeText(EventType.PRISON_TIME_MULTIPLIER),
						value: EventType.PRISON_TIME_MULTIPLIER,
					},
					{
						name: Event.GetEventTypeText(EventType.SCAVENGE_CHANCE_BONUS),
						value: EventType.SCAVENGE_CHANCE_BONUS,
					},
					{
						name: Event.GetEventTypeText(EventType.ROB_LOCATION_CHANCE_BONUS),
						value: EventType.ROB_LOCATION_CHANCE_BONUS,
					},
					{
						name: Event.GetEventTypeText(EventType.PRISON_ESCAPE_CHANCE_BONUS),
						value: EventType.PRISON_ESCAPE_CHANCE_BONUS,
					},
				]),
		)
		.addNumberOption((option: SlashCommandNumberOption) =>
			option
				.setName("value")
				.setDescription("Event value")
				.setRequired(true),
		)
		.addStringOption((option: SlashCommandStringOption) =>
			option
				.setName("start")
				.setDescription("Event start date (pattern: YYYY-MM-DDTHH:mm:ss.sssZ)")
				.setRequired(true),
		)
		.addStringOption((option: SlashCommandStringOption) =>
			option
				.setName("end")
				.setDescription("Event end date (pattern: YYYY-MM-DDTHH:mm:ss.sssZ)")
				.setRequired(true),
		),

	async execute(interaction: ChatInputCommandInteraction) {
		const type = interaction.options.getInteger("type", true) as EventType;
		const value = interaction.options.getNumber("value", true);
		const periodStart = new Date(interaction.options.getString("start", true));
		const periodEnd = new Date(interaction.options.getString("end", true));

		const success = await Event.Create(type, value, periodStart, periodEnd);

		if (success) {
			await replyInteraction(interaction, { content: "🔸 Event created successfully!" });
		}
		else {
			await replyInteraction(interaction, { content: "🔸 Failed to create event." });
		}
	},
};