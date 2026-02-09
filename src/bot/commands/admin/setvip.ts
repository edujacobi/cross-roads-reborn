import {
	ChatInputCommandInteraction,
	Colors,
	Locale,
	PermissionFlagsBits,
	SlashCommandBuilder,
	SlashCommandIntegerOption,
	SlashCommandStringOption,
} from "discord.js";
import { defaultComponent } from "@bot/utils/ui";
import { replyInteraction, replyWithContainer, sendPrivateMessage } from "@bot/utils/discordInteractions";
import { EmoteString } from "@bot/utils/emotes";
import { User } from "@core/models/User";
import { Language } from "@core/models/Language";
import { checkUser } from "@bot/utils/userUtils";
import { CrColors } from "@bot/utils/colors";

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

	async execute(interaction: ChatInputCommandInteraction, user: User) {

		const userId = interaction.options.getString("userid", true);
		const days = interaction.options.getInteger("days", true);

		const target = await checkUser(userId, interaction);

		if (!target) {
			return replyInteraction(interaction, "Didn't find this user");
		}

		await target?.AddVip(days);

		const messages = {
			[Language.English]: `You received ${days} days of VIP`,
			[Language.Portuguese]: `Você recebeu ${days} dias de VIP`,
			[Language.Spanish]: `Has recibido ${days} días de VIP`,
		} as const;

		await sendPrivateMessage({
			userId,
			message: `${EmoteString.VIP} ${messages[target.Language]}`,
			notificationMessage: `🎩 ${messages[target.Language]}`,
			color: Colors.Gold
		});

		const container = defaultComponent({
			user,
			color: Colors.Gold,
			description: `${EmoteString.VIP} ${days} days of VIP added to user **${target.GetNameWithImage()}**`,
		});

		return replyWithContainer(interaction, container);
	},
};
