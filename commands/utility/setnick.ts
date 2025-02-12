import { ChatInputCommandInteraction, Colors, Locale, SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import { checkUser, replyInteraction } from "../../utils/logic";
import { defaultEmbed } from "../../utils/ui";
import { Users } from "../../database/Users";

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName("setnick")
		.setNameLocalization(Locale.PortugueseBR, "mudanick")
		.setDescription("Set a nickname for you")
		.setDescriptionLocalization(Locale.PortugueseBR, "Muda o seu nick")
		.addStringOption((option: SlashCommandStringOption) =>
			option
				.setName("nick")
				.setDescription("The new nickname")
				.setDescriptionLocalization(Locale.PortugueseBR, "O novo nick")
				.setMaxLength(18)
				.setRequired(true),
		),

	async execute(interaction: ChatInputCommandInteraction) {
		const _user = interaction.user;

		const user = await checkUser(_user.id, interaction);

		if (!user) {
			return;
		}

		const newNick = interaction.options.getString("nick", true);

		const nickExists = await Users.findOne({
			where: {
				nickname: newNick,
			},
		});

		if (nickExists) {
			return replyInteraction(interaction, {
				embeds: [defaultEmbed({
					color: Colors.Red,
					interaction,
					description: `The nickname **${newNick}** is already in use!\n-# by user with id \`${nickExists.id}\``,
					footer: `Please, choose another nickname!`,
				})],
			});
		}

		const oldNick = user.Nickname ?? _user.displayName;

		await user.SetNickname(newNick);

		const embed = defaultEmbed({
			interaction: interaction,
			thumbnail: _user.avatarURL() ?? undefined,
			color: Colors.Green,
			description: `**${oldNick}** now has the nickname **${newNick}**!`,
		});

		await replyInteraction(interaction, { embeds: [embed] });
	},
};