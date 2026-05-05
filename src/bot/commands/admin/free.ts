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
		.setName("free")
		.setDescription("Free a user from prison!")
		.setDescriptionLocalization(Locale.PortugueseBR, "Liberte um usuário da prisão!")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption(option => option
			.setName("userid")
			.setDescription("The userId to free")
			.setDescriptionLocalization(Locale.PortugueseBR, "O Id do usuário para libertar")
			.setRequired(true),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User) {
		const userId = interaction.options.getString("userid", true);
		const target = await checkUser(userId, interaction);

		if (!target) {
			return replyInteraction(interaction, "Didn't find this user");
		}

		target.Prison.Time = new Date();
		target.Prison.HasPaidBribe = false;
		target.Escape.HasTried = false;
		await target.Update({
			prisonTime: target.Prison.Time,
			prisonHasPaidBribe: target.Prison.HasPaidBribe,
			escapeHasTried: target.Escape.HasTried
		});

		const container = defaultComponent({
			user,
			color: CrColors.Police,
			description: `User **${target.GetNameWithImage()}** is now free from ${EmoteString.Prison} Prison.`,
		});

		return replyWithContainer(interaction, container);
	},
};
