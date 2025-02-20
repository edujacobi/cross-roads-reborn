import {
	ChatInputCommandInteraction, Colors,
	Locale,
	PermissionFlagsBits,
	SlashCommandBuilder,
	SlashCommandStringOption,
} from "discord.js";
import { defaultEmbed } from "../../utils/ui";
import { checkUser, replyInteraction, sendPrivateMessage } from "../../utils/logic";
import { EmoteString } from "../../utils/emotes";
import { User } from "../../models/User";

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

	async execute(interaction: ChatInputCommandInteraction, user: User) {

		const userId = interaction.options.getString("userid", true);

		const target = await checkUser(userId, interaction);

		if (!target) {
			return await interaction.reply("Didn't find this user");
		}

		await target?.SetEternalVip();

		if (target.VipEternal) {
			await sendPrivateMessage(userId, `${EmoteString.VIP} Now you are a Eternal VIP!`, Colors.Gold);

			await replyInteraction(interaction, {
				embeds: [defaultEmbed({
					nickname: user.Nickname,
					interaction: interaction,
					color: Colors.Gold,
					description: `${EmoteString.VIP} user <@${userId}> is now a Eternal VIP`,
				})],
			});
		}
		else {
			await sendPrivateMessage(userId, `${EmoteString.VIP} You are no longer a Eternal VIP... How?`, Colors.Gold);

			await replyInteraction(interaction, {
				embeds: [defaultEmbed({
					nickname: user.Nickname,
					interaction: interaction,
					color: Colors.Gold,
					description: `${EmoteString.VIP} user <@${userId}> is no longer a Eternal VIP`,
				})],
			});
		}
	},
};
