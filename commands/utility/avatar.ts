import { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandUserOption } from "discord.js";
import { replyInteraction } from "../../utils/logic";

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName("avatar")
		.setDescription("Get the avatar URL of the selected user, or your own avatar.")
		.addUserOption((option: SlashCommandUserOption) =>
			option
				.setName("target")
				.setDescription("The user's avatar to show")),

	async execute(interaction: ChatInputCommandInteraction) {
		const user = interaction.options.getUser("target");
		if (user) {
			return replyInteraction(interaction, `${user.displayName}'s avatar: ${user.displayAvatarURL({
				forceStatic: false,
				size: 4096,
			})}`);
		}
		return replyInteraction(interaction, `Your avatar: ${interaction.user.displayAvatarURL({
			forceStatic: false,
			size: 4096,
		})}`);
	},
};