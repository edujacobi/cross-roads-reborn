import {
	ChatInputCommandInteraction,
	Colors,
	Locale,
	SlashCommandBuilder,
	SlashCommandIntegerOption,
} from "discord.js";
import { replyInteraction } from "../../utils/logic";
import { defaultEmbed } from "../../utils/ui";
import { getLanguageText, Language } from "../../models/Language";
import { EmoteString } from "../../utils/emotes";
import { User } from "../../models/User";

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName("setlanguage")
		.setNameLocalization(Locale.PortugueseBR, "mudaidioma")
		.setDescription("Set a language to the game")
		.setDescriptionLocalization(Locale.PortugueseBR, "Muda o idioma do seu jogo")
		.addIntegerOption((option: SlashCommandIntegerOption) =>
			option
				.setName("language")
				.setDescription("The new language")
				.setNameLocalization(Locale.PortugueseBR, "idioma")
				.setDescriptionLocalization(Locale.PortugueseBR, "O novo idioma")
				.addChoices(
					{ name: getLanguageText(Language.English), value: Language.English },
					{ name: getLanguageText(Language.Portuguese), value: Language.Portuguese },
					{ name: getLanguageText(Language.Spanish), value: Language.Spanish },
				)
				.setRequired(true),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User) {
		const newLanguage = interaction.options.getInteger("language", true);

		const s = Strings[newLanguage as Language];

		if (!user.IsVip()) {
			return await replyInteraction(interaction, {
				embeds: [defaultEmbed({
					nickname: user.Nickname,
					interaction,
					color: Colors.Gold,
					description: s.needVIP,
				})],
				ephemeral: true,
			});
		}

		const oldLanguage = user.Language;
		user.Language = newLanguage;

		await user.Update();

		const embed = defaultEmbed({
			nickname: user.Nickname,
			interaction,
			description: s.changed(oldLanguage, newLanguage),
		});


		await replyInteraction(interaction, { embeds: [embed] });
	},
};

const Strings = {
	[Language.English]: {
		needVIP: `You need to be ${EmoteString.VIP} **VIP** to perform this action.`,
		changed: (oldLanguage: Language, newLanguage: Language) => `You changed your language from **${getLanguageText(oldLanguage)}** to **${getLanguageText(newLanguage)}**!`,
	},
	[Language.Portuguese]: {
		needVIP: `Você precisa ser ${EmoteString.VIP} **VIP** para realizar esta ação.`,
		changed: (oldLanguage: Language, newLanguage: Language) => `Você mudou seu idioma de **${getLanguageText(oldLanguage)}** para **${getLanguageText(newLanguage)}**!`,
	},
	[Language.Spanish]: {
		needVIP: `Necesitas ser ${EmoteString.VIP} **VIP** para realizar esta acción.`,
		changed: (oldLanguage: Language, newLanguage: Language) => `¡Cambiaste tu idioma de **${getLanguageText(oldLanguage)}** a **${getLanguageText(newLanguage)}**!`,
	},
} as const;