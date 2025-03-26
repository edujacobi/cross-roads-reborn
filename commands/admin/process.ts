import { ChatInputCommandInteraction, Locale, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { getClient } from "../../client";
import { replyInteraction } from "../../utils/logic";
import { CrColors } from "../../utils/colors";
import { Users } from "../../database/Users";
import { Op } from "sequelize";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("process")
		.setDescription("See Node process data")
		.setDescriptionLocalization(Locale.PortugueseBR, "Veja dados do processo Node")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	async execute(interaction: ChatInputCommandInteraction) {

		const client = getClient();

		const playerCount = await Users.count({
			where: {
				class: {
					[Op.not]: 0,
				},
			},
		});

		const embed = new CustomEmbedBuilder()
			.setColor(CrColors.Admin)
			.setThumbnail(client.user?.avatarURL() ?? null)
			.setDescription(`# \`${client.uptime ? Math.floor(client.uptime / 1000 / 60) : 0} min\`
-# Uptime
# \`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\`
-# Memory usage
# \`${playerCount} (${client.userLastCommand.size} online)\`
-# Active players`);

		// .setFields([
		// 	{
		// 		name: "Uptime",
		// 		value: `\`${client.uptime ? Math.floor(client.uptime / 1000 / 60) : 0} min\``,
		// 		inline: true,
		// 	},
		// 	{
		// 		name: "Memory usage",
		// 		value: `\`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\``,
		// 		inline: true,
		// 	},
		// 	{
		// 		name: "Online",
		// 		value: `\`${client.userLastCommand.size}\``,
		// 		inline: true,
		// 	},
		// 	{
		// 		name: "Players",
		// 		value: `\`${playerCount}\``,
		// 		inline: true,
		// 	},
		// ]);

		await replyInteraction(interaction, { embeds: [embed] });
	},
};
