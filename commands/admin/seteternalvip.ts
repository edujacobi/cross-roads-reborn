import {
	ChatInputCommandInteraction,
	Colors,
	Locale,
	PermissionFlagsBits,
	SlashCommandBuilder,
	SlashCommandStringOption,
} from "discord.js";
import { defaultComponent } from "../../utils/ui";
import { checkUser, replyInteraction, replyWithContainer, sendPrivateMessage } from "../../utils/logic";
import { EmoteString } from "../../utils/emotes";
import { User } from "../../models/User";
import { Language } from "../../models/Language";

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
				VIP: `${EmoteString.VIP} Now you are a Eternal VIP!`,
				noVIP: `${EmoteString.VIP} You are no longer a Eternal VIP... How?`,
			},
			[Language.Portuguese]: {
				VIP: `${EmoteString.VIP} Você agora é um VIP Eterno!`,
				noVIP: `${EmoteString.VIP} Você não é mais um VIP Eterno... Como?`,
			},
			[Language.Spanish]: {
				VIP: `${EmoteString.VIP} Ahora eres un VIP Eternal!`,
				noVIP: `${EmoteString.VIP} No eres más un VIP Eternal... Cómo?`,
			},
		} as const;

		let description = "";

		if (target.VipEternal) {
			await sendPrivateMessage(userId, messages[target.Language].VIP, Colors.Gold);
			description = `${EmoteString.VIP} user **${target.GetNameWithImage()}** is now a Eternal VIP`;

		}
		else {
			await sendPrivateMessage(userId, messages[target.Language].noVIP, Colors.Gold);
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
