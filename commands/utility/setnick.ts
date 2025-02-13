import { ChatInputCommandInteraction, Colors, Locale, SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import { replyInteraction } from "../../utils/logic";
import { defaultEmbed } from "../../utils/ui";
import { Users } from "../../database/Users";
import { User } from "../../models/User";

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
				.setMinLength(3)
				.setMaxLength(18)
				.setRequired(true),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User) {
		const newNick = interaction.options.getString("nick", true);

		if (!/^[A-Za-z]+$/.test(newNick)) {
			return replyInteraction(interaction, {
				embeds: [defaultEmbed({
					nickname: "Setting nickname",
					color: Colors.Red,
					interaction,
					description: `The nickname **${newNick}** is invalid! It can only contain letters.`,
					footer: `Please, choose another nickname!`,
				})],
			});
		}

		const nickExists = await Users.findOne({
			where: {
				nickname: newNick,
			},
		});

		if (nickExists) {
			return replyInteraction(interaction, {
				embeds: [defaultEmbed({
					nickname: "Setting nickname",
					color: Colors.Red,
					interaction,
					description: `The nickname **${newNick}** is already in use!\n-# by user with id \`${nickExists.id}\``,
					footer: `Please, choose another nickname!`,
				})],
			});
		}

		const newUser = user.Nickname === "";

		const oldNick = user.Nickname || interaction.user.displayName;

		await user.SetNickname(newNick);

		const description = newUser ? `A new player arrives! Welcome **${newNick}**!` : `**${oldNick}** now has the nickname **${newNick}**!`;

		const embed = defaultEmbed({
			nickname: user.Nickname,
			interaction: interaction,
			thumbnail: interaction.user.avatarURL() ?? undefined,
			color: Colors.Green,
			description,
		});

		await replyInteraction(interaction, { embeds: [embed] });
	},
};