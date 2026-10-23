import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { disableButtons } from "#bot/utils/collectors";
import { CrColors } from "#bot/utils/colors";
import { deferUpdate, replyWithContainer } from "#bot/utils/discordInteractions";
import { EmoteString } from "#bot/utils/emotes";
import { defaultComponent, formatMoney } from "#bot/utils/ui";
import { checkUser } from "#bot/utils/userUtils";
import { MultiplayerSession, type MultiplayerSessionView } from "#core/models/MultiplayerSession";
import { Language, type Localization } from "#core/models/Language";
import type { User } from "#core/models/User";
import { ClassId, ClassList } from "#core/types/Classes";
import {
	type ButtonInteraction,
	ButtonStyle,
	type ChatInputCommandInteraction,
	type CommandInteraction,
	ComponentType,
	Locale,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import { Log } from "#shared/log";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("russianroulette")
		.setNameLocalization(Locale.PortugueseBR, "roletarussa")
		.setNameLocalization(Locale.SpanishES, "ruletarusa")
		.setDescription("Game of Russian Roulette")
		.setDescriptionLocalization(Locale.PortugueseBR, "Jogo de Roleta Russa")
		.setDescriptionLocalization(Locale.SpanishES, "Juego de Ruleta Rusa")
		.addNumberOption(option => option
			.setName("bet")
			.setNameLocalization(Locale.PortugueseBR, "aposta")
			.setNameLocalization(Locale.SpanishES, "apuesta")
			.setDescription("The bet")
			.setDescriptionLocalization(Locale.PortugueseBR, "A aposta")
			.setDescriptionLocalization(Locale.SpanishES, "La apuesta")
			.setMinValue(5_000)
			.setRequired(true),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const betValue = interaction.options.getNumber("bet", true);
		const s = Strings[language];
		const maxParticipants = 5;
		const prize = (betValue * maxParticipants) / (ClassList[ClassId.Attorney].Modifier?.Casino?.Positive || 1);
		const currentSessions = () => MultiplayerSession.GetVisibleSessions(user.Id, user.GangId)
			.filter(session =>
				session.kind === "russianRoulette" &&
				session.phase === "lobby" &&
				!session.participants.some(participant => participant.userId === user.Id),
			);

		function getHeader() {
			return new CustomContainerBuilder()
				.setUser(user)
				.setAccentColor(CrColors.Casino)
				.addSectionComponents(header => header
					.addTexts([`# ${s.headerTitle}`, s.headerDescription(EmoteString.Hospital)])
					.setThumbnailAccessory(thumb => thumb.setURL("https://media.discordapp.net/attachments/1233604589064818808/1464272049483681924/RussianRoulette.png")),
				)
				.addLargeSeparator();
		}

		function getInitialContainer() {
			const openLobbies = currentSessions();
			const initial = getHeader()
				.addTexts([s.betDefined(formatMoney(betValue, language))])
				.addButtonRow(btn => btn
					.setLabel(s.startButton)
					.setCustomId("start")
					.setStyle(ButtonStyle.Primary),
				);

			if (openLobbies.length > 0) {
				initial.addLargeSeparator().addTexts([s.openLobbies]);
				for (const lobby of openLobbies.slice(0, 5)) {
					initial.addButtonRow(btn => btn
						.setLabel(`${s.participateButton} • ${formatMoney(lobby.bet ?? betValue, language)}`)
						.setCustomId(`join_${lobby.id}`)
						.setStyle(ButtonStyle.Secondary),
					);
				}
			}

			return initial.addFooter({ text: formatMoney(user.Money, language) });
		}

		function getSessionContainer(session: MultiplayerSessionView) {
			if (session.phase === "lobby") {
				const isParticipant = session.participants.some(participant => participant.userId === user.Id);
				return getHeader()
					.addSectionComponents(section => {
						section.addTexts([
							s.betPrize(formatMoney(session.bet ?? betValue, language), formatMoney(prize, language)),
							s.participants(session.participants.length, session.maxParticipants),
							session.participants.map(participant => `- ${participant.nickname}`).join("\n"),
							...(isParticipant ? [] : [s.joinInstruction]),
						]);
						if (!isParticipant) {
							section.setButtonAccessory(btn => btn
								.setLabel(s.participateButton)
								.setCustomId("participate")
								.setStyle(ButtonStyle.Secondary),
							);
						}
						return section;
					})
					.addFooter({ text: formatMoney(user.Money, language) });
			}

			const getName = (id: string | null) => session.participants.find(participant => participant.userId === id)?.nickname ?? "";
			const history = session.events.slice(-15).map(event => {
				const nickname = getName(event.userId);
				if (event.type === "started") return s.historyStart(user.Nickname, nickname);
				if (event.type === "turn") {
					return event.outcome === "eliminated"
						? s.hitMessages[0](nickname, EmoteString.Hospital)
						: s.missMessages[0](nickname);
				}
				if (event.type === "finished") {
					const result = session.result
						? MultiplayerSession.DecodeResult<{ prize?: number }>(session.result)
						: null;
					return `${s.winnerMessage(nickname)} ${formatMoney(result?.prize ?? 0, language)}!`;
				}
				return "";
			});
			const status = session.participants.map(participant =>
				`-# ${session.events.at(-1)?.userId === participant.userId ? EmoteString.React : ""} ${participant.nickname} ${session.aliveUserIds.includes(participant.userId) ? EmoteString.Victory : EmoteString.Hospital}`,
			);
			const container = getHeader()
				.addTexts(history)
				.addLargeSeparator()
				.addTexts(status)
				.addFooter({
					text: `${formatMoney(user.Money, language)} • ${s.betPrize(formatMoney(session.bet ?? betValue, language), formatMoney(prize, language))}`,
				});

			if (session.phase === "aborted") container.changeFooterText(s.timeout);
			return container;
		}

		function warn(target: CommandInteraction | ButtonInteraction, message: string) {
			return replyWithContainer(target, defaultComponent({ description: message, color: CrColors.Casino }), true);
		}

		let activeSessionId: string | null = null;
		let container = getInitialContainer();
		const response = await replyWithContainer(interaction, container);
		const collector = response?.createMessageComponentCollector({
			componentType: ComponentType.Button,
			idle: 60_000,
		});

		const updateSession = async (session: MultiplayerSessionView) => {
			if (session.id !== activeSessionId) return;
			container = getSessionContainer(session);
			await replyWithContainer(interaction, container);
		};
		let updateQueue = Promise.resolve();
		const queueUpdate = (session: MultiplayerSessionView): Promise<void> => {
			updateQueue = updateQueue.then(() => updateSession(session)).catch(error => {
				Log.Error(`Failed to update Russian Roulette session ${session.id}: ${error}`);
			});
			return updateQueue;
		};
		const unsubscribe = MultiplayerSession.Subscribe(user.Id, user.GangId, session => {
			if (session.id === activeSessionId) {
				void queueUpdate(session);
			}
			else if (!activeSessionId && session.kind === "russianRoulette") {
				container = getInitialContainer();
				void replyWithContainer(interaction, container).catch(error => Log.Error(`Failed to update Russian Roulette lobby list: ${error}`));
			}
		});

		const watchSession = (sessionId: string) => {
			activeSessionId = sessionId;
			const current = MultiplayerSession.GetVisibleSession(sessionId, user.Id, user.GangId);
			if (current) void queueUpdate(current);
			void MultiplayerSession.WaitForCompletion(sessionId)
				.then(queueUpdate)
				.catch(error => Log.Error(`Failed waiting for Russian Roulette session ${sessionId}: ${error}`))
				.finally(unsubscribe);
		};

		collector?.on("end", () => {
			if (!activeSessionId) {
				container.changeFooterText(s.timeout);
				void disableButtons(interaction, container);
				unsubscribe();
			}
		});

		collector?.on("collect", async btn => {
			if (btn.customId === "start") {
				if (btn.user.id !== user.Id) return warn(btn, s.onlyHostCanStart);
				await deferUpdate(btn);
				await user.GetInfo();
				const result = await MultiplayerSession.StartRussianRoulette(user, betValue, "discord");
				if (!result.success) return warn(btn, result.message);
				watchSession(result.session.id);
				return;
			}

			const sessionId = btn.customId === "participate"
				? activeSessionId
				: btn.customId.startsWith("join_")
					? btn.customId.slice(5)
					: null;
			if (!sessionId) return;

			await deferUpdate(btn);
			const joiningUser = await checkUser(btn.user.id, interaction);
			if (!joiningUser) return;
			const result = await MultiplayerSession.JoinRussianRoulette(sessionId, joiningUser, joiningUser.Language);
			if (!result.success) {
				await btn.followUp({ content: result.message || s.alreadyParticipating, flags: MessageFlags.Ephemeral });
				return;
			}
			watchSession(sessionId);
		});
	},
};

const Strings = {
	[Language.English]: {
		headerTitle: "Russian Roulette",
		headerDescription: (emote: string) => `Participate in an aggressive bet, where only one will be the winner, and all others will be ${emote} Hospitalized!`,
		gameTitle: (nick: string) => `### ${nick}'s Game`,
		betPrize: (bet: string, prize: string) => `Bet: ${bet} • Prize: ${prize}`,
		participants: (current: number, max: number) => `-# Participants ${current}/${max}`,
		openLobbies: "Open lobbies",
		joinInstruction: "-# Click **Participate** to join. The game will start automatically.",
		participateButton: "Participate",
		betDefined: (bet: string) => `You defined the bet as ${bet}`,
		startButton: "Start",
		onlyHostCanStart: `Only the host can start the game ${EmoteString.Casino}`,
		fullGame: (current: number, max: number) => `This Russian Roulette is already full (${current}/${max} participants) ${EmoteString.Casino}`,
		alreadyParticipating: `You are already participating in this Russian Roulette! ${EmoteString.Casino}`,
		unavailableUsers: (users: string) => `The following users are no longer available to bet: ${users} ${EmoteString.Casino}`,
		historyStart: (name: string, first: string) => `**${name}** prepares the revolver and puts a bullet in... **${first}** will first.`,
		hitMessages: [
			(name: string, emote: string) => `**${name}** was unlucky and was ${emote} Hospitalized!`,
			(name: string, emote: string) => `**${name}** pulled the trigger and... BANG! ${emote}`,
			(name: string, emote: string) => `**${name}**'s luck ran out today. ${emote}`,
			(name: string, emote: string) => `A loud shot rings out! **${name}** falls to the ground. ${emote}`,
			(name: string, emote: string) => `**${name}** stares into the barrel... and sees the flash. ${emote}`,
			(name: string, emote: string) => `Click... BOOM! **${name}** is down! ${emote}`,
			(name: string, emote: string) => `**${name}** took the gamble and paid the price. ${emote}`,
			(name: string, emote: string) => `The chamber wasn't empty for **${name}**. ${emote}`,
			(name: string, emote: string) => `**${name}** meets their fate with a loud bang. ${emote}`,
			(name: string, emote: string) => `Goodbye, **${name}**. See you at the hospital. ${emote}`,
		],
		missMessages: [
			(name: string) => `**${name}** got away and continues in the game...`,
			(name: string) => `Click! **${name}** breathes a sigh of relief.`,
			(name: string) => `**${name}** sweats nervously as the hammer falls on an empty chamber.`,
			(name: string) => `Silence. **${name}** is safe... for now.`,
			(name: string) => `**${name}** smiles nervously. It was empty.`,
			(name: string) => `**${name}** passes the gun, hands shaking. Safe.`,
			(name: string) => `The gods of luck smile upon **${name}**.`,
			(name: string) => `**${name}** closes their eyes... and hears a click.`,
			(name: string) => `Not today! **${name}** survives the round.`,
			(name: string) => `**${name}** lives to spin another day.`,
		],
		winnerMessage: (name: string) => `**${name}** is the big winner and took the prize of`,
		timeout: "Time expired",
		thiefModifier: (emote: string, name: string) => `-# Prize reduced because of the ${emote} **${name}** class modifier!`,
		attorneyModifier: (emote: string, name: string) => `-# Prize increased because of the ${emote} **${name}** class modifier!`,
	},
	[Language.Portuguese]: {
		headerTitle: "Roleta Russa",
		headerDescription: (emote: string) => `Participe de uma aposta agressiva, onde somente um sairá vencedor, e todos os outros ficarão ${emote} Hospitalizados!`,
		gameTitle: (nick: string) => `### Jogo de ${nick}`,
		betPrize: (bet: string, prize: string) => `Aposta: ${bet} • Prêmio: ${prize}`,
		participants: (current: number, max: number) => `-# Participantes ${current}/${max}`,
		openLobbies: "Salas abertas",
		joinInstruction: "-# Clique em **Participar** para entrar. O jogo comecará automaticamente.",
		participateButton: "Participar",
		betDefined: (bet: string) => `Você definiu a aposta como ${bet}`,
		startButton: "Iniciar",
		onlyHostCanStart: `Apenas o anfitrião pode iniciar o jogo ${EmoteString.Casino}`,
		fullGame: (current: number, max: number) => `Esta Roleta russa já está cheia (${current}/${max} participantes) ${EmoteString.Casino}`,
		alreadyParticipating: `Você já está participando desta Roleta Russa! ${EmoteString.Casino}`,
		unavailableUsers: (users: string) => `Os seguintes usuários não estão mais disponíveis para apostar: ${users} ${EmoteString.Casino}`,
		historyStart: (name: string, first: string) => `**${name}** prepara o revólver e coloca uma munição... **${first}** irá primeiro.`,
		hitMessages: [
			(name: string, emote: string) => `**${name}** não teve sorte e foi ${emote} Hospitalizado!`,
			(name: string, emote: string) => `**${name}** puxou o gatilho e... BANG! ${emote}`,
			(name: string, emote: string) => `A sorte de **${name}** acabou hoje. ${emote}`,
			(name: string, emote: string) => `Um tiro alto ecoa! **${name}** cai no chão. ${emote}`,
			(name: string, emote: string) => `**${name}** encara o cano... e vê o clarão. ${emote}`,
			(name: string, emote: string) => `Clique... BOOM! **${name}** caiu! ${emote}`,
			(name: string, emote: string) => `**${name}** arriscou e pagou o preço. ${emote}`,
			(name: string, emote: string) => `A câmara não estava vazia para **${name}**. ${emote}`,
			(name: string, emote: string) => `**${name}** encontra seu destino com um estrondo. ${emote}`,
			(name: string, emote: string) => `Adeus, **${name}**. Nos vemos no hospital. ${emote}`,
		],
		missMessages: [
			(name: string) => `**${name}** se safou e continua no jogo.`,
			(name: string) => `Clique! **${name}** suspira de alívio.`,
			(name: string) => `**${name}** transpira nervosamente enquanto o cão bate em uma câmara vazia.`,
			(name: string) => `Silêncio. **${name}** está salvo... por enquanto.`,
			(name: string) => `**${name}** sorri nervosamente. Estava vazio.`,
			(name: string) => `**${name}** passa a arma, com as mãos tremendo. Salvo.`,
			(name: string) => `Os deuses da sorte sorriem para **${name}**.`,
			(name: string) => `**${name}** fecha os olhos... e ouve um clique.`,
			(name: string) => `Hoje não! **${name}** sobrevive à rodada.`,
			(name: string) => `**${name}** vive para girar mais um dia.`,
		],
		winnerMessage: (name: string) => `**${name}** é o grande vencedor e levou o prêmio de`,
		timeout: "Tempo esgotado",
		thiefModifier: (emote: string, name: string) => `-# Prêmio reduzido devido ao modificador da classe ${emote} **${name}**!`,
		attorneyModifier: (emote: string, name: string) => `-# Prêmio aumentado devido ao modificador da classe ${emote} **${name}**!`,
	},
	[Language.Spanish]: {
		headerTitle: "Ruleta Rusa",
		headerDescription: (emote: string) => `¡Participa en una apuesta agresiva, donde solo uno saldrá ganador, y todos los demás quedarán ${emote} Hospitalizados!`,
		gameTitle: (nick: string) => `### Juego de ${nick}`,
		betPrize: (bet: string, prize: string) => `Apuesta: ${bet} • Premio: ${prize}`,
		participants: (current: number, max: number) => `-# Participantes ${current}/${max}`,
		openLobbies: "Salas abiertas",
		joinInstruction: "-# Haz clic en **Participar** para entrar. El juego comenzará automáticamente.",
		participateButton: "Participar",
		betDefined: (bet: string) => `Definiste la apuesta como ${bet}`,
		startButton: "Iniciar",
		onlyHostCanStart: `Solo el anfitrión puede iniciar el juego ${EmoteString.Casino}`,
		fullGame: (current: number, max: number) => `Esta Ruleta Rusa ya está llena (${current}/${max} participantes) ${EmoteString.Casino}`,
		alreadyParticipating: `¡Ya estás participando en esta Ruleta Rusa! ${EmoteString.Casino}`,
		unavailableUsers: (users: string) => `Los siguientes usuarios ya no están disponibles para apostar: ${users} ${EmoteString.Casino}`,
		historyStart: (name: string, first: string) => `**${name}** prepara el revolver y pone una bala... **${first}** irá primero`,
		hitMessages: [
			(name: string, emote: string) => `**${name}** no tuvo suerte y fue ${emote} Hospitalizado!`,
			(name: string, emote: string) => `**${name}** apretó el gatillo y... ¡BANG! ${emote}`,
			(name: string, emote: string) => `La suerte de **${name}** se acabó hoy. ${emote}`,
			(name: string, emote: string) => `¡Suena un fuerte disparo! **${name}** cae al suelo. ${emote}`,
			(name: string, emote: string) => `**${name}** mira el cañón... y ve el destello. ${emote}`,
			(name: string, emote: string) => `Clic... ¡BOOM! ¡**${name}** ha caído! ${emote}`,
			(name: string, emote: string) => `**${name}** se arriesgó y pagó el precio. ${emote}`,
			(name: string, emote: string) => `La recámara no estaba vacía para **${name}**. ${emote}`,
			(name: string, emote: string) => `**${name}** encuentra su destino con un estruendo. ${emote}`,
			(name: string, emote: string) => `Adiós, **${name}**. Nos vemos en el hospital. ${emote}`,
		],
		missMessages: [
			(name: string) => `**${name}** se salvó y continúa en el juego.`,
			(name: string) => `¡Clic! **${name}** suspira de alivio.`,
			(name: string) => `**${name}** suda nerviosamente mientras el percutor golpea una recámara vacía.`,
			(name: string) => `Silencio. **${name}** está a salvo... por ahora.`,
			(name: string) => `**${name}** sonríe nerviosamente. Estaba vacío.`,
			(name: string) => `**${name}** pasa el arma, con las manos temblando. A salvo.`,
			(name: string) => `Los dioses de la suerte sonríen a **${name}**.`,
			(name: string) => `**${name}** cierra los ojos... y escucha un clic.`,
			(name: string) => `¡Hoy no! **${name}** sobrevive a la ronda.`,
			(name: string) => `**${name}** vive para girar un día más.`,
		],
		winnerMessage: (name: string) => `**${name}** es el gran ganador y se llevó el premio de`,
		timeout: "Tiempo agotado",
		thiefModifier: (emote: string, name: string) => `-# ¡Premio reducido debido al modificador de la clase ${emote} **${name}**!`,
		attorneyModifier: (emote: string, name: string) => `-# ¡Premio aumentado debido al modificador de la clase ${emote} **${name}**!`,
	},
} as const satisfies Localization;
