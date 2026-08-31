import { CrColors } from "#bot/utils/colors";
import { replyWithContainer } from "#bot/utils/discordInteractions";
import { defaultComponent } from "#bot/utils/ui";
import type { User } from "#core/models/User";
import { Vault } from "#core/models/Vault";
import { Language, type Localization } from "#core/models/Language";
import {
	type ChatInputCommandInteraction,
	Locale,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("allowmainheist")
		.setDescription("Enable or disable the main heist")
		.setDescriptionLocalization(Locale.PortugueseBR, "Permitir ou proibir o golpe principal")
		.setDescriptionLocalization(Locale.SpanishES, "Permitir o prohibir el golpe principal")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addBooleanOption(option => option
			.setName("allowed")
			.setNameLocalization(Locale.PortugueseBR, "permitido")
			.setNameLocalization(Locale.SpanishES, "permitido")
			.setDescription("Whether the main heist is enabled (Mon, Wed, Fri)")
			.setDescriptionLocalization(Locale.PortugueseBR, "Se o golpe principal está permitido (Seg, Qua, Sex)")
			.setDescriptionLocalization(Locale.SpanishES, "Si el golpe principal está permitido (Lun, Mié, Vie)")
			.setRequired(true),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const allowed = interaction.options.getBoolean("allowed", true);
		const s = Strings[language];

		await Vault.SetMainHeistAllowed(allowed);

		const container = defaultComponent({
			user,
			color: CrColors.Admin,
			description: s.success(allowed),
		});

		return replyWithContainer(interaction, container);
	},
};

const Strings = {
	[Language.English]: {
		success: (allowed: boolean) => `Main heist execution is now **${allowed ? "ENABLED (Mon, Wed, Fri)" : "DISABLED"}**.`,
	},
	[Language.Portuguese]: {
		success: (allowed: boolean) => `A execução do golpe principal agora está **${allowed ? "ATIVADA (Seg, Qua, Sex)" : "DESATIVADA"}**.`,
	},
	[Language.Spanish]: {
		success: (allowed: boolean) => `La ejecución del golpe principal ahora está **${allowed ? "ACTIVADA (Lun, Mié, Vie)" : "DESACTIVADA"}**.`,
	},
} as const satisfies Localization;
