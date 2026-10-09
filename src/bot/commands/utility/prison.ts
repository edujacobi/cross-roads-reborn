import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { EmoteBadgeString } from "#bot/utils/badges";
import { createButtonCollector, disableButtons } from "#bot/utils/collectors";
import { CrColors } from "#bot/utils/colors";
import { deferUpdate, replyWithContainer } from "#bot/utils/discordInteractions";
import { EmoteId, EmoteString } from "#bot/utils/emotes";
import { defaultComponent, formatMoney } from "#bot/utils/ui";
import { globalStrings, Language, type Localization } from "#core/models/Language";
import { Pagination } from "#core/models/Pagination";
import { Prison, PrisonFailureReason } from "#core/models/Prison";
import type { User } from "#core/models/User";
import { ClassList, getPrisonEscapeClassModifier } from "#core/types/Classes";
import { ItemId } from "#core/types/Ids";
import { ItemList } from "#core/types/Items";
import { ButtonBuilder, ButtonStyle, type ChatInputCommandInteraction, Locale, SlashCommandBuilder, time, TimestampStyles } from "discord.js";
import { setTimeout as wait } from "timers/promises";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("prison")
		.setDescription("Visit the prison and meet the inmates")
		.setNameLocalization(Locale.PortugueseBR, "prisao")
		.setNameLocalization(Locale.SpanishES, "prision")
		.setDescriptionLocalization(Locale.PortugueseBR, "Conheça a prisão e seus presidiários")
		.setDescriptionLocalization(Locale.SpanishES, "Visitar la prisión y conocer a los reclusos"),

	async execute(interaction: ChatInputCommandInteraction, user: User) {
		const prison = new Prison(user);
		let container = new CustomContainerBuilder();

		const addContainerHeader = () => {
			const s = Strings[user.Language];

			container = new CustomContainerBuilder()
				.setUser(user)
				.setAccentColor(CrColors.Police)
				.addSectionComponents(header => header
					.addTexts([
						`# ${s.title}`,
						s.subtitle,
					])
					.setThumbnailAccessory(thumb => thumb
						.setURL("https://media.discordapp.net/attachments/1233604589064818808/1339946455913205871/Prison.png"),
					),
				)
				.addLargeSeparator();
		};

		const generateDefaultContainer = async () => {
			const s = Strings[user.Language];
			await prison.CalculateEscapeChance();

			const userClassModifier = getPrisonEscapeClassModifier(user.Class);
			const gangModifier = await prison.getGangEscapeModifier();

			let text = `${s.userFree}`;
			if (user.IsWanted()) {
				text = s.userWanted(user.Wanted.Time);
			}
			if (user.IsInPrison()) {
				text = s.userPrison(user.Prison.Time);
			}

			const prisoners = await prison.GetPrisoners();

			const buttonPrisoners = new ButtonBuilder()
				.setCustomId("prisoners")
				.setLabel(s.prisoners)
				.setDisabled(prisoners.length === 0)
				.setStyle(ButtonStyle.Secondary);

			const buttonEscape = new ButtonBuilder()
				.setCustomId("escape")
				.setLabel(s.escape)
				.setEmoji(prison.Escape.HasJetpack ? user.GetItemSkin(ItemList[ItemId.Jetpack]) : EmoteId.Escape)
				.setDisabled(!user.IsInPrison() || user.Escape.HasTried)
				.setStyle(ButtonStyle.Secondary);

			const buttonBribe = new ButtonBuilder()
				.setCustomId("bribe")
				.setLabel(s.bribe)
				.setEmoji(EmoteBadgeString.Season6.Politician)
				.setDisabled(!user.IsInPrison() || user.Prison.HasPaidBribe)
				.setStyle(ButtonStyle.Secondary);

			addContainerHeader();

			container
				.addSectionComponents(escape => escape
					.addTexts([
						s.descriptionEscape(prison.Escape.BaseChance + userClassModifier + gangModifier, prison.Escape.BaseJetpackChance + prison.Escape.BaseChance + userClassModifier + gangModifier, user.GetItemSkin(ItemList[ItemId.Jetpack])),
					])
					.setButtonAccessory(buttonEscape),
				)
				.addLargeSeparator()
				.addSectionComponents(bribe => bribe
					.addTexts([
						s.descriptionBribe,
					])
					.setButtonAccessory(buttonBribe),
				)
				.addLargeSeparator()
				.addTexts([
					`-# ${text}`,
				])
				.addFooter({
					text: `${s.currentChance}: ${prison.Escape.TotalChance}%`,
					button: buttonPrisoners,
				});

			return {
				prisoners,
				buttonPrisoners,
			};
		};

		const generateContainer = async () => {
			const s = Strings[user.Language];

			const { prisoners, buttonPrisoners } = await generateDefaultContainer();

			const response = await replyWithContainer(interaction, container);
			const collector = createButtonCollector(interaction, response, { idleTime: 30_000 });

			let isProcessing = false;
			collector?.on("collect", async btn => {
				if (isProcessing) return;
				isProcessing = true;

				try {
					await deferUpdate(btn);

					if (btn.customId === "back") {
						await generateDefaultContainer();

						return replyWithContainer(interaction, container);
					}

					else if (btn.customId === "prisoners") {
						buttonPrisoners.setDisabled(true);

						const pagination = new Pagination(interaction, user.Language);

						pagination.HowManyRecords = prisoners.length;
						pagination.Limit = 10;

						const containerPrisoners = new CustomContainerBuilder()
							.setUser(user)
							.addTexts([
								`# ${s.prisoners}`,
							])
							.addLargeSeparator();

						pagination.CustomizeContainer = async () => {
							const users = prisoners.slice(pagination.Offset, pagination.Offset + pagination.Limit);

							for (let i = 0; i < users.length; i++) {
								const prisoner = users[i];
								containerPrisoners.addTexts([
									`### ${ClassList[prisoner.class].Image.Emote.String} ${prisoner.nickname}`,
									`${s.free} ${time(prisoner.prisonTime, TimestampStyles.RelativeTime)} • ${s.howManyTimesPrison(prisoner.robberyFailureCount)} • ${s.howManyTimesEscape(prisoner.escapeCount)}`,
								]);

								if (i !== users.length - 1) {
									containerPrisoners.addSmallSeparator();
								}
							}

							return containerPrisoners;
						};

						await pagination.GenerateContainer(container);
					}

					else if (btn.customId === "escape") {
						await user.GetInfo();

						const { canEscape, reason, attacker } = await prison.CanEscape();

						if (!canEscape) {
							let message = "";
							if (reason === PrisonFailureReason.BribeNotInPrison) {
								message = s.bribeNotInPrison;
							}
							else if (reason === PrisonFailureReason.EscapeHasTried) {
								message = s.escapeHasTried;
							}
							else if (reason === PrisonFailureReason.EscapeEscaping) {
								message = s.escapeEscaping;
							}
							else if (reason === PrisonFailureReason.EscapeInHospital) {
								message = s.escapeInHospital(user.Hospital.Time);
							}
							else if (reason === PrisonFailureReason.AttackerIsBeingRobbedById) {
								message = globalStrings[user.Language].attackerIsBeingRobbedById(`${ClassList[attacker!.class].Image.Emote.String} ${attacker!.nickname!}`);
							}
							else if (reason === PrisonFailureReason.AttackerIsBeatingId) {
								message = globalStrings[user.Language].attackerIsBeatingId(`${ClassList[attacker!.class].Image.Emote.String} ${attacker!.nickname!}`);
							}
							else if (reason === PrisonFailureReason.AttackerIsBeingBeatedById) {
								message = globalStrings[user.Language].attackerIsBeingBeatedById(`${ClassList[attacker!.class].Image.Emote.String} ${attacker!.nickname!}`);
							}

							container = defaultComponent({
								user: user,
								color: CrColors.Police,
								description: `${message} ${EmoteString.Prison}`,
								footer: formatMoney(user.Money, user.Language),
							});

							return replyWithContainer(interaction, container);
						}

						await prison.StartEscape();

						const emote = prison.Escape.HasJetpack ? user.GetItemSkin(ItemList[ItemId.Jetpack]) : EmoteString.Escape;

						addContainerHeader();
						container
							.addTexts([
								`### ${emote} ${s.escapeInProgress}`,
							], 1)
							.addFooter();

						await replyWithContainer(interaction, container);

						// Poll until the backend finishes the escape, with a timeout bound
						const escapeTimeout = prison.Escape.DefaultDuration * 1_000 * 2 + 10_000;
						const pollStart = Date.now();
						while (Date.now() - pollStart < escapeTimeout) {
							await wait(500);
							await user.GetInfo();
							if (!user.IsEscaping()) break;
						}

						// Re-create Prison instance with fresh user data to avoid stale state
						const freshPrison = new Prison(user);
						const success = !user.IsInPrison();
						const totalTime = freshPrison.calculateTotalTime();
						const message = freshPrison.generateEscapeMessage(success, totalTime, user.Language);

						if (success) {
							container
								.changeTextFromSectionId(1, `### ${emote} ${s.escapeSuccess}\n${message}`)
								.changeFooterText(s.escapeWaitMinutes(Prison.EscapeTimeInMinutesWanted));
						}
						else {
							container
								.changeTextFromSectionId(1, `### ${emote} ${s.escapeFailure}\n${message}\n-# ${s.free} ${time(user.Prison.Time, TimestampStyles.RelativeTime)}`);
						}

						return replyWithContainer(interaction, container);
					}

					else if (btn.customId === "bribe") {
						await user.GetInfo();

						const { canBribe, reason, attacker } = await prison.CanBribe();

						if (!canBribe) {
							let message = "";
							if (reason === PrisonFailureReason.BribeHasPaid) {
								message = s.bribeHasPaid;
							}
							else if (reason === PrisonFailureReason.BribeNotInPrison) {
								message = s.bribeNotInPrison;
							}
							else if (reason === PrisonFailureReason.BribeEscaping) {
								message = s.bribeEscaping;
							}
							else if (reason === PrisonFailureReason.BribeInHospital) {
								message = s.bribeInHospital(user.Hospital.Time);
							}
							else if (reason === PrisonFailureReason.AttackerIsBeingRobbedById) {
								message = globalStrings[user.Language].attackerIsBeingRobbedById(`${ClassList[attacker!.class].Image.Emote.String} ${attacker!.nickname!}`);
							}
							else if (reason === PrisonFailureReason.AttackerIsBeatingId) {
								message = globalStrings[user.Language].attackerIsBeatingId(`${ClassList[attacker!.class].Image.Emote.String} ${attacker!.nickname!}`);
							}
							else if (reason === PrisonFailureReason.AttackerIsBeingBeatedById) {
								message = globalStrings[user.Language].attackerIsBeingBeatedById(`${ClassList[attacker!.class].Image.Emote.String} ${attacker!.nickname!}`);
							}

							container = defaultComponent({
								user: user,
								color: CrColors.Police,
								description: `${message} ${EmoteString.Prison}`,
								footer: formatMoney(user.Money, user.Language),
							});

							return replyWithContainer(interaction, container);
						}

						const bribeValue = prison.CalculateBribeValue();

						addContainerHeader();

						container
							.addTexts([
								`### ${EmoteBadgeString.Season6.Politician} ${s.bribe}`,
								`${s.briberyStart(bribeValue)}`,
							])
							.addButtonRow(
								btn => btn
									.setCustomId("back")
									.setLabel(s.back)
									.setStyle(ButtonStyle.Secondary),
								btn => btn
									.setCustomId("confirmBribe")
									.setLabel(s.confirm)
									.setDisabled(user.Money < bribeValue)
									.setStyle(ButtonStyle.Success),
							)
							.addFooter({
								text: formatMoney(user.Money, user.Language),
							});

						return replyWithContainer(interaction, container);
					}

					else if (btn.customId === "confirmBribe") {
						await user.GetInfo();

						const { canBribe, reason, attacker } = await prison.CanBribe();

						if (!canBribe) {
							let message = "";
							if (reason === PrisonFailureReason.BribeHasPaid) {
								message = s.bribeHasPaid;
							}
							else if (reason === PrisonFailureReason.BribeNotInPrison) {
								message = s.bribeNotInPrison;
							}
							else if (reason === PrisonFailureReason.BribeEscaping) {
								message = s.bribeEscaping;
							}
							else if (reason === PrisonFailureReason.BribeInHospital) {
								message = s.bribeInHospital(user.Hospital.Time);
							}
							else if (reason === PrisonFailureReason.AttackerIsBeingRobbedById) {
								message = globalStrings[user.Language].attackerIsBeingRobbedById(`${ClassList[attacker!.class].Image.Emote.String} ${attacker!.nickname!}`);
							}
							else if (reason === PrisonFailureReason.AttackerIsBeatingId) {
								message = globalStrings[user.Language].attackerIsBeatingId(`${ClassList[attacker!.class].Image.Emote.String} ${attacker!.nickname!}`);
							}
							else if (reason === PrisonFailureReason.AttackerIsBeingBeatedById) {
								message = globalStrings[user.Language].attackerIsBeingBeatedById(`${ClassList[attacker!.class].Image.Emote.String} ${attacker!.nickname!}`);
							}

							container = defaultComponent({
								user: user,
								color: CrColors.Police,
								description: `${message} ${EmoteString.Prison}`,
								footer: formatMoney(user.Money, user.Language),
							});

							return replyWithContainer(interaction, container);
						}

						const success = await prison.PayBribery(prison.Bribe.Value);

						addContainerHeader();

						if (success) {
							container
								.addTexts([
									`### ${EmoteString.Police} ${s.briberyAccepted}`,
									s.briberyAcceptedDescription,
								])
								.addFooter({ text: `${s.briberyAcceptedFooter} • ${formatMoney(user.Money, user.Language)}` });
						}
						else {
							container
								.addTexts([
									`### ${EmoteString.Police} ${s.briberyRejected}`,
									s.briberyRejectedDescription,
								])
								.addFooter({ text: `${s.briberyRejectedFooter} • ${formatMoney(user.Money, user.Language)}` });
						}

						return replyWithContainer(interaction, container);
					}
				}
				finally {
					isProcessing = false;
				}
			});

			collector?.on("end", async () => {
				await disableButtons(interaction, container);
			});
		};

		await generateContainer();
	},
};

const Strings = {
	[Language.English]: {
		userFree: "You are free!",
		userWanted: (timerEscape: Date) => `You are being wanted by the police! You can rob again ${time(timerEscape, TimestampStyles.RelativeTime)} ${EmoteString.Police}`,
		userPrison: (timerPrison: Date) => `You are in prison! You will be released ${time(timerPrison, TimestampStyles.RelativeTime)} ${EmoteString.Prison}`,
		title: "Prison",
		subtitle: `When trying to rob someone and failing, you will be imprisoned for a time determined by your ${EmoteString.Attack}ATK.

-# Being imprisoned limits many of your actions in the game, such as working, investing, betting, scavenging, and of course, stealing.`,
		descriptionEscape: (chance: number, jetpackChance: number, jetpackEmote: string) => `### ${EmoteString.Escape} Escape\nYou have a ${chance}% (${jetpackChance}% if you have a ${jetpackEmote} **${ItemList[ItemId.Jetpack].Description[Language.English]}**) chance of escaping from prison!`,
		descriptionBribe: `### ${EmoteBadgeString.Season6.Politician} Bribe\nThe guards are greedy, and the higher your ${EmoteString.Attack}ATK, the more they will ask for! They can also refuse your bribe, but they will keep your money.`,
		currentChance: "Current chance",
		prisoners: "Prisoners",
		escape: "Escape",
		bribe: "Bribe",
		briberyStart: (value: number) => `_"We know you have some money hidden there... Give us **${formatMoney(value, Language.English)}** and we'll let you out quietly."_\n-# Confirm payment?`,
		briberyAccepted: "Bribery accepted",
		briberyAcceptedDescription: "_\"That's how it's done! Get out of here before anyone else sees you.\"_",
		briberyAcceptedFooter: `Wait ${Prison.BribeTimeInMinutesWanted} minutes to do something stupid`,
		briberyRejected: "Bribery rejected",
		briberyRejectedDescription: "_\"Damn dude, you have to be really stupid to pay that amount and think we would release you.\"_",
		briberyRejectedFooter: "You will remain imprisoned",
		free: "Free",
		confirm: "Confirm",
		back: "Go back",
		howManyTimesPrison: (times: number) => `Imprisoned \`${times}\` times`,
		howManyTimesEscape: (times: number) => `Escaped \`${times}\` times`,
		escapeHasTried: `The police are watching you! ${EmoteString.Police}\n-# You won't be able to escape`,
		escapeEscaping: `You are already trying to escape! ${EmoteString.Escape}\n-# This kind of thing requires patience`,
		bribeHasPaid: `We won't accept anything from you, smartass! ${EmoteString.Police}\n-# "Maybe next time you stop being an idiot"`,
		bribeNotInPrison: `You are not in prison! ${EmoteString.Prison}\n-# "But we can lock you in. What do you think?"`,
		bribeEscaping: `You are trying to escape and cannot bribe! ${EmoteString.Escape}\n-# Focus!`,
		escapeInHospital: (date: Date) => `You can't escape while you are hospitalized! ${EmoteString.Hospital}\n-# You will be healed ${time(date, TimestampStyles.RelativeTime)}!`,
		bribeInHospital: (date: Date) => `You can't bribe while you are hospitalized! ${EmoteString.Hospital}\n-# You will be healed ${time(date, TimestampStyles.RelativeTime)}!`,
		escapeInProgress: `Escape in progress ${EmoteString.Waiting}`,
		escapeSuccess: "Successful escape!",
		escapeFailure: "Failed escape!",
		escapeWaitMinutes: (minutes: number) => `Wait ${minutes} minutes to steal again`,
		escapeWillBeInPrison: (minutes: number) => `You will be imprisoned for another ${minutes} minutes.`,
	},
	[Language.Portuguese]: {
		userFree: "Você está livre!",
		userWanted: (timerEscape: Date) => `Você está sendo procurado pela polícia! Poderá roubar novamente ${time(timerEscape, TimestampStyles.RelativeTime)} ${EmoteString.Police}`,
		userPrison: (timerPrison: Date) => `Você está preso! Será solto ${time(timerPrison, TimestampStyles.RelativeTime)} ${EmoteString.Prison}`,
		title: "Prisão",
		subtitle: `Ao tentar roubar alguém e falhar, você será preso por um tempo determinado pelo seu ${EmoteString.Attack}ATK.

-# Estar preso limita muitas de suas ações no jogo, como trabalhar, investir, apostar, vasculhar, e claro, roubar.`,
		descriptionEscape: (chance: number, jetpackChance: number, jetpackEmote: string) => `### ${EmoteString.Escape} Fugir\nVocê tem ${chance}% (${jetpackChance}% se possuir uma ${jetpackEmote} **${ItemList[ItemId.Jetpack].Description[Language.Portuguese]}**) de chance de fugir da prisão!`,
		descriptionBribe: `### ${EmoteBadgeString.Season6.Politician} Subornar\nOs guardas são gananciosos, e quanto maior o seu ${EmoteString.Attack}ATK, mais eles pedirão! Eles também podem recusar seu suborno, mas ficarão com seu dinheiro.`,
		currentChance: "Chance atual",
		prisoners: "Prisioneiros",
		escape: "Fugir",
		bribe: "Subornar",
		briberyStart: (value: number) => `_"Sabemos que você tem um certo dinheiro escondido aí... Nos dê **${formatMoney(value, Language.Portuguese)}** e deixaremos você sair de fininho."_\n-# Confirmar pagamento?`,
		briberyAccepted: "Suborno aceito",
		briberyAcceptedDescription: "_\"Assim que se faz! Caia fora daqui antes que mais alguém te veja.\"_",
		briberyAcceptedFooter: `Espere ${Prison.BribeTimeInMinutesWanted} minutos para fazer alguma besteira`,
		briberyRejected: "Suborno recusado",
		briberyRejectedDescription: "_\"Caralho mané, tu tem que ser muito burro pra pagar esse valor e achar que iríamos te liberar.\"_",
		briberyRejectedFooter: "Você continuará preso",
		free: "Livre",
		confirm: "Confirmar",
		back: "Voltar",
		howManyTimesPrison: (times: number) => `Preso \`${times}\` vezes`,
		howManyTimesEscape: (times: number) => `Fugiu \`${times}\` vezes`,
		escapeHasTried: `Os policiais estão te observando! ${EmoteString.Police}\n-# Você não conseguirá fugir`,
		escapeEscaping: `Você já está tentando fugir! ${EmoteString.Escape}\n-# Este tipo de coisa pede paciência`,
		bribeHasPaid: `Não aceitaremos nada vindo de você, espertalhão! ${EmoteString.Police}\n-# "Quem sabe na próxima tu deixa de ser idiota"`,
		bribeNotInPrison: `Você não está preso! ${EmoteString.Prison}\n-# "Mas podemos te prender. O que acha?"`,
		bribeEscaping: `Você está tentando escapar e não pode subornar! ${EmoteString.Escape}\n-# "Foco!"`,
		escapeInHospital: (date: Date) => `Você não pode fugir enquanto está hospitalizado! ${EmoteString.Hospital}\n-# Será curado ${time(date, TimestampStyles.RelativeTime)}!`,
		bribeInHospital: (date: Date) => `Você não pode subornar enquanto está hospitalizado! ${EmoteString.Hospital}\n-# Será curado ${time(date, TimestampStyles.RelativeTime)}!`,
		escapeInProgress: `Fuga em andamento ${EmoteString.Waiting}`,
		escapeSuccess: "Fuga bem-sucedida!",
		escapeFailure: "Fuga fracassada!",
		escapeWaitMinutes: (minutes: number) => `Espere ${minutes} minutos para roubar novamente`,
		escapeWillBeInPrison: (minutes: number) => `Você ficará preso por mais ${minutes} minutos.`,
	},
	[Language.Spanish]: {
		userFree: "¡Estás libre!",
		userWanted: (timerEscape: Date) => `¡Estás siendo buscado por la policía! ¡Puedes robar de nuevo ${time(timerEscape, TimestampStyles.RelativeTime)} ${EmoteString.Police}`,
		userPrison: (timerPrison: Date) => `¡Estás preso! ¡Serás liberado ${time(timerPrison, TimestampStyles.RelativeTime)} ${EmoteString.Prison}`,
		title: "Prisión",
		subtitle: `Al intentar robar a alguien y fallar, serás encarcelado por un tiempo determinado por tu ${EmoteString.Attack}ATK.

-# Estar encarcelado limita muchas de tus acciones en el juego, como trabajar, invertir, apostar, buscar, y por supuesto, robar.`,
		descriptionEscape: (chance: number, jetpackChance: number, jetpackEmote: string) => `### ${EmoteString.Escape} Escapar\nTienes un ${chance}% (${jetpackChance}% si tienes un ${jetpackEmote} **${ItemList[ItemId.Jetpack].Description[Language.Spanish]}**) de escapar de la prisión!`,
		descriptionBribe: `### ${EmoteBadgeString.Season6.Politician} Sobornar\nLos guardias son codiciosos, y cuanto mayor sea tu ${EmoteString.Attack}ATK, más te pedirán! También pueden rechazar tu soborno, pero se quedarán con tu dinero.`,
		currentChance: "Chance actual",
		prisoners: "Prisioneros",
		escape: "Escapar",
		bribe: "Sobornar",
		briberyStart: (value: number) => `_"Sabemos que tienes algo de dinero escondido ahí... Danos **${formatMoney(value, Language.Spanish)}** y te dejaremos salir en silencio."_\n-# ¿Confirmar pago?`,
		briberyAccepted: "Soborno aceptado",
		briberyAcceptedDescription: "_\"¡Así se hace! ¡Lárgate de aquí antes de que alguien más te vea!\"_",
		briberyAcceptedFooter: `Espera ${Prison.BribeTimeInMinutesWanted} minutos para hacer alguna tontería`,
		briberyRejected: "Soborno rechazado",
		briberyRejectedDescription: "_\"¡Joder tío, tienes que ser muy tonto para pagar esa cantidad y pensar que te liberaríamos!\"_",
		briberyRejectedFooter: "Permanecerás encarcelado",
		free: "Libre",
		confirm: "Confirmar",
		back: "Volver",
		howManyTimesPrison: (times: number) => `Encarcelado \`${times}\` veces`,
		howManyTimesEscape: (times: number) => `Huyó \`${times}\` veces`,
		escapeHasTried: `¡La policía te está observando! ${EmoteString.Police}\n-# No podrás escapar`,
		escapeEscaping: `¡Ya estás intentando escapar! ${EmoteString.Escape}\n-# Este tipo de cosas requiere paciencia`,
		bribeHasPaid: `¡No aceptaremos nada de ti, listillo! ${EmoteString.Police}\n-# "Quizás la próxima vez dejas de ser idiota"`,
		bribeNotInPrison: `¡No estás en la cárcel! ${EmoteString.Prison}\n-# "Pero podemos encerrarte. ¿Qué te parece?"`,
		bribeEscaping: `¡Estás intentando escapar y no puedes sobornar! ${EmoteString.Escape}\n-# "¡Enfócate!"`,
		escapeInHospital: (date: Date) => `¡No puedes escapar mientras estás hospitalizado! ${EmoteString.Hospital}\n-# ¡Serás curado ${time(date, TimestampStyles.RelativeTime)}!`,
		bribeInHospital: (date: Date) => `¡No puedes sobornar mientras estás hospitalizado! ${EmoteString.Hospital}\n-# ¡Serás curado ${time(date, TimestampStyles.RelativeTime)}!`,
		escapeInProgress: `¡Fuga en progreso ${EmoteString.Waiting}`,
		escapeSuccess: "Fuga exitosa!",
		escapeFailure: "Fuga fallida!",
		escapeWaitMinutes: (minutes: number) => `Espera ${minutes} minutos para robar de nuevo`,
		escapeWillBeInPrison: (minutes: number) => `Permanecerás encarcelado por otros ${minutes} minutos.`,
	},
} as const satisfies Localization;
