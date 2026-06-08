import { CrColors } from "#bot/utils/colors";
import { replyWithContainer } from "#bot/utils/discordInteractions";
import { EmoteString } from "#bot/utils/emotes";
import { defaultComponent } from "#bot/utils/ui";
import { checkUser } from "#bot/utils/userUtils";
import { Language, type Localization } from "#core/models/Language";
import type { User } from "#core/models/User";
import { getRandomItemFromArray } from "#shared/utils";
import {
	type ChatInputCommandInteraction,
	Locale,
	PermissionFlagsBits,
	SlashCommandBuilder,
	time,
	TimestampStyles
} from "discord.js";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("kill")
		.setDescription("Kill a player (ban them temporarily)")
		.setDescriptionLocalization(Locale.PortugueseBR, "Mata um jogador (bane temporariamente)")
		.setDescriptionLocalization(Locale.SpanishES, "Mata a un jugador (bánelo temporalmente)")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption(option => option
			.setName("userid")
			.setDescription("The target user to kill")
			.setDescriptionLocalization(Locale.PortugueseBR, "O usuário alvo para matar")
			.setDescriptionLocalization(Locale.SpanishES, "El usuario objetivo para matar")
			.setRequired(true)
		)
		.addIntegerOption(option => option
			.setName("days")
			.setDescription("The duration of the ban in days")
			.setDescriptionLocalization(Locale.PortugueseBR, "A duração do banimento em dias")
			.setDescriptionLocalization(Locale.SpanishES, "La duración de la suspensión en días")
			.setRequired(true)
		),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const userId = interaction.options.getString("userid", true);
		const days = interaction.options.getInteger("days", true);

		const target = await checkUser(userId, interaction);

		if (!target) {
			return;
		}

		const s = Strings[language];

		const deadUntil = await target.Kill(days);

		const container = defaultComponent({
			user,
			color: CrColors.Cemetery,
			description: `${EmoteString.Cemetery} **${target.GetNameWithImage()}** ${s.howKill()} ${s.text(deadUntil)}`,
		});

		return replyWithContainer(interaction, container);
	},
};

const Strings = {
	[Language.English]: {
		howKill: () => getRandomItemFromArray([
			`was struck by lightning`,
			`was run over by an Impala`,
			`choked on a raisin`,
			`kicked the corner of a piece of furniture`,
			`was kicked by a horse`,
			`slipped on a banana peel`,
			`got a clothes iron to the head`,
			`had a heart attack`,
			`farted and shit his ass out`,
			`beheld the full power of Jacobi`
		]),
		text: (until: Date) => `and died. He will be revived ${time(until, TimestampStyles.RelativeTime)}`
	},
	[Language.Portuguese]: {
		howKill: () => getRandomItemFromArray([
			`foi atingido por um raio`,
			`foi atropelado por um Opala`,
			`se esgasgou com uma uva passa`,
			`chutou a quina de um móvel`,
			`levou um coice de um cavalo`,
			`resvalou numa casca de banana`,
			`levou um ferro de passar na cabeça`,
			`teve um infarto`,
			`foi peidar e cagou o cu pra fora`,
			`vislumbrou todo o poder do Jacobi`
		]),
		text: (until: Date) => `e morreu. Ele ressuscitará ${time(until, TimestampStyles.RelativeTime)}`
	},
	[Language.Spanish]: {
		howKill: () => getRandomItemFromArray([
			`fue alcanzado por un rayo`,
			`fue atropellado por un Opala`,
			`se atragantó con una pasa`,
			`pateó la esquina de un mueble`,
			`recibió una patada de un caballo`,
			`resbaló con una cáscara de plátano`,
			`recibió una plancha en la cabeza`,
			`tuvo un infarto`,
			`se tiró un pedo y se cagó todo`,
			`vislumbró todo el poder de Jacobi`
		]),
		text: (until: Date) => `y murió. Él resucitará ${time(until, TimestampStyles.RelativeTime)}`
	},
} as const satisfies Localization;
