import {
	ChatInputCommandInteraction,
	Locale,
	PermissionFlagsBits,
	SlashCommandBuilder,
	SlashCommandIntegerOption,
	SlashCommandStringOption,
} from "discord.js";
import { defaultEmbed, EmoteString } from "../../utils/ui";
import { checkUser, replyInteraction, sendPrivateMessage } from "../../utils/logic";

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

	async execute(interaction: ChatInputCommandInteraction) {

		const userId = interaction.options.getString("userid", true);
		const days = interaction.options.getInteger("days", true);

		const user = await checkUser(userId, interaction);

		if (!user) {
			return await interaction.reply("Didn't find this user");
		}

		await user?.AddVip(days);

		await sendPrivateMessage(userId, `${EmoteString.VIP} You received ${days} days of VIP!`);

		await replyInteraction(interaction, {
			embeds: [defaultEmbed({
				interaction: interaction,
				description: `${EmoteString.VIP} ${days} days of VIP added to user <@${userId}>`,
			})],
		});
	},
};
