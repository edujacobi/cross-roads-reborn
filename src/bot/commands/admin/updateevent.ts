import {
	type ChatInputCommandInteraction,
	PermissionFlagsBits,
	SlashCommandBuilder,
	type SlashCommandIntegerOption,
	type SlashCommandNumberOption,
	type SlashCommandStringOption,
} from "discord.js";
import { Event } from "@core/models/Event";
import { replyInteraction } from "@bot/utils/discordInteractions";
import type { Events } from "@core/database/Events";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("updateevent")
		.setDescription("Update an existing event")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addIntegerOption((option: SlashCommandIntegerOption) =>
			option
				.setName("id")
				.setDescription("Event Id")
				.setRequired(true),
		)
		.addNumberOption((option: SlashCommandNumberOption) =>
			option
				.setName("value")
				.setDescription("Event value")
				.setRequired(false),
		)
		.addStringOption((option: SlashCommandStringOption) =>
			option
				.setName("start")
				.setDescription("Event start date (pattern: YYYY-MM-DDTHH:mm:ss.sssZ)")
				.setRequired(false),
		)
		.addStringOption((option: SlashCommandStringOption) =>
			option
				.setName("end")
				.setDescription("Event end date (pattern: YYYY-MM-DDTHH:mm:ss.sssZ)")
				.setRequired(false),
		),

	async execute(interaction: ChatInputCommandInteraction) {
		const id = interaction.options.getInteger("id", true);
		const value = interaction.options.getNumber("value");
		const periodStart = interaction.options.getString("start");
		const periodEnd = interaction.options.getString("end");

		const updatedData: Partial<Events> = {};
		if (value !== null) {
			updatedData.value = value;
		}
		if (periodStart !== null) {
			updatedData.periodStart = new Date(periodStart);
		}
		if (periodEnd !== null) {
			updatedData.periodEnd = new Date(periodEnd);
		}

		const success = await Event.Update(id, updatedData);

		if (success) {
			await replyInteraction(interaction, { content: "🔸 Event updated successfully!" });
		}
		else {
			await replyInteraction(interaction, { content: "🔸 Failed to update event." });
		}
	},
};