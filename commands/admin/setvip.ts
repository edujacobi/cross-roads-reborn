import {
	ChatInputCommandInteraction,
	Locale,
	PermissionFlagsBits,
	SlashCommandBuilder,
	SlashCommandIntegerOption,
	SlashCommandStringOption,
} from "discord.js";
import { defaultEmbed } from "../../utils/ui";
import { checkUser, replyInteraction, sendPrivateMessage } from "../../utils/logic";
import { EmoteString } from "../../utils/emotes";
import { User } from "../../models/User";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("setvip")
		.setDescription("Set VIP to an user!")
		.setDescriptionLocalization(Locale.PortugueseBR, "Adicione VIP para um usuário!")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption((option: SlashCommandStringOption) =>
			option
				.setName("userid")
				.setDescription("The userId who will receive the vip")
				.setDescriptionLocalization(Locale.PortugueseBR, "O ID do usuário que vai receber o VIP")
				.setRequired(true),
		)
		.addIntegerOption((option: SlashCommandIntegerOption) =>
			option
				.setName("days")
				.setDescription("How many days of VIP to add")
				.setDescriptionLocalization(Locale.PortugueseBR, "Quantos dias adicionar")
				.setRequired(true),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User) {

		const userId = interaction.options.getString("userid", true);
		const days = interaction.options.getInteger("days", true);

		const target = await checkUser(userId, interaction);

		if (!target) {
			return await interaction.reply("Didn't find this user");
		}

		await target?.AddVip(days);

		await sendPrivateMessage(userId, `${EmoteString.VIP} You received ${days} days of VIP!`);

		await replyInteraction(interaction, {
			embeds: [defaultEmbed({
				nickname: user.Nickname,
				interaction: interaction,
				description: `${EmoteString.VIP} ${days} days of VIP added to user <@${userId}>`,
			})],
		});
	},
};
