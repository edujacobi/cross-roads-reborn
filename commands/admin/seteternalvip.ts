import {
	ChatInputCommandInteraction,
	Locale,
	PermissionFlagsBits,
	SlashCommandBuilder,
	SlashCommandStringOption,
} from "discord.js";
import { defaultEmbed } from "../../utils/ui";
import { checkUser, replyInteraction, sendPrivateMessage } from "../../utils/logic";
import { EmoteString } from "../../utils/emotes";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("seteternalvip")
		.setDescription("Set eternal VIP to an user!")
		.setDescriptionLocalization(Locale.PortugueseBR, "Adicione VIP eterno para um usuário!")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption((option: SlashCommandStringOption) =>
			option
				.setName("userid")
				.setDescription("The userId who will receive the vip")
				.setDescriptionLocalization(Locale.PortugueseBR, "O ID do usuário que vai receber o VIP")
				.setRequired(true),
		),

	async execute(interaction: ChatInputCommandInteraction) {

		const userId = interaction.options.getString("userid", true);

		const user = await checkUser(userId, interaction);

		if (!user) {
			return await interaction.reply("Didn't find this user");
		}

		await user?.SetEternalVip();

		if (user.VipEternal) {
			await sendPrivateMessage(userId, `${EmoteString.VIP} Now you are a Eternal VIP!`);

			await replyInteraction(interaction, {
				embeds: [defaultEmbed({
					interaction: interaction,
					description: `${EmoteString.VIP} user <@${userId}> is now a Eternal VIP`,
				})],
			});
		}
		else {
			await sendPrivateMessage(userId, `${EmoteString.VIP} You are no longer a Eternal VIP... How?`);

			await replyInteraction(interaction, {
				embeds: [defaultEmbed({
					interaction: interaction,
					description: `${EmoteString.VIP} user <@${userId}> is no longer a Eternal VIP`,
				})],
			});
		}
	},
};
