import { CrColors } from "#bot/utils/colors";
import { replyInteraction, replyWithContainer } from "#bot/utils/discordInteractions";
import { EmoteString } from "#bot/utils/emotes";
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
		.setName("cure")
		.setDescription("Cure a user from hospital!")
		.setDescriptionLocalization(Locale.PortugueseBR, "Cure um usuário do hospital!")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption(option => option
			.setName("userid")
			.setDescription("The userId to cure")
			.setDescriptionLocalization(Locale.PortugueseBR, "O Id do usuário para curar")
			.setRequired(true),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User) {
		const userId = interaction.options.getString("userid", true);
		const target = await checkUser(userId, interaction);

		if (!target) {
			return replyInteraction(interaction, "Didn't find this user");
		}

		target.Hospital.Time = new Date();
		await target.Update({ hospitalTime: target.Hospital.Time });

		const container = defaultComponent({
			user,
			color: CrColors.Hospital,
			description: `User **${target.GetNameWithImage()}** is now cured from the ${EmoteString.Hospital} Hospital.`,
		});

		return replyWithContainer(interaction, container);
	},
};
