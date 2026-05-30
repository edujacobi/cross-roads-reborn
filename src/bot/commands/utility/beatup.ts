import { type ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { deferReply, replyWithContainer } from "#bot/utils/discordInteractions";
import { defaultComponent, showTime } from "#bot/utils/ui";
import { EmoteString } from "#bot/utils/emotes";
import { CrColors } from "#bot/utils/colors";
import type { User } from "#core/models/User";
import { Language, type Localization } from "#core/models/Language";
import { BeatUp } from "#core/models/BeatUp";
import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { searchUser } from "#bot/utils/userUtils";
import { runUserBeatUp } from "#bot/utils/beatupHelper";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("beatup")
		.setDescription("Beat a user and let it in Hospital")
		.setNameLocalization(Locale.PortugueseBR, "espancar")
		.setNameLocalization(Locale.SpanishES, "golpiza")
		.setDescriptionLocalization(Locale.PortugueseBR, "Espanque um usuário e deixe-o no Hospital")
		.setDescriptionLocalization(Locale.SpanishES, "Darle una paliza a un usuario y dejarlo en el Hospital")
		.addStringOption(target => target
			.setName("target")
			.setNameLocalization(Locale.PortugueseBR, "alvo")
			.setNameLocalization(Locale.SpanishES, "objetivo")
			.setDescription("The user to beat up")
			.setMinLength(3)
			.setDescriptionLocalization(Locale.PortugueseBR, "O usuário para espancar")
			.setDescriptionLocalization(Locale.SpanishES, "El usuario para golpear"),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const nameOrId = interaction.options.getString("target");

		await deferReply(interaction);

		const target = nameOrId ? await searchUser(nameOrId, interaction, language) : null;

		const s = Strings[language];

		let text = `${s.userFree}`;

		if (user.IsScavenging()) {
			text = s.userScavenging;
		}
		if (user.BeatUp.Time > new Date()) {
			text = s.userBeatWait(user.BeatUp.Time);
		}
		if (user.IsWorking()) {
			text = s.userWorking;
		}
		if (user.IsWanted()) {
			text = s.userEscaping(user.Wanted.Time);
		}
		if (user.IsInPrison()) {
			text = s.userPrison(user.Prison.Time);
		}
		if (user.IsInHospital()) {
			text = s.userHospital(user.Hospital.Time);
		}
		if (user.IsInCasinoGame()) {
			text = s.userCasino;
		}

		if (!nameOrId) {
			const container = new CustomContainerBuilder()
				.setUser(user)
				.setAccentColor(CrColors.BeatUp)
				.addSectionComponents(section => section
					.addTexts([
						s.description,
					])
					.setThumbnailAccessory(thumb => thumb
						.setURL("https://cdn.discordapp.com/attachments/691019843159326757/820064474995621938/Espancar_20210312194139.png"),
					),
				)
				.addLargeSeparator()
				.addTexts([
					`-# ${text}`,
				])
				.addFooter({
					text: user.Situation.Simple,
				});

			return replyWithContainer(interaction, container);
		}

		if (!target) {
			return;
		}

		const robbery = new BeatUp(user, target);

		const { canBeat, message } = await robbery.CanBeatUser();

		if (!canBeat) {
			const container = defaultComponent({
				user,
				color: CrColors.BeatUp,
				description: message,
			});

			return replyWithContainer(interaction, container);
		}

		await runUserBeatUp(interaction, robbery, user, target);
	},
};

const Strings = {
	[Language.English]: {
		userFree: "You can beat up!",
		userBeatWait: (beatTime: Date) => `You will be able to beat up again ${showTime(beatTime.getTime(), true)}`,
		userScavenging: `You can't beat up while scavenging! ${EmoteString.Scavenge}`,
		userWorking: `You can't beat up while working! ${EmoteString.Jobs}`,
		userEscaping: (timerEscape: Date) => `You can't beat up while being wanted by the police! You can beat up again ${showTime(timerEscape.getTime(), true)} ${EmoteString.Police}`,
		userPrison: (timerPrison: Date) => `You can't beat up while in prison! You will be released ${showTime(timerPrison.getTime(), true)} ${EmoteString.Prison}`,
		userHospital: (timerHospital: Date) => `You can't beat up while in hospital! You will be healed ${showTime(timerHospital.getTime(), true)} ${EmoteString.Hospital}`,
		userCasino: `You can't beat up while playing in casino! ${EmoteString.Casino}`,
		description: `# Beat Up
### Defeat your nemesis and show who's boss!
The loser of the fight will be hospitalized for a time determined by the defender player's ${EmoteString.Attack}ATK.
To beat up, the target must be ${EmoteString.Idle} **Idling**.
-# If you are ${EmoteString.Prison} Imprisoned, you can also beat up other prisoners.`,
		success: "Success",
	},
	[Language.Portuguese]: {
		userFree: "Você pode espancar!",
		userBeatWait: (beatTime: Date) => `Você poderá espancar novamente ${showTime(beatTime.getTime(), true)}`,
		userScavenging: `Você não pode espancar enquanto vasculha! ${EmoteString.Scavenge}`,
		userWorking: `Você não pode espancar enquanto trabalha! ${EmoteString.Jobs}`,
		userEscaping: (timerEscape: Date) => `Você não pode espancar enquanto estiver sendo procurado pela polícia! Poderá espancar novamente ${showTime(timerEscape.getTime(), true)} ${EmoteString.Police}`,
		userPrison: (timerPrison: Date) => `Você não pode espancar enquanto está preso! Será solto ${showTime(timerPrison.getTime(), true)} ${EmoteString.Prison}`,
		userHospital: (timerHospital: Date) => `Você não pode espancar enquanto está hospitalizado! Será curado ${showTime(timerHospital.getTime(), true)} ${EmoteString.Hospital}`,
		userCasino: `Você não pode espancar enquanto está jogando no cassino! ${EmoteString.Casino}`,
		description: `# Espancar
### Derrote seu nêmesis e mostre quem é que manda!
Quem perder a luta, ficará hospitalizado por um tempo determinado pela ${EmoteString.Attack}ATK do jogador defensor.
Para conseguir espancar, o alvo deve estar ${EmoteString.Idle} **Vadiando**.
-# Caso você estiver ${EmoteString.Prison} Preso, você também pode espancar outros presos.`,
		success: "Sucesso",
	},
	[Language.Spanish]: {
		userFree: "¡Puedes golpear!",
		userBeatWait: (beatTime: Date) => `Podrás volver a golpear ${showTime(beatTime.getTime(), true)}`,
		userScavenging: `¡No puedes golpear mientras buscas! ${EmoteString.Scavenge}`,
		userWorking: `¡No puedes golpear mientras trabajas! ${EmoteString.Jobs}`,
		userEscaping: (timerEscape: Date) => `¡No puedes golpear mientras eres perseguido por la policía! ¡Puedes golpear de nuevo ${showTime(timerEscape.getTime(), true)} ${EmoteString.Police}`,
		userPrison: (timerPrison: Date) => `¡No puedes golpear mientras estás en prisión! ¡Serás liberado ${showTime(timerPrison.getTime(), true)} ${EmoteString.Prison}`,
		userHospital: (timerHospital: Date) => `¡No puedes golpear mientras estás en el hospital! ¡Serás curado ${showTime(timerHospital.getTime(), true)} ${EmoteString.Hospital}`,
		userCasino: `¡No puedes golpear mientras estás jugando en el casino! ${EmoteString.Casino}`,
		description: `# Golpear
### ¡Derrota a tu némesis y demuestra quién manda!
El perdedor de la pelea será hospitalizado por un tiempo determinado por la ${EmoteString.Attack}ATK del jugador defensor.
Para golpear, el objetivo debe estar ${EmoteString.Idle} **Vagando**.
-# Si estás ${EmoteString.Prison} Encarcelado, también puedes golpear a otros prisioneros.`,
		success: "Éxito",
	},
} as const satisfies Localization;