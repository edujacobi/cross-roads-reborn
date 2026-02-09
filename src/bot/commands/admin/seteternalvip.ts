import {
	ChatInputCommandInteraction,
	Colors,
	Locale,
	PermissionFlagsBits,
	SlashCommandBuilder,
	SlashCommandStringOption,
} from "discord.js";
import { defaultComponent } from "@bot/utils/ui";
import { replyInteraction, replyWithContainer, sendPrivateMessage } from "@bot/utils/discordInteractions";
import { EmoteString } from "@bot/utils/emotes";
import { User } from "@core/models/User";
import { Language, Localization } from "@core/models/Language";
import { checkUser } from "@bot/utils/userUtils";

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
			return replyInteraction(interaction, "Didn't find this user");
		}

		await target?.SetEternalVip();

		const messages = {
			[Language.English]: {
				VIP: `Now you are a Eternal VIP!`,
				noVIP: `You are no longer a Eternal VIP... How?`,
			},
			[Language.Portuguese]: {
				VIP: `Você agora é um VIP Eterno!`,
				noVIP: `Você não é mais um VIP Eterno... Como?`,
			},
			[Language.Spanish]: {
				VIP: `Ahora eres un VIP Eternal!`,
				noVIP: `No eres más un VIP Eternal... Cómo?`,
			},
		} as const satisfies Localization;

		let description = "";

		if (target.VipEternal) {
			await sendPrivateMessage({
				userId,
				message: `${EmoteString.VIP} ${messages[target.Language].VIP}`,
				notificationMessage: `🎩 ${messages[target.Language].VIP}`,
				color: Colors.Gold,
			});
			description = `${EmoteString.VIP} user **${target.GetNameWithImage()}** is now a Eternal VIP`;

		}
		else {
			await sendPrivateMessage({
				userId,
				message: `${EmoteString.VIP} ${messages[target.Language].noVIP}`,
				notificationMessage: `🎩 ${messages[target.Language].noVIP}`,
				color: Colors.Gold,
			});
			description = `${EmoteString.VIP} user **${target.GetNameWithImage()}** is no longer a Eternal VIP`;
		}

		const container = defaultComponent({
			user,
			color: Colors.Gold,
			description,
		});

		return replyWithContainer(interaction, container);
	},
};
