import {
	type ChatInputCommandInteraction,
	Colors,
	Locale,
	PermissionFlagsBits,
	SlashCommandBuilder,
	type SlashCommandIntegerOption,
	type SlashCommandStringOption,
} from "discord.js";
import { defaultComponent } from "@bot/utils/ui";
import { replyInteraction, replyWithContainer, sendPrivateMessage } from "@bot/utils/discordInteractions";
import { EmoteString } from "@bot/utils/emotes";
import type { User } from "@core/models/User";
import { Language } from "@core/models/Language";
import { checkUser } from "@bot/utils/userUtils";

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
				.setDescriptionLocalization(Locale.PortugueseBR, "O Id do usuário que vai receber o VIP")
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
			[Language.English]: `${EmoteString.VIP} You received ${days} days of VIP`,
			[Language.Portuguese]: `${EmoteString.VIP} Você recebeu ${days} dias de VIP`,
			[Language.Spanish]: `${EmoteString.VIP} Has recibido ${days} días de VIP`,
		} as const;

		await sendPrivateMessage(userId, messages[target.Language], Colors.Gold);

		const container = defaultComponent({
			user,
			color: Colors.Gold,
			description: `${EmoteString.VIP} ${days} days of VIP added to user **${target.GetNameWithImage()}**`,
		});

		return replyWithContainer(interaction, container);
	},
};
