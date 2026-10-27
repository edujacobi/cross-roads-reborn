"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const badges_1 = require("#bot/utils/badges");
const collectors_1 = require("#bot/utils/collectors");
const colors_1 = require("#bot/utils/colors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const emotes_1 = require("#bot/utils/emotes");
const ui_1 = require("#bot/utils/ui");
const Language_1 = require("#core/models/Language");
const Pagination_1 = require("#core/models/Pagination");
const Prison_1 = require("#core/models/Prison");
const Classes_1 = require("#core/types/Classes");
const Ids_1 = require("#core/types/Ids");
const Items_1 = require("#core/types/Items");
const discord_js_1 = require("discord.js");
const promises_1 = require("timers/promises");
const log_1 = require("#shared/log");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("prison")
        .setDescription("Visit the prison and meet the inmates")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "prisao")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "prision")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Conheça a prisão e seus presidiários")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Visitar la prisión y conocer a los reclusos"),
    async execute(interaction, user) {
        const prison = new Prison_1.Prison(user);
        let container = new CustomContainerBuilder_1.CustomContainerBuilder();
        const addContainerHeader = () => {
            const s = Strings[user.Language];
            container = new CustomContainerBuilder_1.CustomContainerBuilder()
                .setUser(user)
                .setAccentColor(colors_1.CrColors.Police)
                .addSectionComponents(header => header
                .addTexts([
                `# ${s.title}`,
                s.subtitle,
            ])
                .setThumbnailAccessory(thumb => thumb
                .setURL("https://media.discordapp.net/attachments/1233604589064818808/1339946455913205871/Prison.png")))
                .addLargeSeparator();
        };
        const generateDefaultContainer = async () => {
            const s = Strings[user.Language];
            await prison.CalculateEscapeChance();
            const userClassModifier = (0, Classes_1.getPrisonEscapeClassModifier)(user.Class);
            const gangModifier = await prison.getGangEscapeModifier();
            let text = `${s.userFree}`;
            if (user.IsWanted()) {
                text = s.userWanted(user.Wanted.Time);
            }
            if (user.IsInPrison()) {
                text = s.userPrison(user.Prison.Time);
            }
            const prisoners = await prison.GetPrisoners();
            const buttonPrisoners = new discord_js_1.ButtonBuilder()
                .setCustomId("prisoners")
                .setLabel(s.prisoners)
                .setDisabled(prisoners.length === 0)
                .setStyle(discord_js_1.ButtonStyle.Secondary);
            const buttonEscape = new discord_js_1.ButtonBuilder()
                .setCustomId("escape")
                .setLabel(s.escape)
                .setEmoji(prison.Escape.HasJetpack ? user.GetItemSkin(Items_1.ItemList[Ids_1.ItemId.Jetpack]) : emotes_1.EmoteId.Escape)
                .setDisabled(!user.IsInPrison() || user.Escape.HasTried)
                .setStyle(discord_js_1.ButtonStyle.Secondary);
            const buttonBribe = new discord_js_1.ButtonBuilder()
                .setCustomId("bribe")
                .setLabel(s.bribe)
                .setEmoji(badges_1.EmoteBadgeString.Season6.Politician)
                .setDisabled(!user.IsInPrison() || user.Prison.HasPaidBribe)
                .setStyle(discord_js_1.ButtonStyle.Secondary);
            addContainerHeader();
            container
                .addSectionComponents(escape => escape
                .addTexts([
                s.descriptionEscape(prison.Escape.BaseChance + userClassModifier + gangModifier, prison.Escape.BaseJetpackChance + prison.Escape.BaseChance + userClassModifier + gangModifier, user.GetItemSkin(Items_1.ItemList[Ids_1.ItemId.Jetpack])),
            ])
                .setButtonAccessory(buttonEscape))
                .addLargeSeparator()
                .addSectionComponents(bribe => bribe
                .addTexts([
                s.descriptionBribe,
            ])
                .setButtonAccessory(buttonBribe))
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
            const response = await (0, discordInteractions_1.replyWithContainer)(interaction, container);
            const collector = (0, collectors_1.createButtonCollector)(interaction, response, { idleTime: 30_000 });
            let isProcessing = false;
            collector?.on("collect", async (btn) => {
                if (isProcessing)
                    return;
                isProcessing = true;
                try {
                    await (0, discordInteractions_1.deferUpdate)(btn);
                    if (btn.customId === "back") {
                        await generateDefaultContainer();
                        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                    }
                    else if (btn.customId === "prisoners") {
                        buttonPrisoners.setDisabled(true);
                        const pagination = new Pagination_1.Pagination(interaction, user.Language);
                        pagination.HowManyRecords = prisoners.length;
                        pagination.Limit = 10;
                        const containerPrisoners = new CustomContainerBuilder_1.CustomContainerBuilder()
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
                                    `### ${Classes_1.ClassList[prisoner.class].Image.Emote.String} ${prisoner.nickname}`,
                                    `${s.free} ${(0, discord_js_1.time)(prisoner.prisonTime, discord_js_1.TimestampStyles.RelativeTime)} • ${s.howManyTimesPrison(prisoner.robberyFailureCount)} • ${s.howManyTimesEscape(prisoner.escapeCount)}`,
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
                            if (reason === Prison_1.PrisonFailureReason.BribeNotInPrison) {
                                message = s.bribeNotInPrison;
                            }
                            else if (reason === Prison_1.PrisonFailureReason.EscapeHasTried) {
                                message = s.escapeHasTried;
                            }
                            else if (reason === Prison_1.PrisonFailureReason.EscapeEscaping) {
                                message = s.escapeEscaping;
                            }
                            else if (reason === Prison_1.PrisonFailureReason.EscapeInHospital) {
                                message = s.escapeInHospital(user.Hospital.Time);
                            }
                            else if (reason === Prison_1.PrisonFailureReason.AttackerIsBeingRobbedById) {
                                message = Language_1.globalStrings[user.Language].attackerIsBeingRobbedById(`${Classes_1.ClassList[attacker.class].Image.Emote.String} ${attacker.nickname}`);
                            }
                            else if (reason === Prison_1.PrisonFailureReason.AttackerIsBeatingId) {
                                message = Language_1.globalStrings[user.Language].attackerIsBeatingId(`${Classes_1.ClassList[attacker.class].Image.Emote.String} ${attacker.nickname}`);
                            }
                            else if (reason === Prison_1.PrisonFailureReason.AttackerIsBeingBeatedById) {
                                message = Language_1.globalStrings[user.Language].attackerIsBeingBeatedById(`${Classes_1.ClassList[attacker.class].Image.Emote.String} ${attacker.nickname}`);
                            }
                            container = (0, ui_1.defaultComponent)({
                                user: user,
                                color: colors_1.CrColors.Police,
                                description: `${message} ${emotes_1.EmoteString.Prison}`,
                                footer: (0, ui_1.formatMoney)(user.Money, user.Language),
                            });
                            return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                        }
                        if (!await prison.StartEscape()) {
                            container = (0, ui_1.defaultComponent)({
                                user: user,
                                color: colors_1.CrColors.Police,
                                description: `${s.escapeHasTried} ${emotes_1.EmoteString.Prison}`,
                                footer: (0, ui_1.formatMoney)(user.Money, user.Language),
                            });
                            return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                        }
                        const emote = prison.Escape.HasJetpack ? user.GetItemSkin(Items_1.ItemList[Ids_1.ItemId.Jetpack]) : emotes_1.EmoteString.Escape;
                        addContainerHeader();
                        container
                            .addTexts([
                            `### ${emote} ${s.escapeInProgress}`,
                        ], 1)
                            .addFooter();
                        await (0, discordInteractions_1.replyWithContainer)(interaction, container);
                        // Poll until the backend finishes the escape, with a timeout bound
                        const escapeTimeout = prison.Escape.DefaultDuration * 1_000 * 2 + 10_000;
                        const pollStart = Date.now();
                        while (Date.now() - pollStart < escapeTimeout) {
                            await (0, promises_1.setTimeout)(500);
                            await user.GetInfo();
                            if (!user.IsEscaping())
                                break;
                        }
                        if (user.IsEscaping()) {
                            log_1.Log.Warning(`Timed out waiting for escape resolution for user ${user.Id}.`);
                            container.changeFooterText(s.escapePending);
                            return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                        }
                        // Re-create Prison instance with fresh user data to avoid stale state
                        const freshPrison = new Prison_1.Prison(user);
                        const success = !user.IsInPrison();
                        const totalTime = freshPrison.calculateTotalTime();
                        const message = freshPrison.generateEscapeMessage(success, totalTime, user.Language);
                        if (success) {
                            container
                                .changeTextFromSectionId(1, `### ${emote} ${s.escapeSuccess}\n${message}`)
                                .changeFooterText(s.escapeWaitMinutes(Prison_1.Prison.EscapeTimeInMinutesWanted));
                        }
                        else {
                            container
                                .changeTextFromSectionId(1, `### ${emote} ${s.escapeFailure}\n${message}\n-# ${s.free} ${(0, discord_js_1.time)(user.Prison.Time, discord_js_1.TimestampStyles.RelativeTime)}`);
                        }
                        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                    }
                    else if (btn.customId === "bribe") {
                        await user.GetInfo();
                        const { canBribe, reason, attacker } = await prison.CanBribe();
                        if (!canBribe) {
                            let message = "";
                            if (reason === Prison_1.PrisonFailureReason.BribeHasPaid) {
                                message = s.bribeHasPaid;
                            }
                            else if (reason === Prison_1.PrisonFailureReason.BribeNotInPrison) {
                                message = s.bribeNotInPrison;
                            }
                            else if (reason === Prison_1.PrisonFailureReason.BribeEscaping) {
                                message = s.bribeEscaping;
                            }
                            else if (reason === Prison_1.PrisonFailureReason.BribeInHospital) {
                                message = s.bribeInHospital(user.Hospital.Time);
                            }
                            else if (reason === Prison_1.PrisonFailureReason.AttackerIsBeingRobbedById) {
                                message = Language_1.globalStrings[user.Language].attackerIsBeingRobbedById(`${Classes_1.ClassList[attacker.class].Image.Emote.String} ${attacker.nickname}`);
                            }
                            else if (reason === Prison_1.PrisonFailureReason.AttackerIsBeatingId) {
                                message = Language_1.globalStrings[user.Language].attackerIsBeatingId(`${Classes_1.ClassList[attacker.class].Image.Emote.String} ${attacker.nickname}`);
                            }
                            else if (reason === Prison_1.PrisonFailureReason.AttackerIsBeingBeatedById) {
                                message = Language_1.globalStrings[user.Language].attackerIsBeingBeatedById(`${Classes_1.ClassList[attacker.class].Image.Emote.String} ${attacker.nickname}`);
                            }
                            container = (0, ui_1.defaultComponent)({
                                user: user,
                                color: colors_1.CrColors.Police,
                                description: `${message} ${emotes_1.EmoteString.Prison}`,
                                footer: (0, ui_1.formatMoney)(user.Money, user.Language),
                            });
                            return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                        }
                        const bribeValue = prison.CalculateBribeValue();
                        addContainerHeader();
                        container
                            .addTexts([
                            `### ${badges_1.EmoteBadgeString.Season6.Politician} ${s.bribe}`,
                            `${s.briberyStart(bribeValue)}`,
                        ])
                            .addButtonRow(btn => btn
                            .setCustomId("back")
                            .setLabel(s.back)
                            .setStyle(discord_js_1.ButtonStyle.Secondary), btn => btn
                            .setCustomId("confirmBribe")
                            .setLabel(s.confirm)
                            .setDisabled(user.Money < bribeValue)
                            .setStyle(discord_js_1.ButtonStyle.Success))
                            .addFooter({
                            text: (0, ui_1.formatMoney)(user.Money, user.Language),
                        });
                        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                    }
                    else if (btn.customId === "confirmBribe") {
                        await user.GetInfo();
                        const { canBribe, reason, attacker } = await prison.CanBribe();
                        if (!canBribe) {
                            let message = "";
                            if (reason === Prison_1.PrisonFailureReason.BribeHasPaid) {
                                message = s.bribeHasPaid;
                            }
                            else if (reason === Prison_1.PrisonFailureReason.BribeNotInPrison) {
                                message = s.bribeNotInPrison;
                            }
                            else if (reason === Prison_1.PrisonFailureReason.BribeEscaping) {
                                message = s.bribeEscaping;
                            }
                            else if (reason === Prison_1.PrisonFailureReason.BribeInHospital) {
                                message = s.bribeInHospital(user.Hospital.Time);
                            }
                            else if (reason === Prison_1.PrisonFailureReason.AttackerIsBeingRobbedById) {
                                message = Language_1.globalStrings[user.Language].attackerIsBeingRobbedById(`${Classes_1.ClassList[attacker.class].Image.Emote.String} ${attacker.nickname}`);
                            }
                            else if (reason === Prison_1.PrisonFailureReason.AttackerIsBeatingId) {
                                message = Language_1.globalStrings[user.Language].attackerIsBeatingId(`${Classes_1.ClassList[attacker.class].Image.Emote.String} ${attacker.nickname}`);
                            }
                            else if (reason === Prison_1.PrisonFailureReason.AttackerIsBeingBeatedById) {
                                message = Language_1.globalStrings[user.Language].attackerIsBeingBeatedById(`${Classes_1.ClassList[attacker.class].Image.Emote.String} ${attacker.nickname}`);
                            }
                            container = (0, ui_1.defaultComponent)({
                                user: user,
                                color: colors_1.CrColors.Police,
                                description: `${message} ${emotes_1.EmoteString.Prison}`,
                                footer: (0, ui_1.formatMoney)(user.Money, user.Language),
                            });
                            return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                        }
                        const success = await prison.PayBribery(prison.Bribe.Value);
                        addContainerHeader();
                        if (success) {
                            container
                                .addTexts([
                                `### ${emotes_1.EmoteString.Police} ${s.briberyAccepted}`,
                                s.briberyAcceptedDescription,
                            ])
                                .addFooter({ text: `${s.briberyAcceptedFooter} • ${(0, ui_1.formatMoney)(user.Money, user.Language)}` });
                        }
                        else {
                            container
                                .addTexts([
                                `### ${emotes_1.EmoteString.Police} ${s.briberyRejected}`,
                                s.briberyRejectedDescription,
                            ])
                                .addFooter({ text: `${s.briberyRejectedFooter} • ${(0, ui_1.formatMoney)(user.Money, user.Language)}` });
                        }
                        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                    }
                }
                finally {
                    isProcessing = false;
                }
            });
            collector?.on("end", async () => {
                await (0, collectors_1.disableButtons)(interaction, container);
            });
        };
        await generateContainer();
    },
};
const Strings = {
    [Language_1.Language.English]: {
        userFree: "You are free!",
        userWanted: (timerEscape) => `You are being wanted by the police! You can rob again ${(0, discord_js_1.time)(timerEscape, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Police}`,
        userPrison: (timerPrison) => `You are in prison! You will be released ${(0, discord_js_1.time)(timerPrison, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Prison}`,
        title: "Prison",
        subtitle: `When trying to rob someone and failing, you will be imprisoned for a time determined by your ${emotes_1.EmoteString.Attack}ATK.

-# Being imprisoned limits many of your actions in the game, such as working, investing, betting, scavenging, and of course, stealing.`,
        descriptionEscape: (chance, jetpackChance, jetpackEmote) => `### ${emotes_1.EmoteString.Escape} Escape\nYou have a ${chance}% (${jetpackChance}% if you have a ${jetpackEmote} **${Items_1.ItemList[Ids_1.ItemId.Jetpack].Description[Language_1.Language.English]}**) chance of escaping from prison!`,
        descriptionBribe: `### ${badges_1.EmoteBadgeString.Season6.Politician} Bribe\nThe guards are greedy, and the higher your ${emotes_1.EmoteString.Attack}ATK, the more they will ask for! They can also refuse your bribe, but they will keep your money.`,
        currentChance: "Current chance",
        prisoners: "Prisoners",
        escape: "Escape",
        bribe: "Bribe",
        briberyStart: (value) => `_"We know you have some money hidden there... Give us **${(0, ui_1.formatMoney)(value, Language_1.Language.English)}** and we'll let you out quietly."_\n-# Confirm payment?`,
        briberyAccepted: "Bribery accepted",
        briberyAcceptedDescription: "_\"That's how it's done! Get out of here before anyone else sees you.\"_",
        briberyAcceptedFooter: `Wait ${Prison_1.Prison.BribeTimeInMinutesWanted} minutes to do something stupid`,
        briberyRejected: "Bribery rejected",
        briberyRejectedDescription: "_\"Damn dude, you have to be really stupid to pay that amount and think we would release you.\"_",
        briberyRejectedFooter: "You will remain imprisoned",
        free: "Free",
        confirm: "Confirm",
        back: "Go back",
        howManyTimesPrison: (times) => `Imprisoned \`${times}\` times`,
        howManyTimesEscape: (times) => `Escaped \`${times}\` times`,
        escapeHasTried: `The police are watching you! ${emotes_1.EmoteString.Police}\n-# You won't be able to escape`,
        escapeEscaping: `You are already trying to escape! ${emotes_1.EmoteString.Escape}\n-# This kind of thing requires patience`,
        bribeHasPaid: `We won't accept anything from you, smartass! ${emotes_1.EmoteString.Police}\n-# "Maybe next time you stop being an idiot"`,
        bribeNotInPrison: `You are not in prison! ${emotes_1.EmoteString.Prison}\n-# "But we can lock you in. What do you think?"`,
        bribeEscaping: `You are trying to escape and cannot bribe! ${emotes_1.EmoteString.Escape}\n-# Focus!`,
        escapeInHospital: (date) => `You can't escape while you are hospitalized! ${emotes_1.EmoteString.Hospital}\n-# You will be healed ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)}!`,
        bribeInHospital: (date) => `You can't bribe while you are hospitalized! ${emotes_1.EmoteString.Hospital}\n-# You will be healed ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)}!`,
        escapeInProgress: `Escape in progress ${emotes_1.EmoteString.Waiting}`,
        escapePending: "The result is still being processed. Check the prison again shortly.",
        escapeSuccess: "Successful escape!",
        escapeFailure: "Failed escape!",
        escapeWaitMinutes: (minutes) => `Wait ${minutes} minutes to steal again`,
        escapeWillBeInPrison: (minutes) => `You will be imprisoned for another ${minutes} minutes.`,
    },
    [Language_1.Language.Portuguese]: {
        userFree: "Você está livre!",
        userWanted: (timerEscape) => `Você está sendo procurado pela polícia! Poderá roubar novamente ${(0, discord_js_1.time)(timerEscape, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Police}`,
        userPrison: (timerPrison) => `Você está preso! Será solto ${(0, discord_js_1.time)(timerPrison, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Prison}`,
        title: "Prisão",
        subtitle: `Ao tentar roubar alguém e falhar, você será preso por um tempo determinado pelo seu ${emotes_1.EmoteString.Attack}ATK.

-# Estar preso limita muitas de suas ações no jogo, como trabalhar, investir, apostar, vasculhar, e claro, roubar.`,
        descriptionEscape: (chance, jetpackChance, jetpackEmote) => `### ${emotes_1.EmoteString.Escape} Fugir\nVocê tem ${chance}% (${jetpackChance}% se possuir uma ${jetpackEmote} **${Items_1.ItemList[Ids_1.ItemId.Jetpack].Description[Language_1.Language.Portuguese]}**) de chance de fugir da prisão!`,
        descriptionBribe: `### ${badges_1.EmoteBadgeString.Season6.Politician} Subornar\nOs guardas são gananciosos, e quanto maior o seu ${emotes_1.EmoteString.Attack}ATK, mais eles pedirão! Eles também podem recusar seu suborno, mas ficarão com seu dinheiro.`,
        currentChance: "Chance atual",
        prisoners: "Prisioneiros",
        escape: "Fugir",
        bribe: "Subornar",
        briberyStart: (value) => `_"Sabemos que você tem um certo dinheiro escondido aí... Nos dê **${(0, ui_1.formatMoney)(value, Language_1.Language.Portuguese)}** e deixaremos você sair de fininho."_\n-# Confirmar pagamento?`,
        briberyAccepted: "Suborno aceito",
        briberyAcceptedDescription: "_\"Assim que se faz! Caia fora daqui antes que mais alguém te veja.\"_",
        briberyAcceptedFooter: `Espere ${Prison_1.Prison.BribeTimeInMinutesWanted} minutos para fazer alguma besteira`,
        briberyRejected: "Suborno recusado",
        briberyRejectedDescription: "_\"Caralho mané, tu tem que ser muito burro pra pagar esse valor e achar que iríamos te liberar.\"_",
        briberyRejectedFooter: "Você continuará preso",
        free: "Livre",
        confirm: "Confirmar",
        back: "Voltar",
        howManyTimesPrison: (times) => `Preso \`${times}\` vezes`,
        howManyTimesEscape: (times) => `Fugiu \`${times}\` vezes`,
        escapeHasTried: `Os policiais estão te observando! ${emotes_1.EmoteString.Police}\n-# Você não conseguirá fugir`,
        escapeEscaping: `Você já está tentando fugir! ${emotes_1.EmoteString.Escape}\n-# Este tipo de coisa pede paciência`,
        bribeHasPaid: `Não aceitaremos nada vindo de você, espertalhão! ${emotes_1.EmoteString.Police}\n-# "Quem sabe na próxima tu deixa de ser idiota"`,
        bribeNotInPrison: `Você não está preso! ${emotes_1.EmoteString.Prison}\n-# "Mas podemos te prender. O que acha?"`,
        bribeEscaping: `Você está tentando escapar e não pode subornar! ${emotes_1.EmoteString.Escape}\n-# "Foco!"`,
        escapeInHospital: (date) => `Você não pode fugir enquanto está hospitalizado! ${emotes_1.EmoteString.Hospital}\n-# Será curado ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)}!`,
        bribeInHospital: (date) => `Você não pode subornar enquanto está hospitalizado! ${emotes_1.EmoteString.Hospital}\n-# Será curado ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)}!`,
        escapeInProgress: `Fuga em andamento ${emotes_1.EmoteString.Waiting}`,
        escapePending: "O resultado ainda está sendo processado. Consulte a prisão novamente em instantes.",
        escapeSuccess: "Fuga bem-sucedida!",
        escapeFailure: "Fuga fracassada!",
        escapeWaitMinutes: (minutes) => `Espere ${minutes} minutos para roubar novamente`,
        escapeWillBeInPrison: (minutes) => `Você ficará preso por mais ${minutes} minutos.`,
    },
    [Language_1.Language.Spanish]: {
        userFree: "¡Estás libre!",
        userWanted: (timerEscape) => `¡Estás siendo buscado por la policía! ¡Puedes robar de nuevo ${(0, discord_js_1.time)(timerEscape, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Police}`,
        userPrison: (timerPrison) => `¡Estás preso! ¡Serás liberado ${(0, discord_js_1.time)(timerPrison, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Prison}`,
        title: "Prisión",
        subtitle: `Al intentar robar a alguien y fallar, serás encarcelado por un tiempo determinado por tu ${emotes_1.EmoteString.Attack}ATK.

-# Estar encarcelado limita muchas de tus acciones en el juego, como trabajar, invertir, apostar, buscar, y por supuesto, robar.`,
        descriptionEscape: (chance, jetpackChance, jetpackEmote) => `### ${emotes_1.EmoteString.Escape} Escapar\nTienes un ${chance}% (${jetpackChance}% si tienes un ${jetpackEmote} **${Items_1.ItemList[Ids_1.ItemId.Jetpack].Description[Language_1.Language.Spanish]}**) de escapar de la prisión!`,
        descriptionBribe: `### ${badges_1.EmoteBadgeString.Season6.Politician} Sobornar\nLos guardias son codiciosos, y cuanto mayor sea tu ${emotes_1.EmoteString.Attack}ATK, más te pedirán! También pueden rechazar tu soborno, pero se quedarán con tu dinero.`,
        currentChance: "Chance actual",
        prisoners: "Prisioneros",
        escape: "Escapar",
        bribe: "Sobornar",
        briberyStart: (value) => `_"Sabemos que tienes algo de dinero escondido ahí... Danos **${(0, ui_1.formatMoney)(value, Language_1.Language.Spanish)}** y te dejaremos salir en silencio."_\n-# ¿Confirmar pago?`,
        briberyAccepted: "Soborno aceptado",
        briberyAcceptedDescription: "_\"¡Así se hace! ¡Lárgate de aquí antes de que alguien más te vea!\"_",
        briberyAcceptedFooter: `Espera ${Prison_1.Prison.BribeTimeInMinutesWanted} minutos para hacer alguna tontería`,
        briberyRejected: "Soborno rechazado",
        briberyRejectedDescription: "_\"¡Joder tío, tienes que ser muy tonto para pagar esa cantidad y pensar que te liberaríamos!\"_",
        briberyRejectedFooter: "Permanecerás encarcelado",
        free: "Libre",
        confirm: "Confirmar",
        back: "Volver",
        howManyTimesPrison: (times) => `Encarcelado \`${times}\` veces`,
        howManyTimesEscape: (times) => `Huyó \`${times}\` veces`,
        escapeHasTried: `¡La policía te está observando! ${emotes_1.EmoteString.Police}\n-# No podrás escapar`,
        escapeEscaping: `¡Ya estás intentando escapar! ${emotes_1.EmoteString.Escape}\n-# Este tipo de cosas requiere paciencia`,
        bribeHasPaid: `¡No aceptaremos nada de ti, listillo! ${emotes_1.EmoteString.Police}\n-# "Quizás la próxima vez dejas de ser idiota"`,
        bribeNotInPrison: `¡No estás en la cárcel! ${emotes_1.EmoteString.Prison}\n-# "Pero podemos encerrarte. ¿Qué te parece?"`,
        bribeEscaping: `¡Estás intentando escapar y no puedes sobornar! ${emotes_1.EmoteString.Escape}\n-# "¡Enfócate!"`,
        escapeInHospital: (date) => `¡No puedes escapar mientras estás hospitalizado! ${emotes_1.EmoteString.Hospital}\n-# ¡Serás curado ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)}!`,
        bribeInHospital: (date) => `¡No puedes sobornar mientras estás hospitalizado! ${emotes_1.EmoteString.Hospital}\n-# ¡Serás curado ${(0, discord_js_1.time)(date, discord_js_1.TimestampStyles.RelativeTime)}!`,
        escapeInProgress: `¡Fuga en progreso ${emotes_1.EmoteString.Waiting}`,
        escapePending: "El resultado sigue en proceso. Consulta la prisión de nuevo en unos instantes.",
        escapeSuccess: "Fuga exitosa!",
        escapeFailure: "Fuga fallida!",
        escapeWaitMinutes: (minutes) => `Espera ${minutes} minutos para robar de nuevo`,
        escapeWillBeInPrison: (minutes) => `Permanecerás encarcelado por otros ${minutes} minutos.`,
    },
};
//# sourceMappingURL=prison.js.map