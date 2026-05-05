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
		.setName("setnickadm")
		.setDescription("Set a new nickname for a user!")
		.setDescriptionLocalization(Locale.PortugueseBR, "Defina um novo nickname para um usuário!")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption(option => option
			.setName("userid")
			.setDescription("The userId to change the nickname")
			.setDescriptionLocalization(Locale.PortugueseBR, "O Id do usuário para mudar o nickname")
			.setRequired(true),
		)
		.addStringOption(option => option
			.setName("nickname")
			.setDescription("The new nickname")
			.setDescriptionLocalization(Locale.PortugueseBR, "O novo nickname")
			.setRequired(true),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User) {
		const userId = interaction.options.getString("userid", true);
		const nickname = interaction.options.getString("nickname", true);
		const target = await checkUser(userId, interaction);

		if (!target) {
			return replyInteraction(interaction, "Didn't find this user");
		}

		const oldNickname = target.Nickname;

		await target.SetNickname(nickname);

		const container = defaultComponent({
			user,
			color: CrColors.Admin,
			description: `User **${oldNickname}**'s nickname has been changed to **${target.Nickname}**.`,
		});

		return replyWithContainer(interaction, container);
	},
};
