import {
	ButtonInteraction,
	ButtonStyle,
	ChatInputCommandInteraction,
	CommandInteraction,
	ComponentType,
	Locale,
	SlashCommandBuilder,
} from "discord.js";
import { checkUser, disableButtons, replyWithContainer } from "../../utils/logic";
import { User } from "../../models/User";
import { Language } from "../../models/Language";
import { Casino } from "../../models/Casino";
import { defaultComponent, formatMoney } from "../../utils/ui";
import { CrColors } from "../../utils/colors";
import { CustomContainerBuilder } from "../../ui/builders/CustomContainerBuilder";
import { EmoteString } from "../../utils/emotes";
import { addHours } from "date-fns/addHours";
import { setTimeout as wait } from "node:timers/promises";
import { ClassId, ClassList } from "../../interfaces/Classes";

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

		const participants: User[] = [];
		const MAX_PARTICIPANTS = 5;
		const prize = (betValue * MAX_PARTICIPANTS) / (ClassList[ClassId.Attorney].Modifier?.Casino?.Positive || 1);
		const attorneyPrize = betValue * MAX_PARTICIPANTS;
		const thiefPrize = prize * (ClassList[ClassId.Thief].Modifier?.Casino?.Negative || 1);

		function getHeader() {
			return new CustomContainerBuilder()
				.setUser(user)
				.setAccentColor(CrColors.Casino)
				.addSectionComponents(header => header
					.addTexts([
						`# ${s.headerTitle}`,
						s.headerDescription(EmoteString.Hospital),
					])
					.setThumbnailAccessory(thumb => thumb
						.setURL("https://media.discordapp.net/attachments/1233604589064818808/1464272049483681924/RussianRoulette.png"),
					),
				)
				.addLargeSeparator();
		}

		async function updateLobby() {
			container = getHeader()
				.addSectionComponents(section => section
					.addTexts([
						// s.gameTitle(user.Nickname),
						s.betPrize(formatMoney(betValue, language), formatMoney(prize, language)),
						s.participants(participants.length, MAX_PARTICIPANTS),
						participants.map(p => `- ${p.GetNameWithImage()}`).join("\n"),

						s.joinInstruction,
					])
					.setButtonAccessory(btn => btn
						.setLabel(s.participateButton)
						.setCustomId("participate")
						.setStyle(ButtonStyle.Secondary),
					),
				)
				.addFooter({
					text: formatMoney(user.Money, language),
				});

			await replyWithContainer(interaction, container);
		}

		function warn(interaction: CommandInteraction | ButtonInteraction, message: string) {
			const container = defaultComponent({
				description: message,
				color: CrColors.Casino,
			});

			return replyWithContainer(interaction, container, true);
		}

		async function checkEligibility(targetUser: User, interaction: ButtonInteraction) {
			const { canPlay, message } = await Casino.CanUserPlayGame(targetUser, betValue);

			if (!canPlay) {
				await warn(interaction, message);
			}
			return canPlay;
		}

		let container = getHeader()
			.addTexts([
				s.betDefined(formatMoney(betValue, language)),
			])
			.addButtonRow(btn => btn
				.setLabel(s.startButton)
				.setCustomId("start")
				.setStyle(ButtonStyle.Primary),
			)
			.addFooter();

		const response = await replyWithContainer(interaction, container);

		const collector = response?.createMessageComponentCollector({
			componentType: ComponentType.Button,
			idle: 60_000,
		});

		let battleStarted = false;

		collector?.on("end", () => {
			if (!battleStarted) {
				container.changeFooterText(s.timeout);
				disableButtons(interaction, container);
			}
		});

		collector?.on("collect", async btn => {
			if (battleStarted) return;

			if (btn.customId === "start") {
				if (btn.user.id !== interaction.user.id) {
					return warn(btn, s.onlyHostCanStart);
				}

				await btn.deferUpdate();
				await user.GetInfo();

				const { canPlay, message } = await Casino.CanUserPlayGame(user, betValue);

				if (!canPlay) {
					return warn(btn, message);
				}

				participants.push(user);
				// DEBUG WITH 5 PLAYERS
				// participants.push(await new User("761236646116982844").GetInfo() as User);
				// participants.push(await new User("843955033543540756").GetInfo() as User);
				// participants.push(await new User("666077411615572031").GetInfo() as User);
				// participants.push(await new User("145466251496390656").GetInfo() as User);
				await updateLobby();
			}

			else if (btn.customId === "participate") {
				if (participants.some(p => p.Id === btn.user.id)) {
					return warn(btn, s.alreadyParticipating);
				}

				if (participants.length >= MAX_PARTICIPANTS) {
					return warn(btn, s.fullGame(participants.length, MAX_PARTICIPANTS));
				}

				await btn.deferUpdate();

				const joiningUser = await checkUser(btn.user.id, interaction);
				if (!joiningUser) {
					return;
				}

				const eligible = await checkEligibility(joiningUser, btn);
				if (!eligible) return;

				if (battleStarted || participants.length >= MAX_PARTICIPANTS) {
					return warn(btn, s.fullGame(participants.length, MAX_PARTICIPANTS));
				}

				participants.push(joiningUser);
				await updateLobby();

				if (participants.length === MAX_PARTICIPANTS) {
					battleStarted = true;
					collector?.stop();
					await runGame();
				}
			}
		});

		async function runGame() {
			const unavailableUsers = [];
			for (const participant of participants) {
				await participant.GetInfo();
				const { canPlay } = await Casino.CanUserPlayGame(participant, betValue);
				if (!canPlay) {
					unavailableUsers.push(participant.GetNameWithImage());
				}
			}

			if (unavailableUsers.length > 0) {
				const unavailableMessage = s.unavailableUsers(unavailableUsers.join(", "));
				return warn(interaction, unavailableMessage);
			}

			await Promise.all(participants.map(player => Casino.StartUserGame(player)));

			participants.sort(() => Math.random() - 0.5);
			const participantsStatus = participants.map(p => ({ user: p, alive: true }));
			const losers: User[] = [];
			const history: string[] = [];

			function showStatus(currentPlayerId: string) {
				const emote = (id: string) => currentPlayerId === id ? EmoteString.React : "";
				return getHeader()
					.addTexts(history.slice(-15))
					.addLargeSeparator()
					.addTexts(participantsStatus.map(p => `-# ${emote(p.user.Id)} ${p.user.GetNameWithImage()} ${p.alive ? EmoteString.Victory : EmoteString.Hospital}`))
					.addFooter({
						text: s.betPrize(formatMoney(betValue, participants[0].Language), formatMoney(prize, participants[0].Language)),
					});
			}

			const host = user;
			history.push(s.historyStart(host.GetNameWithImage(), participants[0].GetNameWithImage()));

			container = showStatus(participants[0].Id);
			await replyWithContainer(interaction, container);

			let winner: User | null = null;
			await wait(5000);

			while (winner == null) {
				for (const player of participantsStatus) {
					if (!player.alive) continue;

					const aliveParticipants = participantsStatus.filter(p => p.alive);
					if (aliveParticipants.length === 1) {
						winner = player.user;
						break;
					}

					const hit = Math.random() < 0.2; // 1 muniçao / 5 espaços
					if (hit) {
						const hospitalTime = Math.random() * 0.5 + 1.5; // 1.5 a 2.0
						player.user.Hospital.Time = addHours(new Date(), hospitalTime);
						player.user.Hospital.Count += 1;

						losers.push(player.user);

						player.alive = false;

						const msgFunc = s.hitMessages[Math.floor(Math.random() * s.hitMessages.length)];
						history.push(msgFunc(player.user.GetNameWithImage(), EmoteString.Hospital));
					}
					else {
						const msgFunc = s.missMessages[Math.floor(Math.random() * s.missMessages.length)];
						history.push(msgFunc(player.user.GetNameWithImage()));
					}
					container = showStatus(player.user.Id);
					await replyWithContainer(interaction, container);
					await wait(3000);
				}
			}

			let actualPrize = prize;
			let additionalMessage = "";
			
			if (winner.Class === ClassId.Thief) {
				actualPrize = thiefPrize;
				additionalMessage = s.thiefModifier(ClassList[winner.Class].Image.Emote.String, ClassList[winner.Class].Name[language]);
			}
			else if (winner.Class === ClassId.Attorney) {
				actualPrize = attorneyPrize;
				additionalMessage = s.attorneyModifier(ClassList[winner.Class].Image.Emote.String, ClassList[winner.Class].Name[language]);
			}

			const prizeToWinner = Math.floor(actualPrize - betValue);

			history.push(
				"",
				`${s.winnerMessage(winner.GetNameWithImage())} ${formatMoney(actualPrize, host.Language)}!`,
				additionalMessage,
			);

			await Promise.all([
				...losers.map(loser => Casino.FinishUserGameWithLoss(loser, betValue)),
				Casino.FinishUserGameWithWin(winner, prizeToWinner),
			]);

			container = showStatus(winner.Id);
			await disableButtons(interaction, container);
		}
	},
};

const Strings = {
	[Language.English]: {
		headerTitle: "Russian Roulette",
		headerDescription: (emote: string) => `Participate in an aggressive bet, where only one will be the winner, and all others will be ${emote} Hospitalized!`,
		gameTitle: (nick: string) => `### ${nick}'s Game`,
		betPrize: (bet: string, prize: string) => `Bet: ${bet} • Prize: ${prize}`,
		participants: (current: number, max: number) => `-# Participants ${current}/${max}`,
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
} as const;
