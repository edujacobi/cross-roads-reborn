"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const collectors_1 = require("#bot/utils/collectors");
const colors_1 = require("#bot/utils/colors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const emotes_1 = require("#bot/utils/emotes");
const ui_1 = require("#bot/utils/ui");
const userUtils_1 = require("#bot/utils/userUtils");
const MultiplayerSession_1 = require("#core/models/MultiplayerSession");
const Language_1 = require("#core/models/Language");
const Classes_1 = require("#core/types/Classes");
const discord_js_1 = require("discord.js");
const log_1 = require("#shared/log");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("russianroulette")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "roletarussa")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "ruletarusa")
        .setDescription("Game of Russian Roulette")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Jogo de Roleta Russa")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Juego de Ruleta Rusa")
        .addNumberOption(option => option
        .setName("bet")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "aposta")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "apuesta")
        .setDescription("The bet")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "A aposta")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "La apuesta")
        .setMinValue(5_000)
        .setRequired(true)),
    async execute(interaction, user, language) {
        const betValue = interaction.options.getNumber("bet", true);
        const s = Strings[language];
        const maxParticipants = 5;
        const prize = (betValue * maxParticipants) / (Classes_1.ClassList[Classes_1.ClassId.Attorney].Modifier?.Casino?.Positive || 1);
        const currentSessions = () => MultiplayerSession_1.MultiplayerSession.GetVisibleSessions(user.Id, user.GangId)
            .filter(session => session.kind === "russianRoulette" &&
            session.phase === "lobby" &&
            !session.participants.some(participant => participant.userId === user.Id));
        function getHeader() {
            return new CustomContainerBuilder_1.CustomContainerBuilder()
                .setUser(user)
                .setAccentColor(colors_1.CrColors.Casino)
                .addSectionComponents(header => header
                .addTexts([`# ${s.headerTitle}`, s.headerDescription(emotes_1.EmoteString.Hospital)])
                .setThumbnailAccessory(thumb => thumb.setURL("https://media.discordapp.net/attachments/1233604589064818808/1464272049483681924/RussianRoulette.png")))
                .addLargeSeparator();
        }
        function getInitialContainer() {
            const openLobbies = currentSessions();
            const initial = getHeader()
                .addTexts([s.betDefined((0, ui_1.formatMoney)(betValue, language))])
                .addButtonRow(btn => btn
                .setLabel(s.startButton)
                .setCustomId("start")
                .setStyle(discord_js_1.ButtonStyle.Primary));
            if (openLobbies.length > 0) {
                initial.addLargeSeparator().addTexts([s.openLobbies]);
                for (const lobby of openLobbies.slice(0, 5)) {
                    initial.addButtonRow(btn => btn
                        .setLabel(`${s.participateButton} • ${(0, ui_1.formatMoney)(lobby.bet ?? betValue, language)}`)
                        .setCustomId(`join_${lobby.id}`)
                        .setStyle(discord_js_1.ButtonStyle.Secondary));
                }
            }
            return initial.addFooter({ text: (0, ui_1.formatMoney)(user.Money, language) });
        }
        function getSessionContainer(session) {
            if (session.phase === "aborting" || session.phase === "aborted") {
                return getHeader()
                    .addTexts([s.timeout])
                    .addFooter({ text: (0, ui_1.formatMoney)(user.Money, language) });
            }
            if (session.phase === "lobby") {
                return getHeader()
                    .addSectionComponents(section => section
                    .addTexts([
                    s.betPrize((0, ui_1.formatMoney)(session.bet ?? betValue, language), (0, ui_1.formatMoney)(prize, language)),
                    s.participants(session.participants.length, session.maxParticipants),
                    session.participants.map(participant => `- ${participant.nickname}`).join("\n"),
                    s.joinInstruction,
                ])
                    .setButtonAccessory(btn => btn
                    .setLabel(s.participateButton)
                    .setCustomId("participate")
                    .setStyle(discord_js_1.ButtonStyle.Secondary)))
                    .addFooter({ text: (0, ui_1.formatMoney)(user.Money, language) });
            }
            const getName = (id) => session.participants.find(participant => participant.userId === id)?.nickname ?? "";
            const history = session.events.slice(-15).map(event => {
                const nickname = getName(event.userId);
                if (event.type === "started")
                    return s.historyStart(user.Nickname, nickname);
                if (event.type === "turn") {
                    return event.outcome === "eliminated"
                        ? s.hitMessages[0](nickname, emotes_1.EmoteString.Hospital)
                        : s.missMessages[0](nickname);
                }
                if (event.type === "finished") {
                    const result = session.result
                        ? MultiplayerSession_1.MultiplayerSession.DecodeResult(session.result)
                        : null;
                    return `${s.winnerMessage(nickname)} ${(0, ui_1.formatMoney)(result?.prize ?? 0, language)}!`;
                }
                return "";
            });
            const status = session.participants.map(participant => `-# ${session.events.at(-1)?.userId === participant.userId ? emotes_1.EmoteString.React : ""} ${participant.nickname} ${session.aliveUserIds.includes(participant.userId) ? emotes_1.EmoteString.Victory : emotes_1.EmoteString.Hospital}`);
            const container = getHeader();
            if (history.length > 0)
                container.addTexts(history).addLargeSeparator();
            container
                .addTexts(status)
                .addFooter({
                text: `${(0, ui_1.formatMoney)(user.Money, language)} • ${s.betPrize((0, ui_1.formatMoney)(session.bet ?? betValue, language), (0, ui_1.formatMoney)(prize, language))}`,
            });
            return container;
        }
        function warn(target, message) {
            return (0, discordInteractions_1.replyWithContainer)(target, (0, ui_1.defaultComponent)({ description: message, color: colors_1.CrColors.Casino }), true);
        }
        let activeSessionId = null;
        let container = getInitialContainer();
        const response = await (0, discordInteractions_1.replyWithContainer)(interaction, container);
        const collector = response?.createMessageComponentCollector({
            componentType: discord_js_1.ComponentType.Button,
            idle: 60_000,
        });
        const updateSession = async (session) => {
            if (session.id !== activeSessionId)
                return;
            container = getSessionContainer(session);
            await (0, discordInteractions_1.replyWithContainer)(interaction, container);
        };
        let updateQueue = Promise.resolve();
        const queueUpdate = (session) => {
            updateQueue = updateQueue.then(() => updateSession(session)).catch(error => {
                log_1.Log.Error(`Failed to update Russian Roulette session ${session.id}: ${error}`);
            });
            return updateQueue;
        };
        const unsubscribe = MultiplayerSession_1.MultiplayerSession.Subscribe(user.Id, user.GangId, session => {
            if (session.id === activeSessionId) {
                void queueUpdate(session);
            }
            else if (!activeSessionId && session.kind === "russianRoulette") {
                container = getInitialContainer();
                void (0, discordInteractions_1.replyWithContainer)(interaction, container).catch(error => log_1.Log.Error(`Failed to update Russian Roulette lobby list: ${error}`));
            }
        });
        const watchSession = (sessionId) => {
            activeSessionId = sessionId;
            const current = MultiplayerSession_1.MultiplayerSession.GetVisibleSession(sessionId, user.Id, user.GangId);
            if (current)
                void queueUpdate(current);
            void MultiplayerSession_1.MultiplayerSession.WaitForCompletion(sessionId)
                .then(queueUpdate)
                .catch(error => log_1.Log.Error(`Failed waiting for Russian Roulette session ${sessionId}: ${error}`))
                .finally(unsubscribe);
        };
        collector?.on("end", () => {
            if (!activeSessionId) {
                container.changeFooterText(s.timeout);
                void (0, collectors_1.disableButtons)(interaction, container);
                unsubscribe();
            }
        });
        collector?.on("collect", async (btn) => {
            if (btn.customId === "start") {
                if (btn.user.id !== user.Id)
                    return warn(btn, s.onlyHostCanStart);
                await (0, discordInteractions_1.deferUpdate)(btn);
                await user.GetInfo();
                const result = await MultiplayerSession_1.MultiplayerSession.StartRussianRoulette(user, betValue, "discord");
                if (!result.success)
                    return warn(btn, result.message);
                watchSession(result.session.id);
                return;
            }
            const sessionId = btn.customId === "participate"
                ? activeSessionId
                : btn.customId.startsWith("join_")
                    ? btn.customId.slice(5)
                    : null;
            if (!sessionId)
                return;
            await (0, discordInteractions_1.deferUpdate)(btn);
            const joiningUser = await (0, userUtils_1.checkUser)(btn.user.id, interaction);
            if (!joiningUser)
                return;
            const result = await MultiplayerSession_1.MultiplayerSession.JoinRussianRoulette(sessionId, joiningUser, joiningUser.Language);
            if (!result.success) {
                await btn.followUp({ content: result.message || s.alreadyParticipating, flags: discord_js_1.MessageFlags.Ephemeral });
                return;
            }
            watchSession(sessionId);
        });
    },
};
const Strings = {
    [Language_1.Language.English]: {
        headerTitle: "Russian Roulette",
        headerDescription: (emote) => `Participate in an aggressive bet, where only one will be the winner, and all others will be ${emote} Hospitalized!`,
        gameTitle: (nick) => `### ${nick}'s Game`,
        betPrize: (bet, prize) => `Bet: ${bet} • Prize: ${prize}`,
        participants: (current, max) => `-# Participants ${current}/${max}`,
        openLobbies: "Open lobbies",
        joinInstruction: "-# Click **Participate** to join. The game will start automatically.",
        participateButton: "Participate",
        betDefined: (bet) => `You defined the bet as ${bet}`,
        startButton: "Start",
        onlyHostCanStart: `Only the host can start the game ${emotes_1.EmoteString.Casino}`,
        fullGame: (current, max) => `This Russian Roulette is already full (${current}/${max} participants) ${emotes_1.EmoteString.Casino}`,
        alreadyParticipating: `You are already participating in this Russian Roulette! ${emotes_1.EmoteString.Casino}`,
        unavailableUsers: (users) => `The following users are no longer available to bet: ${users} ${emotes_1.EmoteString.Casino}`,
        historyStart: (name, first) => `**${name}** prepares the revolver and puts a bullet in... **${first}** will first.`,
        hitMessages: [
            (name, emote) => `**${name}** was unlucky and was ${emote} Hospitalized!`,
            (name, emote) => `**${name}** pulled the trigger and... BANG! ${emote}`,
            (name, emote) => `**${name}**'s luck ran out today. ${emote}`,
            (name, emote) => `A loud shot rings out! **${name}** falls to the ground. ${emote}`,
            (name, emote) => `**${name}** stares into the barrel... and sees the flash. ${emote}`,
            (name, emote) => `Click... BOOM! **${name}** is down! ${emote}`,
            (name, emote) => `**${name}** took the gamble and paid the price. ${emote}`,
            (name, emote) => `The chamber wasn't empty for **${name}**. ${emote}`,
            (name, emote) => `**${name}** meets their fate with a loud bang. ${emote}`,
            (name, emote) => `Goodbye, **${name}**. See you at the hospital. ${emote}`,
        ],
        missMessages: [
            (name) => `**${name}** got away and continues in the game...`,
            (name) => `Click! **${name}** breathes a sigh of relief.`,
            (name) => `**${name}** sweats nervously as the hammer falls on an empty chamber.`,
            (name) => `Silence. **${name}** is safe... for now.`,
            (name) => `**${name}** smiles nervously. It was empty.`,
            (name) => `**${name}** passes the gun, hands shaking. Safe.`,
            (name) => `The gods of luck smile upon **${name}**.`,
            (name) => `**${name}** closes their eyes... and hears a click.`,
            (name) => `Not today! **${name}** survives the round.`,
            (name) => `**${name}** lives to spin another day.`,
        ],
        winnerMessage: (name) => `**${name}** is the big winner and took the prize of`,
        timeout: "Time expired",
        thiefModifier: (emote, name) => `-# Prize reduced because of the ${emote} **${name}** class modifier!`,
        attorneyModifier: (emote, name) => `-# Prize increased because of the ${emote} **${name}** class modifier!`,
    },
    [Language_1.Language.Portuguese]: {
        headerTitle: "Roleta Russa",
        headerDescription: (emote) => `Participe de uma aposta agressiva, onde somente um sairá vencedor, e todos os outros ficarão ${emote} Hospitalizados!`,
        gameTitle: (nick) => `### Jogo de ${nick}`,
        betPrize: (bet, prize) => `Aposta: ${bet} • Prêmio: ${prize}`,
        participants: (current, max) => `-# Participantes ${current}/${max}`,
        openLobbies: "Salas abertas",
        joinInstruction: "-# Clique em **Participar** para entrar. O jogo comecará automaticamente.",
        participateButton: "Participar",
        betDefined: (bet) => `Você definiu a aposta como ${bet}`,
        startButton: "Iniciar",
        onlyHostCanStart: `Apenas o anfitrião pode iniciar o jogo ${emotes_1.EmoteString.Casino}`,
        fullGame: (current, max) => `Esta Roleta russa já está cheia (${current}/${max} participantes) ${emotes_1.EmoteString.Casino}`,
        alreadyParticipating: `Você já está participando desta Roleta Russa! ${emotes_1.EmoteString.Casino}`,
        unavailableUsers: (users) => `Os seguintes usuários não estão mais disponíveis para apostar: ${users} ${emotes_1.EmoteString.Casino}`,
        historyStart: (name, first) => `**${name}** prepara o revólver e coloca uma munição... **${first}** irá primeiro.`,
        hitMessages: [
            (name, emote) => `**${name}** não teve sorte e foi ${emote} Hospitalizado!`,
            (name, emote) => `**${name}** puxou o gatilho e... BANG! ${emote}`,
            (name, emote) => `A sorte de **${name}** acabou hoje. ${emote}`,
            (name, emote) => `Um tiro alto ecoa! **${name}** cai no chão. ${emote}`,
            (name, emote) => `**${name}** encara o cano... e vê o clarão. ${emote}`,
            (name, emote) => `Clique... BOOM! **${name}** caiu! ${emote}`,
            (name, emote) => `**${name}** arriscou e pagou o preço. ${emote}`,
            (name, emote) => `A câmara não estava vazia para **${name}**. ${emote}`,
            (name, emote) => `**${name}** encontra seu destino com um estrondo. ${emote}`,
            (name, emote) => `Adeus, **${name}**. Nos vemos no hospital. ${emote}`,
        ],
        missMessages: [
            (name) => `**${name}** se safou e continua no jogo.`,
            (name) => `Clique! **${name}** suspira de alívio.`,
            (name) => `**${name}** transpira nervosamente enquanto o cão bate em uma câmara vazia.`,
            (name) => `Silêncio. **${name}** está salvo... por enquanto.`,
            (name) => `**${name}** sorri nervosamente. Estava vazio.`,
            (name) => `**${name}** passa a arma, com as mãos tremendo. Salvo.`,
            (name) => `Os deuses da sorte sorriem para **${name}**.`,
            (name) => `**${name}** fecha os olhos... e ouve um clique.`,
            (name) => `Hoje não! **${name}** sobrevive à rodada.`,
            (name) => `**${name}** vive para girar mais um dia.`,
        ],
        winnerMessage: (name) => `**${name}** é o grande vencedor e levou o prêmio de`,
        timeout: "Tempo esgotado",
        thiefModifier: (emote, name) => `-# Prêmio reduzido devido ao modificador da classe ${emote} **${name}**!`,
        attorneyModifier: (emote, name) => `-# Prêmio aumentado devido ao modificador da classe ${emote} **${name}**!`,
    },
    [Language_1.Language.Spanish]: {
        headerTitle: "Ruleta Rusa",
        headerDescription: (emote) => `¡Participa en una apuesta agresiva, donde solo uno saldrá ganador, y todos los demás quedarán ${emote} Hospitalizados!`,
        gameTitle: (nick) => `### Juego de ${nick}`,
        betPrize: (bet, prize) => `Apuesta: ${bet} • Premio: ${prize}`,
        participants: (current, max) => `-# Participantes ${current}/${max}`,
        openLobbies: "Salas abiertas",
        joinInstruction: "-# Haz clic en **Participar** para entrar. El juego comenzará automáticamente.",
        participateButton: "Participar",
        betDefined: (bet) => `Definiste la apuesta como ${bet}`,
        startButton: "Iniciar",
        onlyHostCanStart: `Solo el anfitrión puede iniciar el juego ${emotes_1.EmoteString.Casino}`,
        fullGame: (current, max) => `Esta Ruleta Rusa ya está llena (${current}/${max} participantes) ${emotes_1.EmoteString.Casino}`,
        alreadyParticipating: `¡Ya estás participando en esta Ruleta Rusa! ${emotes_1.EmoteString.Casino}`,
        unavailableUsers: (users) => `Los siguientes usuarios ya no están disponibles para apostar: ${users} ${emotes_1.EmoteString.Casino}`,
        historyStart: (name, first) => `**${name}** prepara el revolver y pone una bala... **${first}** irá primero`,
        hitMessages: [
            (name, emote) => `**${name}** no tuvo suerte y fue ${emote} Hospitalizado!`,
            (name, emote) => `**${name}** apretó el gatillo y... ¡BANG! ${emote}`,
            (name, emote) => `La suerte de **${name}** se acabó hoy. ${emote}`,
            (name, emote) => `¡Suena un fuerte disparo! **${name}** cae al suelo. ${emote}`,
            (name, emote) => `**${name}** mira el cañón... y ve el destello. ${emote}`,
            (name, emote) => `Clic... ¡BOOM! ¡**${name}** ha caído! ${emote}`,
            (name, emote) => `**${name}** se arriesgó y pagó el precio. ${emote}`,
            (name, emote) => `La recámara no estaba vacía para **${name}**. ${emote}`,
            (name, emote) => `**${name}** encuentra su destino con un estruendo. ${emote}`,
            (name, emote) => `Adiós, **${name}**. Nos vemos en el hospital. ${emote}`,
        ],
        missMessages: [
            (name) => `**${name}** se salvó y continúa en el juego.`,
            (name) => `¡Clic! **${name}** suspira de alivio.`,
            (name) => `**${name}** suda nerviosamente mientras el percutor golpea una recámara vacía.`,
            (name) => `Silencio. **${name}** está a salvo... por ahora.`,
            (name) => `**${name}** sonríe nerviosamente. Estaba vacío.`,
            (name) => `**${name}** pasa el arma, con las manos temblando. A salvo.`,
            (name) => `Los dioses de la suerte sonríen a **${name}**.`,
            (name) => `**${name}** cierra los ojos... y escucha un clic.`,
            (name) => `¡Hoy no! **${name}** sobrevive a la ronda.`,
            (name) => `**${name}** vive para girar un día más.`,
        ],
        winnerMessage: (name) => `**${name}** es el gran ganador y se llevó el premio de`,
        timeout: "Tiempo agotado",
        thiefModifier: (emote, name) => `-# ¡Premio reducido debido al modificador de la clase ${emote} **${name}**!`,
        attorneyModifier: (emote, name) => `-# ¡Premio aumentado debido al modificador de la clase ${emote} **${name}**!`,
    },
};
//# sourceMappingURL=russianroulette.js.map