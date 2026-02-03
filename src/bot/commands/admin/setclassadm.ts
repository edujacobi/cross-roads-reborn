import {
	ChatInputCommandInteraction,
	Locale,
	PermissionFlagsBits,
	SlashCommandBuilder,
	SlashCommandIntegerOption,
	SlashCommandStringOption,
} from "discord.js";
import { defaultComponent } from "@bot/utils/ui";
import { replyInteraction, replyWithContainer, sendPrivateMessage } from "@bot/utils/discordInteractions";
import { User } from "@core/models/User";
import { Language } from "@core/models/Language";
import { ClassId, ClassList } from "@core/types/Classes";
import { CrColors } from "@bot/utils/colors";
import { checkUser } from "@bot/utils/userUtils";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("setclassadm")
		.setDescription("Set class to an user!")
		.setDescriptionLocalization(Locale.PortugueseBR, "Adicione classe para um usuário!")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption((option: SlashCommandStringOption) =>
			option
				.setName("userid")
				.setDescription("The userId who will receive the class")
				.setDescriptionLocalization(Locale.PortugueseBR, "O ID do usuário que vai receber a classe")
				.setRequired(true),
		)
		.addIntegerOption((option: SlashCommandIntegerOption) =>
			option
				.setName("class")
				.setDescription("Which class")
				.setDescriptionLocalization(Locale.PortugueseBR, "Qual classe")
				.setRequired(true)
				.addChoices([{
					name: ClassList[ClassId.Attorney].Name[Language.English],
					value: ClassId.Attorney,
				}, {
					name: ClassList[ClassId.Entrepreneur].Name[Language.English],
					value: ClassId.Entrepreneur,
				}, {
					name: ClassList[ClassId.Hobo].Name[Language.English],
					value: ClassId.Hobo,
				}, {
					name: ClassList[ClassId.Thief].Name[Language.English],
					value: ClassId.Thief,
				}]),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User) {

		const userId = interaction.options.getString("userid", true);
		const classId = interaction.options.getInteger("class", true);

		const target = await checkUser(userId, interaction);

		if (!target) {
			return replyInteraction(interaction, "Didn't find this user");
		}

		await target.SetClass(classId);

		const messages = {
			[Language.English]: `${ClassList[classId].Image.Emote.String} You are now ${ClassList[classId].Name[Language.English]}`,
			[Language.Portuguese]: `${ClassList[classId].Image.Emote.String} Você agora é ${ClassList[classId].Name[Language.Portuguese]}`,
			[Language.Spanish]: `${ClassList[classId].Image.Emote.String} Ahora eres ${ClassList[classId].Name[Language.Spanish]}`,
		} as const;

		await sendPrivateMessage(userId, messages[target.Language], CrColors.Default);

		const container = defaultComponent({
			user,
			color: CrColors.Default,
			description: `User **${target.GetNameWithImage()}** is now ${ClassList[classId].Name[Language.English]}`,
		});

		return replyWithContainer(interaction, container);
	},
};
