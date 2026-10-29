"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const collectors_1 = require("#bot/utils/collectors");
const colors_1 = require("#bot/utils/colors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const emotes_1 = require("#bot/utils/emotes");
const ui_1 = require("#bot/utils/ui");
const Language_1 = require("#core/models/Language");
const Scavenge_1 = require("#core/models/Scavenge");
const Classes_1 = require("#core/types/Classes");
const Items_1 = require("#core/types/Items");
const Jobs_1 = require("#core/types/Jobs");
const Scavenge_2 = require("#core/types/Scavenge");
const date_fns_1 = require("date-fns");
const discord_js_1 = require("discord.js");
const promises_1 = require("timers/promises");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("scavenge")
        .setDescription("Many things to find in the most unexpected places")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "vasculhar")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "buscar")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Muitas coisas para encontrar nos lugares mais inesperados")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Muchas cosas por encontrar en los lugares más inesperados"),
    async execute(interaction, user) {
        let container = new CustomContainerBuilder_1.CustomContainerBuilder();
        const thumbnail = "https://media.discordapp.net/attachments/1233604589064818808/1353866194473582592/XeroqueHolmes.png";
        const addMainHeader = () => {
            const s = Strings[user.Language];
            const defaultDescription = `# ${s.title}\n${s.description}`;
            container = new CustomContainerBuilder_1.CustomContainerBuilder()
                .setUser(user)
                .setAccentColor(colors_1.CrColors.Scavenge)
                .addSectionComponents(section => section
                .addTexts([
                defaultDescription,
            ])
                .setThumbnailAccessory(thumb => thumb
                .setURL(thumbnail)))
                .addLargeSeparator();
        };
        const addActionHeader = (text) => {
            container = new CustomContainerBuilder_1.CustomContainerBuilder()
                .setUser(user)
                .setAccentColor(colors_1.CrColors.Scavenge)
                .addTexts([
                `${emotes_1.EmoteString.Scavenge} ${text}`,
            ])
                .addLargeSeparator();
        };
        const addContainerFooter = () => {
            const s = Strings[user.Language];
            container
                .addFooter({
                text: `${(0, ui_1.formatMoney)(user.Money, user.Language)} • ${s.moreAtk}`,
            });
        };
        const generateDefaultContainer = () => {
            const s = Strings[user.Language];
            const places = Object.values(Scavenge_2.ScavengeList);
            addMainHeader();
            let text = `${s.userFree}`;
            if (user.Scavenge.Time > new Date()) {
                text = `${s.userScavengeTime} ${(0, discord_js_1.time)(user.Scavenge.Time, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Scavenge}`;
            }
            else if (user.IsScavenging()) {
                text = s.userScavenging(user.Scavenge.IsScavengingId);
            }
            else if (user.IsWorking()) {
                text = s.userWorking;
            }
            else if (user.IsInRobbery()) {
                text = s.userRobbing;
            }
            else if (user.IsInPrison()) {
                text = s.userPrison(user.Prison.Time);
            }
            else if (user.IsInHospital()) {
                text = s.userHospital(user.Hospital.Time);
            }
            else if (user.IsInCasinoGame()) {
                text = s.casino;
            }
            else if (user.IsDefendingInvestment()) {
                text = s.userDefendingInvestment;
            }
            else if (user.IsParticipatingInGangAction()) {
                text = s.userParticipatingInGangAction;
            }
            for (let i = 0; i < places.length; i++) {
                const place = places[i];
                container
                    .addSectionComponents(section => section
                    .addTexts([
                    `### ${place.Emote.String} ${place.Description[user.Language]}`,
                    place.Subtitle[user.Language],
                ])
                    .setButtonAccessory(new discord_js_1.ButtonBuilder()
                    .setLabel(s.title)
                    .setEmoji(place.Emote.Id)
                    .setStyle(user.Attributes.Attack < place.NeedAttack ? discord_js_1.ButtonStyle.Secondary : discord_js_1.ButtonStyle.Success)
                    .setCustomId(`scavenge${place.Id}`)));
                if (i !== places.length - 1) {
                    container.addLargeSeparator();
                }
            }
            container.addLargeSeparator()
                .addTexts([`-# ${text}`]);
            addContainerFooter();
        };
        const generateContainer = async () => {
            const s = Strings[user.Language];
            generateDefaultContainer();
            const response = await (0, discordInteractions_1.replyWithContainer)(interaction, container);
            const collector = (0, collectors_1.createButtonCollector)(interaction, response);
            collector?.on("collect", async (btn) => {
                await (0, discordInteractions_1.deferUpdate)(btn);
                if (btn.customId === "back") {
                    generateDefaultContainer();
                    return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                }
                else if (btn.customId.includes("scavenge")) {
                    const placeId = Number(btn.customId.replace("scavenge", ""));
                    const place = Scavenge_2.ScavengeList[placeId];
                    const scavenge = new Scavenge_1.Scavenge(user, place.Id);
                    const { canScavenge } = await scavenge.CanScavenge();
                    const hospitalChance = place.Hospital.Chance > 0 ? `${emotes_1.EmoteString.Hospital} ${s.hospitalizationChance}: ${place.Hospital.Chance}%` : "";
                    const prisonChance = place.Prison.Chance > 0 ? ` • ${emotes_1.EmoteString.Prison} ${s.prisonChance}: ${place.Prison.Chance}%` : "";
                    const userClassDurationModifier = (0, Classes_1.getScavengeDurationClassModifier)(user.Class);
                    const rewardMoneyMin = Math.floor(place.Reward.Money.Min * userClassDurationModifier);
                    const rewardMoneyMax = Math.floor(place.Reward.Money.Max * userClassDurationModifier);
                    const textMinToMax = `- ${(0, ui_1.formatMoney)(rewardMoneyMin, user.Language)} - ${(0, ui_1.formatMoney)(rewardMoneyMax, user.Language)}`;
                    const textItems = place.Reward.Items.map(item => {
                        const data = Items_1.ItemList[item.Id];
                        const emote = user.GetItemSkin(data);
                        const hoursOrUnits = data.Type === Items_1.ItemType.Consumable ? "un" : "h";
                        const durationMin = data.Type === Items_1.ItemType.Consumable ? item.Duration.Min + 1 : (item.Duration.Min * userClassDurationModifier).toFixed(1);
                        const durationMax = data.Type === Items_1.ItemType.Consumable ? item.Duration.Max + 1 : (item.Duration.Max * userClassDurationModifier).toFixed(1);
                        return `- ${emote} ${data.Description[user.Language]}: ${durationMin}${hoursOrUnits} - ${durationMax}${hoursOrUnits}`;
                    }).join("\n");
                    const userClassChanceModifier = (0, Classes_1.getScavengeChanceClassModifier)(user.Class);
                    const successChance = place.SuccessChance + userClassChanceModifier;
                    const textChances = place.Hospital.Chance > 0 || place.Prison.Chance > 0 ? `### ${s.chances}: \n${hospitalChance}${prisonChance}` : "";
                    const localeInfoDetailed = [
                        `## ${place.Emote.String} ${place.Description[user.Language]}`,
                        `${s.need} ${emotes_1.EmoteString.Attack}${place.NeedAttack} ATK`,
                        `${successChance}% ${s.success}`,
                        `### ${s.canFind}`,
                        `${textMinToMax}`,
                        `${textItems}`,
                        `${textChances}`,
                    ].join("\n");
                    addMainHeader();
                    container
                        .addSectionComponents(section => section
                        .addTexts([
                        localeInfoDetailed,
                    ])
                        .setButtonAccessory(btn => btn
                        .setLabel(s.title)
                        .setStyle(discord_js_1.ButtonStyle.Success)
                        .setDisabled(!canScavenge || user.Attributes.Attack < place.NeedAttack)
                        .setCustomId(`confirm${place.Id}`)))
                        .addLargeSeparator()
                        .addButtonRow(btn => btn
                        .setLabel(s.back)
                        .setStyle(discord_js_1.ButtonStyle.Secondary)
                        .setCustomId("back"));
                    addContainerFooter();
                    return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                }
                else if (btn.customId.includes("confirm")) {
                    await user.GetInfo();
                    const placeId = Number(btn.customId.replace("confirm", ""));
                    const scavenge = new Scavenge_1.Scavenge(user, placeId);
                    const { canScavenge, reason, attacker, location } = await scavenge.CanScavenge();
                    if (!canScavenge) {
                        let message = "";
                        if (reason === Scavenge_2.ScavengeFailureReason.UserScavengeTime) {
                            message = `${s.willBeAbleAgain} ${(0, discord_js_1.time)(user.Scavenge.Time, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Scavenge}`;
                        }
                        else if (reason === Scavenge_2.ScavengeFailureReason.UserScavenging) {
                            message = `${s.userScavenging(user.Scavenge.IsScavengingId)} ${emotes_1.EmoteString.Scavenge}`;
                        }
                        else if (reason === Scavenge_2.ScavengeFailureReason.UserWorking) {
                            message = s.working(user.Job.EndsIn, user.Job.Id);
                        }
                        else if (reason === Scavenge_2.ScavengeFailureReason.UserPrison) {
                            message = s.prison(user.Prison.Time);
                        }
                        else if (reason === Scavenge_2.ScavengeFailureReason.UserHospital) {
                            message = s.hospital(user.Hospital.Time);
                        }
                        else if (reason === Scavenge_2.ScavengeFailureReason.UserCasino) {
                            message = s.casino;
                        }
                        else if (reason === Scavenge_2.ScavengeFailureReason.UserDefendingInvestment) {
                            message = Language_1.globalStrings[user.Language].attackerIsDefendingInvestment;
                        }
                        else if (reason === Scavenge_2.ScavengeFailureReason.UserParticipatingInGangAction) {
                            message = Language_1.globalStrings[user.Language].attackerIsParticipatingInGangAction;
                        }
                        else if (reason === Scavenge_2.ScavengeFailureReason.AttackerIsBeatingId) {
                            message = Language_1.globalStrings[user.Language].attackerIsBeatingId(`${Classes_1.ClassList[attacker.class].Image.Emote.String} ${attacker.nickname}`);
                        }
                        else if (reason === Scavenge_2.ScavengeFailureReason.AttackerIsBeingBeatedById) {
                            message = Language_1.globalStrings[user.Language].attackerIsBeingBeatedById(`${Classes_1.ClassList[attacker.class].Image.Emote.String} ${attacker.nickname}`);
                        }
                        else if (reason === Scavenge_2.ScavengeFailureReason.AttackerIsRobbingId) {
                            message = Language_1.globalStrings[user.Language].attackerIsRobbingId(`${Classes_1.ClassList[attacker.class].Image.Emote.String} ${attacker.nickname}`);
                        }
                        else if (reason === Scavenge_2.ScavengeFailureReason.AttackerIsBeingRobbedById) {
                            message = Language_1.globalStrings[user.Language].attackerIsBeingRobbedById(`${Classes_1.ClassList[attacker.class].Image.Emote.String} ${attacker.nickname}`);
                        }
                        else if (reason === Scavenge_2.ScavengeFailureReason.AttackerIsRobbingLocationId) {
                            message = Language_1.globalStrings[user.Language].attackerIsRobbingId(location.Name[user.Language]);
                        }
                        container = (0, ui_1.defaultComponent)({
                            user: user,
                            color: colors_1.CrColors.Scavenge,
                            description: message,
                        });
                        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                    }
                    const place = Scavenge_2.ScavengeList[placeId];
                    const placeName = `${place.Emote.String} **${place.Description[user.Language]}**`;
                    addActionHeader(s.scavengeStart);
                    container
                        .addTexts([
                        `${s.scavenging} ${placeName} ${emotes_1.EmoteString.Waiting}`,
                    ])
                        .addFooter({
                        text: (0, ui_1.formatMoney)(user.Money, user.Language),
                    });
                    await (0, discordInteractions_1.replyWithContainer)(interaction, container);
                    await scavenge.StartScavenge();
                    await (0, promises_1.setTimeout)(10_000 + (2_000 * placeId));
                    const result = await scavenge.EndScavenge();
                    if (result.success && result.rewardDescription) {
                        addActionHeader(s.scavengeEndSuccess);
                        container
                            .addTexts([
                            `### ${emotes_1.EmoteString.Victory} ${s.success}!`,
                            `${s.youFound(result.rewardDescription)} ${placeName} ${emotes_1.EmoteString.Scavenge}`,
                            `-# ${s.willBeAbleAgain} ${(0, discord_js_1.time)((0, date_fns_1.addHours)(new Date(), 1), discord_js_1.TimestampStyles.RelativeTime)}`,
                        ])
                            .addFooter({
                            text: (0, ui_1.formatMoney)(user.Money, user.Language),
                        });
                    }
                    else {
                        let hospitalText = "";
                        let prisonText = "";
                        if (result.hospitalized && result.hospitalTime) {
                            hospitalText = `\n-# ${emotes_1.EmoteString.Hospital} ${place.Hospital.Text[user.Language]} ${s.hospitalized} ${(0, discord_js_1.time)(result.hospitalTime, discord_js_1.TimestampStyles.RelativeTime)}.`;
                        }
                        else if (result.inprisoned && result.prisonTime) {
                            prisonText = `\n-# ${emotes_1.EmoteString.Prison} ${place.Prison.Text[user.Language]} ${s.inprisoned} ${(0, discord_js_1.time)(result.prisonTime, discord_js_1.TimestampStyles.RelativeTime)}.`;
                        }
                        addActionHeader(s.scavengeEndFailure);
                        container
                            .addTexts([
                            `### ${emotes_1.EmoteString.Defeat} ${s.failure}!`,
                            `${s.youDidntFound} ${placeName} ${emotes_1.EmoteString.Scavenge}${hospitalText}${prisonText}`,
                        ])
                            .addFooter();
                    }
                    return (0, discordInteractions_1.replyWithContainer)(interaction, container);
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
        moreAtk: `Get more ${emotes_1.EmoteString.Attack}ATK to unlock more places`,
        title: "Scavenge",
        userFree: "You can scavenge!",
        userScavengeTime: "You will be able to scavenge again",
        userWorking: `You cannot scavenge while working! ${emotes_1.EmoteString.Jobs}`,
        userRobbing: `You cannot scavenge while in a robbery! ${emotes_1.EmoteString.Robbery}`,
        userPrison: (timerPrison) => `You cannot scavenge while in prison! You will be released ${(0, discord_js_1.time)(timerPrison, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Prison}`,
        userHospital: (timerHospital) => `You cannot scavenge while hospitalized! You will be healed ${(0, discord_js_1.time)(timerHospital, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Hospital}`,
        description: "I'm looking for brave people who aren't afraid to enter dirty and dangerous places. Many good things can be found!\n-# You can scavenge once every hour.",
        canFind: "You can find:",
        chances: "Chances",
        back: "Go back",
        success: "Success",
        failure: "Failure",
        hospitalizationChance: "Hospitalization",
        prisonChance: "Prison",
        need: "Needed",
        more: "More information",
        less: "Less information",
        userScavenging: (placeId) => `You are already scavenging ${Scavenge_2.ScavengeList[placeId].Emote.String} **${Scavenge_2.ScavengeList[placeId].Description[Language_1.Language.English]}**!`,
        working: (jobTime, jobId) => `You cannot scavenge while working! ${emotes_1.EmoteString.Jobs}\n-# Your job of **${Jobs_1.JobList[jobId].Description[Language_1.Language.English]}** will end ${(0, discord_js_1.time)(jobTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        prison: (prisonTime) => `You cannot scavenge while in prison! ${emotes_1.EmoteString.Prison}\n-# Will be released ${(0, discord_js_1.time)(prisonTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        isWanted: (scavengeTime) => `You cannot scavenge while wanted by the police! ${emotes_1.EmoteString.Police}\n-# You can scavenge again ${(0, discord_js_1.time)(scavengeTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        hospital: (hospitalTime) => `You cannot scavenge while hospitalized! ${emotes_1.EmoteString.Hospital}\n-# Will be healed ${(0, discord_js_1.time)(hospitalTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        casino: `You can't scavenge while playing in casino! ${emotes_1.EmoteString.Casino}`,
        scavenging: "Scavenging",
        scavengeStart: "Scavenge in progress",
        scavengeEndSuccess: "Scavenge successful",
        scavengeEndFailure: "Scavenge unsuccessful",
        youFound: (item) => `You found **${item}** while scavenging`,
        youDidntFound: "You didn't find anything while scavenging",
        willBeAbleAgain: "Will be able to scavenge again",
        hospitalized: "Will be healed",
        inprisoned: "Will be released",
        userDefendingInvestment: `You cannot scavenge while defending an investment! ${emotes_1.EmoteString.InvestmentActive}`,
        userParticipatingInGangAction: `You cannot scavenge while participating in a gang action! ${emotes_1.EmoteString.Gang}`,
    },
    [Language_1.Language.Portuguese]: {
        moreAtk: `Tenha mais ${emotes_1.EmoteString.Attack}ATK para liberar mais lugares`,
        title: "Vasculhar",
        userFree: "Você pode vasculhar!",
        userScavengeTime: "Você poderá vasculhar novamente",
        userWorking: `Você não pode vasculhar enquanto trabalha! ${emotes_1.EmoteString.Jobs}`,
        userRobbing: `Você não pode vasculhar enquanto está em um roubo! ${emotes_1.EmoteString.Robbery}`,
        userPrison: (timerPrison) => `Você não pode vasculhar enquanto está preso! Será solto ${(0, discord_js_1.time)(timerPrison, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Prison}`,
        userHospital: (timerHospital) => `Você não pode vasculhar enquanto está hospitalizado! Será curado ${(0, discord_js_1.time)(timerHospital, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Hospital}`,
        description: "Procuro pessoas corajosas e sem nojo de entrar em locais sujos e perigosos. Muitas coisas boas podem ser encontradas!\n-# Você pode vasculhar uma vez a cada hora.",
        canFind: "Pode encontrar:",
        chances: "Chances",
        back: "Voltar",
        success: "Sucesso",
        failure: "Falha",
        hospitalizationChance: "Hospitalização",
        prisonChance: "Prisão",
        need: "Necessário",
        more: "Mais informações",
        less: "Menos informações",
        userScavenging: (placeId) => `Você já está vasculhando ${Scavenge_2.ScavengeList[placeId].Emote.String} **${Scavenge_2.ScavengeList[placeId].Description[Language_1.Language.Portuguese]}**!`,
        working: (jobTime, jobId) => `Você não pode vasculhar enquanto está trabalhando! ${emotes_1.EmoteString.Jobs}\n-# Terminará seu trabalho de **${Jobs_1.JobList[jobId].Description[Language_1.Language.Portuguese]}** ${(0, discord_js_1.time)(jobTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        prison: (prisonTime) => `Você não pode vasculhar enquanto está preso! ${emotes_1.EmoteString.Prison}\n-# Será solto ${(0, discord_js_1.time)(prisonTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        isWanted: (scavengeTime) => `Você não pode vasculhar enquanto está sendo procurado pela polícia! ${emotes_1.EmoteString.Police}\n-# Poderá vasculhar novamente ${(0, discord_js_1.time)(scavengeTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        hospital: (hospitalTime) => `Você não pode vasculhar enquanto está hospitalizado! ${emotes_1.EmoteString.Hospital}\n-# Será curado ${(0, discord_js_1.time)(hospitalTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        casino: `Você não pode vasculhar enquanto está jogando no cassino! ${emotes_1.EmoteString.Casino}`,
        scavenging: "Vasculhando",
        scavengeStart: "Vasculho em andamento",
        scavengeEndSuccess: "Vasculho bem-sucedido",
        scavengeEndFailure: "Vasculho mal-sucedido",
        youFound: (item) => `Você encontrou **${item}** enquanto vasculhava`,
        youDidntFound: "Você não encontrou nada enquanto vasculhava",
        willBeAbleAgain: "Poderá vasculhar novamente",
        hospitalized: "Será curado",
        inprisoned: "Será solto",
        userDefendingInvestment: `Você não pode vasculhar enquanto defende um investimento! ${emotes_1.EmoteString.InvestmentActive}`,
        userParticipatingInGangAction: `Você não pode vasculhar enquanto participa de uma ação de gangue! ${emotes_1.EmoteString.Gang}`,
    },
    [Language_1.Language.Spanish]: {
        moreAtk: `Obtén más ${emotes_1.EmoteString.Attack}ATK para desbloquear más lugares`,
        title: "Buscar",
        userFree: "¡Puedes buscar!",
        userScavengeTime: "Podrás buscar de nuevo",
        userWorking: `¡No puedes navegar mientras trabajas! ${emotes_1.EmoteString.Jobs}`,
        userRobbing: `¡No puedes buscar mientras estás en un robo! ${emotes_1.EmoteString.Robbery}`,
        userPrison: (timerPrison) => `¡No puedes buscar mientras estés en prisión! Serás liberado ${(0, discord_js_1.time)(timerPrison, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Prison}`,
        userHospital: (timerHospital) => `¡No puedes buscar mientras estás en el hospital! Serás curado ${(0, discord_js_1.time)(timerHospital, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Hospital}`,
        description: "Busco personas valientes que no tengan miedo de entrar en lugares sucios y peligrosos. ¡Muchas cosas buenas pueden encontrarse!\n-# Puedes buscar una vez cada hora.",
        canFind: "Puedes encontrar:",
        chances: "Posibilidades",
        back: "Volver",
        success: "Éxito",
        failure: "Fracaso",
        hospitalizationChance: "Hospitalización",
        prisonChance: "Prisión",
        need: "Necesario",
        more: "Más información",
        less: "Menos información",
        userScavenging: (placeId) => `¡Ya estás buscando en ${Scavenge_2.ScavengeList[placeId].Emote.String} **${Scavenge_2.ScavengeList[placeId].Description[Language_1.Language.Spanish]}**!`,
        working: (jobTime, jobId) => `¡No puedes buscar mientras trabajas! ${emotes_1.EmoteString.Jobs}\n-# ¡Tu trabajo de **${Jobs_1.JobList[jobId].Description[Language_1.Language.Spanish]}** terminará ${(0, discord_js_1.time)(jobTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        prison: (prisonTime) => `¡No puedes buscar mientras estás en prisión! ${emotes_1.EmoteString.Prison}\n-# ¡Serás liberado ${(0, discord_js_1.time)(prisonTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        isWanted: (scavengeTime) => `¡No puedes buscar mientras eres buscado por la policía! ${emotes_1.EmoteString.Police}\n-# ¡Podrás buscar de nuevo ${(0, discord_js_1.time)(scavengeTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        hospital: (hospitalTime) => `¡No puedes buscar mientras estás hospitalizado! ${emotes_1.EmoteString.Hospital}\n-# ¡Serás curado ${(0, discord_js_1.time)(hospitalTime, discord_js_1.TimestampStyles.RelativeTime)}!`,
        casino: `¡No puedes buscar mientras estás jugando en el casino! ${emotes_1.EmoteString.Casino}`,
        scavenging: "Buscando",
        scavengeStart: "Búsqueda en curso",
        scavengeEndSuccess: "Búsqueda exitosa",
        scavengeEndFailure: "Búsqueda fallida",
        youFound: (item) => `Encontraste **${item}** mientras buscabas`,
        youDidntFound: "No encontraste nada mientras buscabas",
        willBeAbleAgain: "Podrás buscar de nuevo",
        hospitalized: "Serás curado",
        inprisoned: "Serás liberado",
        userDefendingInvestment: `¡No puedes buscar mientras defiendes una inversión! ${emotes_1.EmoteString.InvestmentActive}`,
        userParticipatingInGangAction: `¡No puedes buscar mientras participas en una acción de cuadrilla! ${emotes_1.EmoteString.Gang}`,
    },
};
//# sourceMappingURL=scavenge.js.map