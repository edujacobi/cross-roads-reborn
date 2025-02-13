import { ChatInputCommandInteraction, Locale, SlashCommandBuilder, SlashCommandUserOption } from "discord.js";
import { replyInteraction } from "../../utils/logic";
import { User } from "../../models/User";
import { Language } from "../../models/Language";

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName("avatar")
		.setDescription("Get the avatar URL of the selected user, or your own avatar.")
		.setDescriptionLocalization(Locale.PortugueseBR, "Obtenha o URL do avatar do usuário selecionado, ou o seu próprio avatar.")
		.addUserOption((option: SlashCommandUserOption) =>
			option
				.setName("target")
				.setDescription("The user's avatar to show")),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const target = interaction.options.getUser("target");

		const s = Strings[language];

		if (target) {
			return replyInteraction(interaction, `${s.targetAvatar(target.displayName)}: ${target.displayAvatarURL({
				forceStatic: false,
				size: 4096,
			})}`);
		}
		return replyInteraction(interaction, `${s.yourAvatar}: ${interaction.user.displayAvatarURL({
			forceStatic: false,
			size: 4096,
		})}`);
	},
};

const Strings = {
	[Language.English]: {
		targetAvatar: (name: string) => `${name}'s avatar`,
		yourAvatar: "Your avatar",
	},
	[Language.Portuguese]: {
		targetAvatar: (name: string) => `Avatar de ${name}`,
		yourAvatar: "Seu avatar",
	},
	[Language.Spanish]: {
		targetAvatar: (name: string) => `Avatar de ${name}`,
		yourAvatar: "Tu avatar",
	},
} as const;