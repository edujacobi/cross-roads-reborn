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
		.setName("resetcooldown")
		.setDescription("Reset a specific cooldown for a user!")
		.setDescriptionLocalization(Locale.PortugueseBR, "Zere um tempo de recarga específico para um usuário!")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption(option => option
			.setName("userid")
			.setDescription("The userId to reset the cooldown")
			.setDescriptionLocalization(Locale.PortugueseBR, "O Id do usuário para zerar o tempo de recarga")
			.setRequired(true),
		)
		.addStringOption(option => option
			.setName("cooldown")
			.setDescription("The cooldown to reset")
			.setDescriptionLocalization(Locale.PortugueseBR, "O tempo de recarga para zerar")
			.setRequired(true)
			.addChoices([
				{ name: "Scavenge", value: "scavenge" },
				{ name: "Robbery (Wanted)", value: "robbery" },
				{ name: "Beat Up", value: "beatup" },
			]),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User) {
		const userId = interaction.options.getString("userid", true);
		const cooldown = interaction.options.getString("cooldown", true);
		const target = await checkUser(userId, interaction);

		if (!target) {
			return replyInteraction(interaction, "Didn't find this user");
		}

		await target.ResetCooldown(cooldown, user.Id);

		const container = defaultComponent({
			user,
			color: CrColors.Admin,
			description: `The **${cooldown}** cooldown for user **${target.GetNameWithImage()}** has been reset.`,
		});

		return replyWithContainer(interaction, container);
	},
};
