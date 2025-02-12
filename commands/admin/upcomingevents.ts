import { ChatInputCommandInteraction, Colors, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Event } from "../../models/Event";
import { replyInteraction } from "../../utils/logic";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("upcomingevents")
		.setDescription("See the upcoming events")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	async execute(interaction: ChatInputCommandInteraction) {

		const events = await Event.GetUpcomingEvents();

		if (!events.length) {
			return await replyInteraction(interaction, { content: "🔸 No upcoming events." });
		}

		let description = "";

		events.forEach(event => {
			description += `### \`${event.id}.\` ${Event.GetEventTypeText(event.type)}: ${event.value}\n-# Start: ${event.periodStart}\n-# End: ${event.periodEnd}\n`;
		});

		const embed = new CustomEmbedBuilder()
			.setTitle("🔸 Upcoming Events")
			.setColor(Colors.Red)
			.setDescription(description);

		await replyInteraction(interaction, { embeds: [embed] });

	},
};