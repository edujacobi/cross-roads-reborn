import {
	ChatInputCommandInteraction,
	PermissionFlagsBits,
	SlashCommandBuilder,
	SlashCommandStringOption,
} from "discord.js";
import { defaultEmbed } from "../../utils/ui";
import { Badge } from "../../models/Badge";
import { replyInteraction } from "../../utils/logic";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("setbadge")
		.setDescription("Set a badge to a user!")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption((option: SlashCommandStringOption) =>
			option
				.setName("description")
				.setDescription("The description of the badge")
				.setMaxLength(32)
				.setRequired(true),
		)
		.addStringOption((option: SlashCommandStringOption) =>
			option
				.setName("description-long")
				.setDescription("The long description of the badge")
				.setMaxLength(255)
				.setRequired(true),
		)
		.addStringOption((option: SlashCommandStringOption) =>
			option
				.setName("emoji")
				.setDescription("The emoji id of the badge")
				.setRequired(true),
		)
		.addStringOption((option: SlashCommandStringOption) =>
			option
				.setName("userid")
				.setDescription("The userId who will receive the badge")
				.setRequired(true),
		),

	async execute(interaction: ChatInputCommandInteraction) {

		const description = interaction.options.getString("description", true);
		const descriptionLong = interaction.options.getString("description-long", true);
		const emoji = interaction.options.getString("emoji", true);
		const userId = interaction.options.getString("userid", true);

		const badge = new Badge();
		badge.UserId = userId;
		badge.Description = description;
		badge.DescriptionLong = descriptionLong;
		badge.Emoji = emoji;

		await badge.Create();

		await replyInteraction(interaction, {
			embeds: [defaultEmbed({
				interaction: interaction,
				description: `Badge ${emoji}${description} added to user ${userId}`,
			})],
		});


	},
};
