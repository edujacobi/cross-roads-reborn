import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Event } from "@core/models/Event";
import { replyInteraction, replyWithContainer } from "@bot/utils/discordInteractions";
import { CrColors } from "@bot/utils/colors";
import { CustomContainerBuilder } from "@bot/ui/builders/CustomContainerBuilder";

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

		const container = new CustomContainerBuilder()
			.setAccentColor(CrColors.Default)
			.addTexts([
				"# 🔸 Upcoming Events",
				description,
			]);

		return replyWithContainer(interaction, container);
	},
};