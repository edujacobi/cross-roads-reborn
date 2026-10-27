"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const collectors_1 = require("#bot/utils/collectors");
const colors_1 = require("#bot/utils/colors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const emotes_1 = require("#bot/utils/emotes");
const ui_1 = require("#bot/utils/ui");
const UserRepository_1 = require("#core/repositories/UserRepository");
const BlackMarket_1 = require("#core/models/BlackMarket");
const Event_1 = require("#core/models/Event");
const Language_1 = require("#core/models/Language");
const Classes_1 = require("#core/types/Classes");
const Items_1 = require("#core/types/Items");
const Jobs_1 = require("#core/types/Jobs");
const Locations_1 = require("#core/types/Locations");
const Scavenge_1 = require("#core/types/Scavenge");
const discord_js_1 = require("discord.js");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("jobs")
        .setDescription("Open the job list to work")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "trabalhos")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "trabajos")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Abra a lista de trabalhos para ter um emprego")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Abrir la lista de trabajos para trabajar"),
    async execute(interaction, user, language) {
        await (0, discordInteractions_1.deferReply)(interaction);
        const s = Strings[language];
        let currentPage = 0;
        function addHeader(container = new CustomContainerBuilder_1.CustomContainerBuilder()) {
            container
                .setUser(user)
                .setAccentColor(colors_1.CrColors.Jobs)
                .addSectionComponents(header => header
                .addTexts([
                `# ${s.title}`,
                s.description,
            ])
                .setThumbnailAccessory(thumb => thumb
                .setURL("https://media.discordapp.net/attachments/1233604589064818808/1337166947250602047/Trabalhos2.png")));
            container.addLargeSeparator();
            return container;
        }
        const blackMarket = new BlackMarket_1.BlackMarket(user);
        const { isOpen } = blackMarket.IsBlackMarketOpen();
        const jobList = (isOpen ? (0, Jobs_1.getJobList)() : (0, Jobs_1.getJobList)().filter(jobs => !jobs.Special))
            .sort((a, b) => Number(a.Special) - Number(b.Special));
        const eventActiveValue = await Event_1.Event.GetActiveFromType(Event_1.EventType.JOB_TIME_MULTIPLIER);
        const pages = [];
        for (let i = 0; i < jobList.length; i += 6) {
            pages.push(jobList.slice(i, i + 6));
        }
        async function generateDefaultContainer() {
            await user.GetInfo();
            const container = addHeader();
            const currentPageJobs = pages[currentPage] || [];
            const userClassModifier = (0, Classes_1.getJobClassModifier)(user.Class);
            if (user.IsScavenging()) {
                container.addTexts([s.userScavenging]);
            }
            else if (user.IsInRobbery()) {
                container.addTexts([s.userRobbing]);
            }
            for (let i = 0; i < currentPageJobs.length; i++) {
                const job = currentPageJobs[i];
                const weaponsNeeded = (0, Items_1.getItemList)().filter(item => job.NeedItem?.includes(item.Id));
                const jobDuration = job.Duration * eventActiveValue;
                const jobSalary = Math.round(job.Salary * userClassModifier);
                const hasAllItems = job.NeedItem?.every(neededItem => user.Items.some(userItem => userItem.Id === neededItem));
                const textSalary = `${s.salary}: ${(0, ui_1.formatMoney)(jobSalary, language)}`;
                const textDuration = `${s.duration}: ${jobDuration}h`;
                const textNeeded = weaponsNeeded.length ? `\n-# ${s.necessary}:\n## ${weaponsNeeded.map(weapon => user.GetItemSkin(weapon)).join(" ")}` : "";
                const blackMarketText = job.Special ? ` • ${emotes_1.EmoteString.BlackMarket} ${s.blackMarket}` : "";
                container.addSectionComponents(section => section
                    .addTexts([
                    `### ${job.Description[language]}`,
                    `${textSalary} • ${textDuration}${blackMarketText}${textNeeded}`,
                ])
                    .setButtonAccessory(btn => btn
                    .setLabel(s.start)
                    .setDisabled(!user.IsIdling())
                    .setStyle(job.NeedItem && !hasAllItems ? discord_js_1.ButtonStyle.Secondary : discord_js_1.ButtonStyle.Success)
                    .setCustomId(`start${job.Id}`)));
                if (i != currentPageJobs.length - 1) {
                    container.addLargeSeparator();
                }
            }
            if (pages.length > 1) {
                container
                    .addLargeSeparator()
                    .addButtonRow(btn => btn
                    .setLabel(s.previous)
                    .setStyle(discord_js_1.ButtonStyle.Secondary)
                    .setCustomId("previous")
                    .setEmoji("⬅️")
                    .setDisabled(currentPage === 0), btn => btn
                    .setLabel(s.next)
                    .setStyle(discord_js_1.ButtonStyle.Secondary)
                    .setCustomId("next")
                    .setEmoji("➡️")
                    .setDisabled(currentPage === pages.length - 1));
            }
            if (user.IsWorking()) {
                const job = Jobs_1.JobList[user.Job.Id];
                const jobDuration = job.Duration * eventActiveValue;
                const jobSalary = Math.round(job.Salary * userClassModifier);
                container
                    .addLargeSeparator()
                    .addSectionComponents(working => working
                    .addTexts([
                    s.workingOn(user.Job.Id, user.Job.EndsIn),
                    `-# ${s.salary}: ${(0, ui_1.formatMoney)(jobSalary, language)} • ${s.duration}: ${jobDuration}h`,
                ])
                    .setButtonAccessory(btn => btn
                    .setCustomId("stop")
                    .setLabel(s.stop)
                    .setStyle(discord_js_1.ButtonStyle.Danger)));
            }
            container.addFooter({
                text: (0, ui_1.formatMoney)(user.Money, language),
            });
            return container;
        }
        let container = await generateDefaultContainer();
        const response = await (0, discordInteractions_1.replyWithContainer)(interaction, container);
        const collector = (0, collectors_1.createButtonCollector)(interaction, response);
        collector?.on("collect", async (btn) => {
            await (0, discordInteractions_1.deferUpdate)(btn);
            if (btn.customId.includes("start")) {
                await user.GetInfo();
                const userClassModifier = (0, Classes_1.getJobClassModifier)(user.Class);
                const jobId = Number(btn.customId.replace("start", ""));
                const job = Jobs_1.JobList[jobId];
                const hasAllItems = job.NeedItem?.every(neededItem => user.Items.some(userItem => userItem.Id === neededItem));
                let textResponse = "";
                container = addHeader();
                // TODO: This should be in Model.
                if (user.IsWorking()) {
                    textResponse = s.workingOn(user.Job.Id, user.Job.EndsIn);
                }
                else if (user.IsScavenging()) {
                    textResponse = s.userScavenge(user.Scavenge.IsScavengingId);
                }
                else if (user.IsInPrison()) {
                    textResponse = s.userPrison(user.Prison.Time);
                }
                else if (user.IsInHospital()) {
                    textResponse = s.userHospital(user.Hospital.Time);
                }
                else if (user.IsInCasinoGame()) {
                    textResponse = s.userCasino;
                }
                else if (user.BeatUp.IsBeatingId) {
                    const u = await UserRepository_1.UserRepository.FindById(user.BeatUp.IsBeatingId, ["class", "nickname"]);
                    textResponse = `${s.userIsBeatingId(`${Classes_1.ClassList[u.class].Image.Emote.String} ${u.nickname}`)} ${emotes_1.EmoteString.Beat}`;
                }
                else if (user.BeatUp.IsBeingBeatUpById) {
                    const u = await UserRepository_1.UserRepository.FindById(user.BeatUp.IsBeingBeatUpById, ["class", "nickname"]);
                    textResponse = `${s.userIsBeingBeatedId(`${Classes_1.ClassList[u.class].Image.Emote.String} ${u.nickname}`)} ${emotes_1.EmoteString.Beat}`;
                }
                else if (user.Robbery.IsRobbingId) {
                    const u = await UserRepository_1.UserRepository.FindById(user.Robbery.IsRobbingId, ["class", "nickname"]);
                    textResponse = `${s.userIsRobbingId(`${Classes_1.ClassList[u.class].Image.Emote.String} ${u.nickname}`)} ${emotes_1.EmoteString.Robbery}`;
                }
                else if (user.Robbery.IsBeingRobbedById) {
                    const u = await UserRepository_1.UserRepository.FindById(user.Robbery.IsBeingRobbedById, ["class", "nickname"]);
                    textResponse = `${s.userIsBeingRobbingId(`${Classes_1.ClassList[u.class].Image.Emote.String} ${u.nickname}`)} ${emotes_1.EmoteString.Robbery}`;
                }
                else if (user.Robbery.IsRobbingLocationId !== null) {
                    const location = Locations_1.LocationList[user.Robbery.IsRobbingLocationId];
                    textResponse = `${s.userIsRobbingId(location.Name[language])} ${emotes_1.EmoteString.Robbery}`;
                }
                else if (user.IsDefendingInvestment()) {
                    textResponse = Language_1.globalStrings[language].attackerIsDefendingInvestment;
                }
                else if (user.IsParticipatingInGangAction()) {
                    textResponse = Language_1.globalStrings[language].attackerIsParticipatingInGangAction;
                }
                else if (job.NeedItem && !hasAllItems) {
                    const neededItems = job.NeedItem
                        .filter(neededItem => !user.Items.some(userItem => userItem.Id === neededItem))
                        .map(neededItem => `${user.GetItemSkin(Items_1.ItemList[neededItem])} ${Items_1.ItemList[neededItem].Description[language]}`)
                        .join(", ");
                    textResponse = s.withoutItems(job.Description[language], neededItems);
                }
                if (textResponse != "") {
                    container
                        .addTexts([textResponse])
                        .addButtonRow(btn => btn
                        .setLabel(s.back)
                        .setStyle(discord_js_1.ButtonStyle.Secondary)
                        .setCustomId("back"))
                        .addFooter({
                        text: (0, ui_1.formatMoney)(user.Money, language),
                    });
                    return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                }
                const jobDuration = job.Duration * eventActiveValue;
                const jobSalary = Math.round(job.Salary * userClassModifier);
                await user.StartJob(job.Id);
                container
                    .addTexts([
                    s.jobStarted(job.Description[language], user.Job.EndsIn),
                ])
                    .addButtonRow(btn => btn
                    .setCustomId("stop")
                    .setLabel(s.stop)
                    .setStyle(discord_js_1.ButtonStyle.Danger))
                    .addFooter({
                    text: `${s.salary}: ${(0, ui_1.formatMoney)(jobSalary, language)} • ${s.duration}: ${jobDuration}h`,
                });
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
            else if (btn.customId === "stop") {
                await user.GetInfo();
                container = addHeader();
                if (user.Job.Id === null) {
                    container
                        .addTexts([s.cannotStop])
                        .addButtonRow(btn => btn
                        .setCustomId("back")
                        .setLabel(s.viewJobs)
                        .setStyle(discord_js_1.ButtonStyle.Secondary))
                        .addFooter({
                        text: (0, ui_1.formatMoney)(user.Money, language),
                    });
                    return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                }
                const job = Jobs_1.JobList[user.Job.Id];
                await user.CancelJob();
                container
                    .addTexts([
                    `${s.stopped} **${job.Description[language]}**`,
                ])
                    .addButtonRow(btn => btn
                    .setCustomId("back")
                    .setLabel(s.viewJobs)
                    .setStyle(discord_js_1.ButtonStyle.Secondary))
                    .addFooter({
                    text: (0, ui_1.formatMoney)(user.Money, language),
                });
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
            else if (btn.customId === "previous") {
                currentPage -= 1;
                container = await generateDefaultContainer();
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
            else if (btn.customId === "next") {
                currentPage += 1;
                container = await generateDefaultContainer();
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
            else if (btn.customId === "back") {
                container = await generateDefaultContainer();
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
        });
        collector?.on("end", async () => {
            await (0, collectors_1.disableButtons)(interaction, container);
        });
    },
};
const Strings = {
    [Language_1.Language.English]: {
        idling: "Idling",
        userDefending: `You're defending your investment! ${emotes_1.EmoteString.InvestmentActive}`,
        userParticipating: `You're participating in a gang action! ${emotes_1.EmoteString.Gang}`,
        title: "Jobs",
        description: "You cannot bet, steal or search while working!",
        userScavenging: `You can't start working while scavenging! ${emotes_1.EmoteString.Scavenge}`,
        userRobbing: `You can't start working while robbing! ${emotes_1.EmoteString.Robbery}`,
        userPrison: (timerPrison) => `You are in prison! ${emotes_1.EmoteString.Prison}\n-# You will be released ${(0, discord_js_1.time)(timerPrison, discord_js_1.TimestampStyles.RelativeTime)}`,
        userHospital: (timerHospital) => `You are hospitalized ${emotes_1.EmoteString.Hospital}\n-# You will be attended ${(0, discord_js_1.time)(timerHospital, discord_js_1.TimestampStyles.RelativeTime)}`,
        userCasino: `You are playing in casino! ${emotes_1.EmoteString.Casino}`,
        userIsBeatingId: (nick) => `You're already beating **${nick}**!`,
        userIsBeingBeatedId: (nick) => `You're being beated by **${nick}!`,
        userIsRobbingId: (nick) => `You're already robbing **${nick}**!`,
        userIsBeingRobbingId: (nick) => `You're being robbed by **${nick}**!`,
        workingOn: (jobId, jobTime) => `You are working as **${Jobs_1.JobList[jobId].Description[Language_1.Language.English]}**\n-# Will finish ${(0, discord_js_1.time)(jobTime, discord_js_1.TimestampStyles.RelativeTime)}`,
        userScavenge: (placeId) => `You are scavenging ${Scavenge_1.ScavengeList[placeId].Emote.String} **${Scavenge_1.ScavengeList[placeId].Description[Language_1.Language.English]}**!`,
        stop: "Stop job",
        cannotStop: "You can't stop what you didn't start.",
        stopped: "You stopped your job of",
        salary: "Salary",
        duration: "Duration",
        necessary: "Necessary",
        next: "Next",
        previous: "Previous",
        back: "Go back",
        viewJobs: "View jobs",
        start: "Start",
        blackMarket: "Black Market Job",
        withoutItems: (jobDescription, neededItems) => `You don't have the necessary items to start working as **${jobDescription}**\n-# You need ${neededItems}`,
        jobStarted: (jobDescription, jobTime) => `You started working as **${jobDescription}**\n-# Will finish ${(0, discord_js_1.time)(jobTime, discord_js_1.TimestampStyles.RelativeTime)}`,
    },
    [Language_1.Language.Portuguese]: {
        idling: "Vadiando",
        userDefending: `Você está defendendo seu investimento! ${emotes_1.EmoteString.InvestmentActive}`,
        userParticipating: `Você está participando de uma ação de gangue! ${emotes_1.EmoteString.Gang}`,
        title: "Trabalhos",
        description: `Você não pode apostar, roubar nem vasculhar enquanto trabalha!`,
        userScavenging: `Você não pode começar a trabalhar enquanto vasculha! ${emotes_1.EmoteString.Scavenge}`,
        userRobbing: `Você não pode começar a trabalhar enquanto está em um roubo! ${emotes_1.EmoteString.Robbery}`,
        userPrison: (timerPrison) => `Você está preso! ${emotes_1.EmoteString.Prison}\n-# Será solto ${(0, discord_js_1.time)(timerPrison, discord_js_1.TimestampStyles.RelativeTime)}`,
        userHospital: (timerHospital) => `Você está hospitalizado ${emotes_1.EmoteString.Hospital}\n-# Será atendido ${(0, discord_js_1.time)(timerHospital, discord_js_1.TimestampStyles.RelativeTime)}`,
        userCasino: `Você está jogando no cassino! ${emotes_1.EmoteString.Casino}`,
        userIsBeatingId: (nick) => `Você já está espancando **${nick}**!`,
        userIsBeingBeatedId: (nick) => `Você está sendo espancado por **${nick}**!`,
        userIsRobbingId: (nick) => `Você já está roubando **${nick}**!`,
        userIsBeingRobbingId: (nick) => `Você está sendo roubado por **${nick}**!`,
        workingOn: (jobId, jobTime) => `Você está trabalhando como **${Jobs_1.JobList[jobId].Description[Language_1.Language.Portuguese]}**\n-# Terminará ${(0, discord_js_1.time)(jobTime, discord_js_1.TimestampStyles.RelativeTime)}`,
        userScavenge: (placeId) => `Você está vasculhando ${Scavenge_1.ScavengeList[placeId].Emote.String} **${Scavenge_1.ScavengeList[placeId].Description[Language_1.Language.Portuguese]}**!`,
        stop: "Parar trabalho",
        cannotStop: "Você não pode parar o que não começou.",
        stopped: "Você parou seu trabalho de",
        salary: "Salário",
        duration: "Duração",
        necessary: "Necessário",
        next: "Próximo",
        previous: "Anterior",
        back: "Voltar",
        viewJobs: "Ver trabalhos",
        start: "Iniciar",
        blackMarket: "Trabalho do Mercado Negro",
        withoutItems: (jobDescription, neededItems) => `Você não tem os itens necessários para começar a trabalhar como **${jobDescription}**\n-# Você precisa de ${neededItems}`,
        jobStarted: (jobDescription, jobTime) => `Você começou a trabalhar como **${jobDescription}**\n-# Terminará ${(0, discord_js_1.time)(jobTime, discord_js_1.TimestampStyles.RelativeTime)}`,
    },
    [Language_1.Language.Spanish]: {
        idling: "Vagando",
        userDefending: `¡Estás defendiendo tu inversión! ${emotes_1.EmoteString.InvestmentActive}`,
        userParticipating: `¡Estás participando en una acción de cuadrilla! ${emotes_1.EmoteString.Gang}`,
        title: "Trabajos",
        description: "Tu no puedes apostar, robar o buscar mientras trabajas!",
        userScavenging: `¡No puedes empezar a trabajar mientras buscas! ${emotes_1.EmoteString.Scavenge}`,
        userRobbing: `¡No puedes empezar a trabajar mientras estás en un robo! ${emotes_1.EmoteString.Robbery}`,
        userPrison: (timerPrison) => `¡Estás preso! ${emotes_1.EmoteString.Prison}\n-# ¡Serás liberado ${(0, discord_js_1.time)(timerPrison, discord_js_1.TimestampStyles.RelativeTime)}`,
        userHospital: (timerHospital) => `¡Estás hospitalizado ${emotes_1.EmoteString.Hospital}\n-# Serás atendido ${(0, discord_js_1.time)(timerHospital, discord_js_1.TimestampStyles.RelativeTime)}`,
        userCasino: `¡Estás jugando en el casino! ${emotes_1.EmoteString.Casino}`,
        userIsBeatingId: (nick) => `¡Ya estás golpeando a **${nick}**!`,
        userIsBeingBeatedId: (nick) => `¡Estás siendo golpeado por **${nick}**!`,
        userIsRobbingId: (nick) => `¡Ya estás robando a **${nick}**!`,
        userIsBeingRobbingId: (nick) => `¡Estás siendo robado por **${nick}**!`,
        workingOn: (jobId, jobTime) => `Usted está trabajando como **${Jobs_1.JobList[jobId].Description[Language_1.Language.Spanish]}**\n-# Terminará ${(0, discord_js_1.time)(jobTime, discord_js_1.TimestampStyles.RelativeTime)}`,
        userScavenge: (placeId) => `¡Estás buscando ${Scavenge_1.ScavengeList[placeId].Emote.String} **${Scavenge_1.ScavengeList[placeId].Description[Language_1.Language.Spanish]}**!`,
        stop: "Detener trabajo",
        cannotStop: "Usted no puede detener lo que no comenzó.",
        stopped: "Usted detuvo su trabajo de",
        salary: "Salario",
        duration: "Duración",
        necessary: "Necesario",
        next: "Siguiente",
        previous: "Anterior",
        back: "Volver",
        viewJobs: "Ver trabajos",
        start: "Comenzar",
        blackMarket: "Trabajo del Mercado Negro",
        withoutItems: (jobDescription, neededItems) => `Usted no tiene los elementos necesarios para comenzar a trabajar como **${jobDescription}**\n-# Usted necesita ${neededItems}`,
        jobStarted: (jobDescription, jobTime) => `Usted comenzó a trabajar como **${jobDescription}**\n-# Terminará ${(0, discord_js_1.time)(jobTime, discord_js_1.TimestampStyles.RelativeTime)}.`,
    },
};
//# sourceMappingURL=jobs.js.map