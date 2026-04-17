import { type ChatInputCommandInteraction, Locale, SlashCommandBuilder, type SlashCommandUserOption } from "discord.js";
import { replyInteraction } from "#bot/utils/discordInteractions";
import type { User } from "#core/models/User";
import { Language, type Localization } from "#core/models/Language";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("avatar")
		.setNameLocalization(Locale.SpanishES, "avatar")
		.setDescription("View user avatar")
		.setDescriptionLocalization(Locale.PortugueseBR, "Veja o avatar do usuário")
		.setDescriptionLocalization(Locale.SpanishES, "Ver el avatar del usuario")
		.addUserOption((option) =>
			option
				.setName("target")
				.setNameLocalization(Locale.PortugueseBR, "alvo")
				.setNameLocalization(Locale.SpanishES, "objetivo")
				.setDescription("The user")
				.setDescriptionLocalization(Locale.PortugueseBR, "O usuário")
				.setDescriptionLocalization(Locale.SpanishES, "El usuario")),

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
} as const satisfies Localization;