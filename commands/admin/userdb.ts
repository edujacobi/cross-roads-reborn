import {
	ChatInputCommandInteraction,
	ContainerBuilder,
	Locale,
	MessageFlags,
	PermissionFlagsBits,
	SlashCommandBuilder,
	codeBlock, TextDisplayBuilder,
} from "discord.js";
import { Users } from "../../database/Users";
import { Op } from "sequelize";
import { getLanguageFromLocale } from "../../models/Language";
import { CustomContainerBuilder } from "../../ui/builders/CustomContainerBuilder";
import { replyInteraction, replyUserDontExist } from "../../utils/logic";

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

		const user = await Users.findOne({
			where: {
				[Op.or]: {
					nickname: {
						[Op.like]: nameOrId,
					},
					id: nameOrId,
				},
			},
		});

		if (!user) {
			await replyUserDontExist(interaction, getLanguageFromLocale(interaction.locale));
			return null;
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
