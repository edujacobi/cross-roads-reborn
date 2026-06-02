import {
	type ChatInputCommandInteraction,
	codeBlock,
	Locale,
	MessageFlags,
	PermissionFlagsBits,
	SlashCommandBuilder,
	TextDisplayBuilder,
} from "discord.js";
import { UserRepository } from "#core/repositories/UserRepository";
import { getLanguageFromLocale } from "#core/models/Language";
import { replyInteraction, replyUserDontExist } from "#bot/utils/discordInteractions";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("userdb")
		.setDescription("Get all info from database for a user")
		.setDescriptionLocalization(Locale.PortugueseBR, "Consiga todas as informações do banco de dados para um usuário")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption(target => target
			.setName("target")
			.setDescription("The user")
			.setNameLocalization(Locale.PortugueseBR, "alvo")
			.setMinLength(3)
			.setRequired(true)
			.setDescriptionLocalization(Locale.PortugueseBR, "O usuário"),
		),

	async execute(interaction: ChatInputCommandInteraction) {
		const nameOrId = interaction.options.getString("target", true);

		const user = await UserRepository.SearchByNameOrId(nameOrId);

		if (!user) {
			return replyUserDontExist(interaction, getLanguageFromLocale(interaction.locale));
		}

		const codeblock = codeBlock("json", JSON.stringify(user, null, 4));

		const container = new TextDisplayBuilder()
			.setContent(codeblock);

		return replyInteraction(interaction, {
			components: [container],
			flags: MessageFlags.IsComponentsV2,
		});
	},
};
