"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const collectors_1 = require("#bot/utils/collectors");
const colors_1 = require("#bot/utils/colors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const emotes_1 = require("#bot/utils/emotes");
const robberyHelper_1 = require("#bot/utils/robberyHelper");
const ui_1 = require("#bot/utils/ui");
const userUtils_1 = require("#bot/utils/userUtils");
const Language_1 = require("#core/models/Language");
const Pagination_1 = require("#core/models/Pagination");
const LocationRobberyStrategy_1 = require("#core/models/strategies/robbery/LocationRobberyStrategy");
const Classes_1 = require("#core/types/Classes");
const Locations_1 = require("#core/types/Locations");
const discord_js_1 = require("discord.js");
const promises_1 = require("timers/promises");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("rob")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "robar")
        .setDescription("Rob a user or a location")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "roubar")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Roube um usuário ou um lugar")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Robar a un usuario o un lugar")
        .addStringOption(target => target
        .setName("target")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "alvo")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "objetivo")
        .setDescription("The user to rob")
        .setMinLength(3)
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "O usuário para roubar")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "El usuario a robar")),
    async execute(interaction, user, language) {
        await (0, discordInteractions_1.deferReply)(interaction);
        const nameOrId = interaction.options.getString("target");
        const target = nameOrId ? await (0, userUtils_1.searchUser)(nameOrId, interaction, language) : null;
        const s = Strings[language];
        let text = `${s.userFree}`;
        if (user.IsScavenging()) {
            text = s.userScavenging;
        }
        else if (user.IsWorking()) {
            text = s.userWorking;
        }
        else if (user.IsInPrison()) {
            text = s.userPrison(user.Prison.Time);
        }
        else if (user.IsWanted()) {
            text = s.userEscaping(user.Wanted.Time);
        }
        else if (user.IsInHospital()) {
            text = s.userHospital(user.Hospital.Time);
        }
        else if (user.IsInCasinoGame()) {
            text = s.userCasino;
        }
        else if (user.IsInRobbery()) {
            text = s.userRobbing;
        }
        function generateDefaultHeader() {
            return new CustomContainerBuilder_1.CustomContainerBuilder()
                .setUser(user)
                .setAccentColor(colors_1.CrColors.Robbery)
                .addSectionComponents(section => section
                .addTexts([
                `# ${s.title}`,
                s.description,
            ])
                .setThumbnailAccessory(thumb => thumb
                .setURL("https://media.discordapp.net/attachments/691019843159326757/791444366727708672/roubar_20201223201323.png")))
                .addLargeSeparator();
        }
        function generateDefaultContainer() {
            return generateDefaultHeader()
                .addSectionComponents(section => section
                .addTexts([
                `-# ${text}`,
            ])
                .setButtonAccessory(btn => btn
                .setLabel(s.availableLocations)
                .setCustomId("available")
                .setStyle(discord_js_1.ButtonStyle.Secondary)))
                .addFooter({
                text: `${(0, ui_1.formatMoney)(user.Money, language)} • ${user.Situation.Simple}`,
            });
        }
        if (!nameOrId) {
            let robLocationStarted = false;
            let container = generateDefaultContainer();
            const response = await (0, discordInteractions_1.replyWithContainer)(interaction, container);
            const collector = (0, collectors_1.createButtonCollector)(interaction, response);
            collector?.on("end", async () => {
                if (!robLocationStarted) {
                    await (0, collectors_1.disableButtons)(interaction, container);
                }
            });
            const pagination = new Pagination_1.Pagination(interaction, language);
            pagination.HowManyRecords = (0, Locations_1.getLocationList)().length;
            pagination.Limit = 4;
            pagination.CustomizeContainer = async () => {
                const locationList = (0, Locations_1.getLocationList)();
                const currentPageLocations = locationList.slice(pagination.Offset, pagination.Offset + pagination.Limit);
                const container = generateDefaultHeader();
                for (let i = 0; i < currentPageLocations.length; i++) {
                    const location = currentPageLocations[i];
                    container
                        .addSectionComponents(section => section
                        .addTexts([
                        `### ${location.Emote.String} ${location.Name[language]}`,
                        location.Description[language],
                    ])
                        .setButtonAccessory(new discord_js_1.ButtonBuilder()
                        .setLabel(s.title)
                        .setEmoji(location.Emote.Id)
                        .setStyle(location.NeedAttack > user.Attributes.Attack ? discord_js_1.ButtonStyle.Secondary : discord_js_1.ButtonStyle.Success)
                        .setCustomId(`location${location.Id}`)));
                    if (i < currentPageLocations.length - 1) {
                        container.addLargeSeparator();
                    }
                }
                return container;
            };
            collector?.on("collect", async (btn) => {
                await (0, discordInteractions_1.deferUpdate)(btn);
                if (btn.customId === "available" || btn.customId === "next" || btn.customId === "prev") {
                    if (btn.customId === "next") {
                        pagination.Offset += pagination.Limit;
                    }
                    else if (btn.customId === "prev") {
                        pagination.Offset -= pagination.Limit;
                    }
                    container = await pagination.BuildContainerWithRow();
                    return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                }
                else if (btn.customId.includes("location")) {
                    const locationId = Number(btn.customId.replace("location", ""));
                    const location = Locations_1.LocationList[locationId];
                    const robbery = new LocationRobberyStrategy_1.LocationRobberyStrategy(user, locationId);
                    const { canRob } = await robbery.CanRob();
                    const userClassModifier = (0, Classes_1.getRobberyClassModifier)(user.Class);
                    const rewardMin = Math.floor(location.Reward.Min * userClassModifier);
                    const rewardMax = Math.floor(location.Reward.Max * userClassModifier);
                    const textMinToMax = `- ${(0, ui_1.formatMoney)(rewardMin, language)} - ${(0, ui_1.formatMoney)(rewardMax, language)}`;
                    const textSuccess = `${location.SuccessChance}% ${s.success}`;
                    const textNeedAtk = `${s.need} ${emotes_1.EmoteString.Attack}${location.NeedAttack} ATK`;
                    container = generateDefaultHeader()
                        .addSectionComponents(section => section
                        .addTexts([
                        `## ${location.Emote.String} ${location.Name[language]}`,
                        textNeedAtk,
                        textSuccess,
                        `### ${s.canRob}`,
                        textMinToMax,
                    ])
                        .setButtonAccessory(btn => btn
                        .setLabel(s.title)
                        .setStyle(discord_js_1.ButtonStyle.Success)
                        .setDisabled(!canRob || location.NeedAttack > user.Attributes.Attack)
                        .setCustomId(`confirm${locationId}`)))
                        .addLargeSeparator()
                        .addButtonRow(btn => btn
                        .setLabel(s.goBack)
                        .setStyle(discord_js_1.ButtonStyle.Secondary)
                        .setCustomId("available"))
                        .addFooter({
                        text: (0, ui_1.formatMoney)(user.Money, language),
                    });
                    return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                }
                else if (btn.customId.includes("confirm")) {
                    const locationId = Number(btn.customId.replace("confirm", ""));
                    await user.GetInfo();
                    const robbery = new LocationRobberyStrategy_1.LocationRobberyStrategy(user, locationId);
                    const { canRob, message } = await robbery.CanRob();
                    if (!canRob) {
                        container = (0, ui_1.defaultComponent)({
                            user,
                            color: colors_1.CrColors.Robbery,
                            description: message,
                            footer: (0, ui_1.formatMoney)(user.Money, language),
                        });
                        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                    }
                    robLocationStarted = true;
                    const sRL = LocationRobberyStrategy_1.Strings[user.Language];
                    const location = Locations_1.LocationList[locationId];
                    await robbery.LockStates();
                    try {
                        const channelContainer = new CustomContainerBuilder_1.CustomContainerBuilder()
                            .setUser(user)
                            .setAccentColor(colors_1.CrColors.Robbery)
                            .addTexts([
                            `${emotes_1.EmoteString.Robbery} ${sRL.robberyInProgress}`,
                        ], 1)
                            .addLargeSeparator()
                            .addTexts([
                            `${sRL.tryingToRob} ${location.Emote.String} **${location.Name[user.Language]}** ${emotes_1.EmoteString.Waiting}`,
                        ], 50)
                            .addFooter({
                            text: `${(0, ui_1.formatMoney)(user.Money, language)} • ${user.Situation.Simple}`,
                        });
                        await (0, discordInteractions_1.replyWithContainer)(interaction, channelContainer);
                        await (0, promises_1.setTimeout)(10_000 + (5_000 * locationId));
                        const outcome = await robbery.Resolve();
                        const locationEmote = location.Emote.String;
                        const locationName = location.Name[user.Language];
                        if (outcome.success) {
                            const resultTexts = [
                                `### ${emotes_1.EmoteString.Victory} ${sRL.success}!`,
                                sRL.youRobbed((0, ui_1.formatMoney)(outcome.moneyRobbed, user.Language), `${locationEmote} ${locationName}`),
                                `-# ${sRL.willBeAbleAgain} ${(0, discord_js_1.time)(outcome.attackerWantedTime, discord_js_1.TimestampStyles.RelativeTime)}`,
                            ].join("\n");
                            channelContainer.changeTextFromSectionId(50, resultTexts);
                        }
                        else {
                            const prisonTextList = location.Prison.Text;
                            const prisonText = prisonTextList[Math.floor(Math.random() * prisonTextList.length)][user.Language];
                            const resultTexts = [
                                `### ${emotes_1.EmoteString.Defeat} ${sRL.failure}!`,
                                `${sRL.youFailed(`${locationEmote} ${locationName}`)}!`,
                                `-# ${emotes_1.EmoteString.Prison} ${prisonText} ${sRL.prisonTime(outcome.attackerPrisonTime)}`,
                            ].join("\n");
                            channelContainer.changeTextFromSectionId(50, resultTexts);
                        }
                        channelContainer
                            .changeTextFromSectionId(1, `${emotes_1.EmoteString.Robbery} ${sRL.finishedRobberyAttacker(outcome.success)}`)
                            .changeFooterText((0, ui_1.formatMoney)(user.Money, user.Language));
                        await (0, discordInteractions_1.replyWithContainer)(interaction, channelContainer);
                    }
                    finally {
                        await robbery.ReleaseLocks();
                    }
                }
            });
        }
        if (!target) {
            return;
        }
        await (0, robberyHelper_1.runUserRobbery)(interaction, user, target);
    },
};
const Strings = {
    [Language_1.Language.English]: {
        userFree: "You can rob!",
        userScavenging: `You can't rob while scavenging! ${emotes_1.EmoteString.Scavenge}`,
        userWorking: `You can't rob while working! ${emotes_1.EmoteString.Jobs}`,
        userRobbing: `You can't rob while already in a robbery! ${emotes_1.EmoteString.Robbery}`,
        userEscaping: (timerEscape) => `You can't rob while being wanted by the police! You can rob again ${(0, discord_js_1.time)(timerEscape, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Police}`,
        userPrison: (timerPrison) => `You can't rob while in prison! You will be released ${(0, discord_js_1.time)(timerPrison, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Prison}`,
        userHospital: (timerHospital) => `You can't rob while in hospital! You will be healed ${(0, discord_js_1.time)(timerHospital, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Hospital}`,
        userCasino: `You can't rob while playing in casino! ${emotes_1.EmoteString.Casino}`,
        title: `Rob`,
        description: `### Find a target and steal everything!
The higher your ${emotes_1.EmoteString.Attack}ATK, the higher your chances of stealing from other players and the more locations become available. The higher your ${emotes_1.EmoteString.Defense}DEF, the more protected you will be.

If you fail, you will be imprisoned for a time determined by your ${emotes_1.EmoteString.Attack}ATK.
If you succeed, you will be wanted by the police and will have to wait 1 hour to steal again.
There is a small chance the target will also be beaten up!`,
        availableLocations: "Available locations",
        success: "Success",
        goBack: "Go back",
        need: "Needed",
        canRob: "You can rob:",
        next: "Next",
        previous: "Previous",
    },
    [Language_1.Language.Portuguese]: {
        userFree: "Você pode roubar!",
        userScavenging: `Você não pode roubar enquanto vasculha! ${emotes_1.EmoteString.Scavenge}`,
        userWorking: `Você não pode roubar enquanto trabalha! ${emotes_1.EmoteString.Jobs}`,
        userRobbing: `Você não pode roubar enquanto já está em um roubo! ${emotes_1.EmoteString.Robbery}`,
        userEscaping: (timerEscape) => `Você não pode roubar enquanto estiver sendo procurado pela polícia! Poderá roubar novamente ${(0, discord_js_1.time)(timerEscape, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Police}`,
        userPrison: (timerPrison) => `Você não pode roubar enquanto está preso! Será solto ${(0, discord_js_1.time)(timerPrison, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Prison}`,
        userHospital: (timerHospital) => `Você não pode roubar enquanto está hospitalizado! Será curado ${(0, discord_js_1.time)(timerHospital, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Hospital}`,
        userCasino: `Você não pode roubar enquanto está jogando no cassino! ${emotes_1.EmoteString.Casino}`,
        title: `Roubar`,
        description: `### Encontre um alvo e roube tudo!
Quanto maior seu ${emotes_1.EmoteString.Attack}ATK, maiores suas chances de roubo à outros jogadores e mais locais ficam disponíveis. Quanto maior sua ${emotes_1.EmoteString.Defense}DEF, mais protegido você estará.

Se falhar, você será preso por um tempo definido pelo seu ${emotes_1.EmoteString.Attack}ATK.
Se conseguir, será procurado pela polícia e deverá esperar 1 hora para roubar novamente.
Há uma pequena chance do alvo ser também espancado!`,
        availableLocations: "Locais disponíveis",
        success: "Sucesso",
        goBack: "Voltar",
        need: "Necessário",
        canRob: "Pode roubar:",
        next: "Próximo",
        previous: "Anterior",
    },
    [Language_1.Language.Spanish]: {
        userFree: "¡Puedes robar!",
        userScavenging: `¡No puedes robar mientras buscas! ${emotes_1.EmoteString.Scavenge}`,
        userWorking: `¡No puedes robar mientras trabajas! ${emotes_1.EmoteString.Jobs}`,
        userRobbing: `¡No puedes robar mientras ya estás en un robo! ${emotes_1.EmoteString.Robbery}`,
        userEscaping: (timerEscape) => `¡No puedes robar mientras eres perseguido por la policía! ¡Puedes robar de nuevo ${(0, discord_js_1.time)(timerEscape, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Police}`,
        userPrison: (timerPrison) => `¡No puedes robar mientras estás en prisión! ¡Serás liberado ${(0, discord_js_1.time)(timerPrison, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Prison}`,
        userHospital: (timerHospital) => `¡No puedes robar mientras estás en el hospital! ¡Serás curado ${(0, discord_js_1.time)(timerHospital, discord_js_1.TimestampStyles.RelativeTime)} ${emotes_1.EmoteString.Hospital}`,
        userCasino: `¡No puedes robar mientras estás jugando en el casino! ${emotes_1.EmoteString.Casino}`,
        title: `Robar`,
        description: `### ¡Encuentra un objetivo y roba todo!
Cuanto mayor sea tu ${emotes_1.EmoteString.Attack}ATK, mayores serán tus posibilidades de robar a otros jugadores y más lugares estarán disponibles. Cuanto mayor sea tu ${emotes_1.EmoteString.Defense}DEF, más protegido estarás.

Si fallas, serás encarcelado por un tiempo determinado por tu ${emotes_1.EmoteString.Attack}ATK.
Si lo consigues, serás buscado por la policía y tendrás que esperar 1 hora para volver a robar.
¡Hay una pequeña posibilidad de que el objetivo también sea golpeado!`,
        availableLocations: "Lugares disponibles",
        success: "Éxito",
        goBack: "Volver",
        need: "Necesario",
        canRob: "Puedes robar:",
        next: "Siguiente",
        previous: "Anterior",
    },
};
//# sourceMappingURL=rob.js.map