import {
	ChatInputCommandInteraction,
	Colors,
	Locale,
	SlashCommandBuilder,
	SlashCommandIntegerOption,
} from "discord.js";
import { checkUser, replyInteraction } from "../../utils/logic";
import { defaultEmbed } from "../../utils/ui";
import { getLanguageText, Language } from "../../models/Language";
import { EmoteString } from "../../utils/emotes";

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

	async execute(interaction: ChatInputCommandInteraction) {
		const user = await checkUser(interaction.user.id, interaction);

		if (!user) {
			return;
		}

		const s = Strings[user.Language];

		const newLanguage = interaction.options.getInteger("language", true);

		if (!user.IsVip()) {
			return await replyInteraction(interaction, {
				embeds: [defaultEmbed({
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