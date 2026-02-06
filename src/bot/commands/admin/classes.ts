import { ChatInputCommandInteraction, Locale, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Users } from "@core/database/Users";
import { Op } from "sequelize";
import { Language } from "@core/models/Language";
import { User } from "@core/models/User";
import { ClassId, ClassList } from "@core/types/Classes";
import { defaultComponent } from "@bot/utils/ui";
import { deferReply, replyWithContainer } from "@bot/utils/discordInteractions";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("classes")
		.setDescription("See all Classes of users")
		.setDescriptionLocalization(Locale.PortugueseBR, "Veja todos as Classes dos usuários")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	async execute(interaction: ChatInputCommandInteraction, user: User) {
		await deferReply(interaction);

		const groupedCountResultItems = await Users.count({
			attributes: ["class"],
			group: ["class"],
			where: {
				class: {
					[Op.not]: ClassId.None,
				},
			},
		});

		let text = "";
		const total = groupedCountResultItems.reduce((acc, currentValue) => acc + currentValue.count, 0);

		for (const item of groupedCountResultItems.sort((a, b) => b.count - a.count)) {
			const classData = ClassList[<ClassId>item.class];
			text += `### ${classData.Image.Emote.String} ${classData.Name[Language.English]}: ${item.count} (${(item.count / total * 100).toFixed(2)}%)\n`;
		}

		const container = defaultComponent({
			user,
			description: text,
		});

		return replyWithContainer(interaction, container);
	},
};
