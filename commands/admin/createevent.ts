import {
	ChatInputCommandInteraction,
	PermissionFlagsBits,
	SlashCommandBuilder, SlashCommandIntegerOption,
	SlashCommandNumberOption,
	SlashCommandStringOption,
} from "discord.js";
import { Event, EventType } from "../../models/Event";
import { replyInteraction } from "../../utils/logic";

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
					{ name: "EXP Multiplier", value: EventType.EXP_MULTIPLIER },
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