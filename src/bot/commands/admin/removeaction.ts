import { CrColors } from "#bot/utils/colors";
import { replyInteraction, replyWithContainer } from "#bot/utils/discordInteractions";
import { defaultComponent } from "#bot/utils/ui";
import { checkUser } from "#bot/utils/userUtils";
import type { User } from "#core/models/User";
import {
	type ChatInputCommandInteraction,
	Locale,
	PermissionFlagsBits,
	SlashCommandBuilder
} from "discord.js";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("removeaction")
		.setDescription("Remove a user from a specific action!")
		.setDescriptionLocalization(Locale.PortugueseBR, "Remova um usuário de uma ação específica!")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption(option => option
			.setName("userid")
			.setDescription("The userId to remove the action from")
			.setDescriptionLocalization(Locale.PortugueseBR, "O Id do usuário para remover a ação")
			.setRequired(true),
		)
		.addStringOption(option => option
			.setName("action")
			.setDescription("The action to remove")
			.setDescriptionLocalization(Locale.PortugueseBR, "A ação para remover")
			.setRequired(true)
			.addChoices([
				{ name: "Job", value: "job" },
				{ name: "Scavenge", value: "scavenge" },
				{ name: "Robbery", value: "robbery" },
				{ name: "Beat Up", value: "beatup" },
				{ name: "Casino", value: "casino" },
				{ name: "GangAction", value: "gangaction" },
			]),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User) {
		const userId = interaction.options.getString("userid", true);
		const action = interaction.options.getString("action", true);
		const target = await checkUser(userId, interaction);

		if (!target) {
			return replyInteraction(interaction, "Didn't find this user");
		}

		await target.RemoveAction(action, user.Id);

		const container = defaultComponent({
			user,
			color: CrColors.Admin,
			description: `User **${target.GetNameWithImage()}** has been removed from the **${action}** action.`,
		});

		return replyWithContainer(interaction, container);
	},
};
