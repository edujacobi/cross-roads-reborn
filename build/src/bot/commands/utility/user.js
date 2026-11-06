"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("#bot/client");
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const UserImageCanvasBuilder_1 = require("#bot/ui/builders/UserImageCanvasBuilder");
const collectors_1 = require("#bot/utils/collectors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const emotes_1 = require("#bot/utils/emotes");
const ui_1 = require("#bot/utils/ui");
const userUtils_1 = require("#bot/utils/userUtils");
const Language_1 = require("#core/models/Language");
const UserBadge_1 = require("#core/models/UserBadge");
const Badges_1 = require("#core/types/Badges");
const Classes_1 = require("#core/types/Classes");
const date_fns_1 = require("date-fns");
const discord_js_1 = require("discord.js");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("user")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "usuario")
        .setDescription("Relevant informations about the user!")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "usuario")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Informações relevantes sobre o jogador!")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "¡Información relevante sobre el usuario!")
        .addStringOption(target => target
        .setName("target")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "alvo")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "objetivo")
        .setDescription("The user")
        .setMinLength(3)
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "O usuário")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "El usuario")),
    async execute(interaction, user, language) {
        const nameOrId = interaction.options.getString("target");
        await (0, discordInteractions_1.deferReply)(interaction);
        const target = nameOrId ? await (0, userUtils_1.searchUser)(nameOrId, interaction, language) : user;
        const _user = target ? await (0, client_1.getClient)().users.fetch(target.Id) : interaction.user;
        if (!target) {
            return;
        }
        const s = Strings[language];
        let badges = await UserBadge_1.UserBadge.GetList(target.Id);
        if (target.IsVip()) {
            badges = UserBadge_1.UserBadge.AddVIPBadgeInList(badges, target);
        }
        let badgeText = "";
        badges.forEach(badge => badgeText += `${badge.Emoji} `);
        const now = new Date();
        let currentOption = null;
        const buttonOptions = [{
                id: "hospital",
                label: "Hospital",
                emote: emotes_1.EmoteId.Hospital,
                texts: [
                    `\`${target.Hospital.Count}\` ${s.timesInHospital}`,
                    `\`${(0, ui_1.formatMoney)(target.Hospital.TreatmentSum, user.Language)}\` (\`${target.Hospital.TreatmentCount}\`) ${s.spentInTreatments}`,
                ],
            }, {
                id: "daily",
                label: "Daily",
                emote: emotes_1.EmoteId.Heads,
                texts: [
                    target.CanReceiveDaily() ? s.available : (0, discord_js_1.time)((0, date_fns_1.addDays)(target.Daily.LastReceived, 1), discord_js_1.TimestampStyles.RelativeTime),
                    `\`${target.Daily.CurrentStreak}\` ${s.currentStreak}`,
                    `\`${target.Daily.MaxStreak}\` ${s.maxStreak}`,
                ],
            }, {
                id: "prison",
                label: s.prison,
                emote: emotes_1.EmoteId.Prison,
                texts: [
                    `\`${target.Prison.Count}\` ${s.timesInPrison}`,
                    `\`${target.Escape.Count}\` ${s.escapes}`,
                    `\`${(0, ui_1.formatMoney)(target.Prison.BriberySum, user.Language)}\` (\`${target.Prison.BriberyCount}\`) ${s.inBribery}`,
                ],
            }, {
                id: "robbery",
                label: s.robberies,
                emote: emotes_1.EmoteId.Robbery,
                texts: [
                    target.Wanted.Time > now ? (0, discord_js_1.time)(target.Wanted.Time, discord_js_1.TimestampStyles.RelativeTime) : s.canRob,
                    `\`${(0, ui_1.formatMoney)(target.Robbery.SuccessRobbedSum, user.Language)}\` (\`${target.Robbery.SuccessCount}\`) ${s.robbed}`,
                    `\`${(0, ui_1.formatMoney)(target.Robbery.BeingRobbedSum, user.Language)}\` (\`${target.Robbery.BeingRobbedCount}\`) ${s.robLost}`,
                    `\`${target.Robbery.FailureCount}\` ${s.beatFailure}`,
                ],
            }, {
                id: "beatups",
                label: s.beatUps,
                emote: emotes_1.EmoteId.Beat,
                texts: [
                    target.BeatUp.Time > now ? (0, discord_js_1.time)(target.BeatUp.Time, discord_js_1.TimestampStyles.RelativeTime) : s.canBeat,
                    `\`${target.BeatUp.SuccessCount}\` ${s.beatSuccess}`,
                    `\`${target.BeatUp.FailureCount}\` ${s.beatFailure}`,
                    `\`${target.BeatUp.BeatedUpCount}\` ${s.beatedUp}`,
                ],
            }, {
                id: "casino",
                label: s.casino,
                emote: emotes_1.EmoteId.Casino,
                texts: [
                    `\`${target.Casino.WinCount + target.Casino.LoseCount}\` ${s.games}`,
                    `\`${(0, ui_1.formatMoney)(target.Casino.WinSum, user.Language)}\` (\`${target.Casino.WinCount}\`) ${s.won}`,
                    `\`${(0, ui_1.formatMoney)(target.Casino.LoseSum, user.Language)}\` (\`${target.Casino.LoseCount}\`) ${s.lost}`,
                    `\`${(target.Casino.WinCount / (target.Casino.LoseCount + target.Casino.WinCount) * 100).toFixed(2)}%\` win rate`,
                ],
            }, {
                id: "alms",
                label: s.alms,
                emote: emotes_1.EmoteId.Alms,
                texts: [
                    target.Alms.ReceiveTime > now ? `${s.almsReceive} ${(0, discord_js_1.time)(target.Alms.ReceiveTime, discord_js_1.TimestampStyles.RelativeTime)}` : s.almsCanReceive,
                    target.Alms.GiveTime > now ? `${s.almsGive} ${(0, discord_js_1.time)(target.Alms.GiveTime, discord_js_1.TimestampStyles.RelativeTime)}` : s.almsCanGive,
                    `${(0, ui_1.formatMoney)(target.Alms.ReceivedSum, user.Language)} (\`${target.Alms.ReceivedCount}\`) ${s.almsReceived}`,
                    `${(0, ui_1.formatMoney)(target.Alms.GivenSum, user.Language)} (\`${target.Alms.GivenCount}\`) ${s.almsGiven}`,
                ],
            }, {
                id: "scavenge",
                label: s.scavenge,
                emote: emotes_1.EmoteId.Scavenge,
                texts: [
                    target.Scavenge.Time > now ? (0, discord_js_1.time)(target.Scavenge.Time, discord_js_1.TimestampStyles.RelativeTime) : s.scavengeCan,
                    `\`${target.Scavenge.Found.Items + target.Scavenge.Found.MoneyCount}\` ${s.scavengeFound}`,
                    `\`${target.Scavenge.Found.Failures}\` ${s.scavengeFailures}`,
                    `\`${target.Scavenge.Found.FailureWithHospital}\` ${s.scavengeHospitalizations}`,
                    `\`${target.Scavenge.Found.FailureWithPrison}\` ${s.scavengePrisions}`,
                ],
            }, {
                id: "money",
                label: s.money,
                emote: emotes_1.EmoteId.Bank,
                texts: [
                    `\`${(0, ui_1.formatMoney)(target.Job.ReceivedSum, user.Language)}\` (\`${target.Job.ReceivedCount}\`) ${s.fromJobs}`,
                    `\`${(0, ui_1.formatMoney)(target.Investment.TotalProfit, language)}\` ${s.fromInvestments}`,
                    `\`${(0, ui_1.formatMoney)(target.Shop.SpentSum, user.Language)}\` (\`${target.Shop.SpentCount}\`) ${s.spent}`,
                ],
            }, {
                id: "badges",
                label: s.badges,
                emote: Badges_1.BadgeList[Badges_1.BadgeId.S1Top1Money].Emoji.Id,
                texts: badgeText === "" ? [s.noBadges] : badges.map(badge => `**${Badges_1.BadgeList[badge.BadgeId].Emoji.String} ${Badges_1.BadgeList[badge.BadgeId].Name[language]}**\n-# ${Badges_1.BadgeList[badge.BadgeId].Description[language]}`),
            }];
        const userImage = await new UserImageCanvasBuilder_1.UserImageCanvasBuilder(target, _user.avatarURL({ size: 512 }))
            .SetBadges(badges)
            .SetDecoration(target.AvatarDecoration.Id)
            .GenerateImage();
        const userImageFile = new discord_js_1.AttachmentBuilder(userImage, { name: "user.webp" });
        function addHeader(container = new CustomContainerBuilder_1.CustomContainerBuilder()) {
            if (!target) {
                return container;
            }
            container.setUser(target)
                .addSectionComponents(header => header
                .addTexts([
                `### ${s.title} ${target.Nickname}`,
                badges.length > 0 ? `### ${badgeText}` : "",
                `### ${(0, ui_1.formatMoney)(target.Money, language)}`,
            ].filter(Boolean))
                .setThumbnailAccessory(thumb => thumb
                .setURL("attachment://user.webp")))
                .addTexts([
                `### ${Classes_1.ClassList[target.Class].Image.Emote.String} ${Classes_1.ClassList[target.Class].Name[user.Language]} • ${target.Situation.SimpleEmote}`,
            ])
                .addLargeSeparator();
            return container;
        }
        function generateDefaultContainer() {
            if (!target) {
                return addHeader();
            }
            // separate options in different arrays with length = 5
            const buttonOptionsChunks = [];
            for (let i = 0; i < buttonOptions.length; i += 5) {
                buttonOptionsChunks.push(buttonOptions.slice(i, i + 5));
            }
            const container = addHeader();
            for (const chunk of buttonOptionsChunks) {
                container.addButtonRow(...chunk.map(option => (btn) => btn
                    .setLabel(option.label)
                    .setEmoji(option.emote)
                    .setStyle(discord_js_1.ButtonStyle.Secondary)
                    .setDisabled(option.id === currentOption)
                    .setCustomId(option.id)));
            }
            if (currentOption != null) {
                const info = buttonOptions.find(b => b.id === currentOption);
                if (!info) {
                    return container;
                }
                const emoji = interaction.client.emojis.cache.get(info.emote);
                container
                    .addLargeSeparator()
                    .addTexts([
                    `### ${emoji} ${info.label}`,
                    ...info.texts,
                ]);
            }
            container.addFooter({
                text: `Id: ${target.Id} • ${s.playingSince}: ${target.CreatedAt.toLocaleDateString(interaction.locale)}`,
            });
            return container;
        }
        const files = [];
        if (userImageFile) {
            files.push(userImageFile);
        }
        let container = generateDefaultContainer();
        const response = await (0, discordInteractions_1.replyInteraction)(interaction, {
            components: [container],
            files,
            flags: discord_js_1.MessageFlags.IsComponentsV2,
        });
        const collector = (0, collectors_1.createButtonCollector)(interaction, response);
        collector?.on("end", async () => {
            await (0, collectors_1.disableButtons)(interaction, container);
        });
        collector?.on("collect", async (btn) => {
            await (0, discordInteractions_1.deferUpdate)(btn);
            currentOption = btn.customId;
            container = generateDefaultContainer();
            return (0, discordInteractions_1.replyWithContainer)(interaction, container);
        });
    },
};
const Strings = {
    [Language_1.Language.English]: {
        title: "Informations of",
        situation: "Situation",
        className: "Class",
        available: "Available",
        currentStreak: "current streak",
        maxStreak: "max streak",
        prison: "Prison",
        timesInPrison: "times inprisoned",
        escapes: "escapes",
        inBribery: "in bribery",
        robberies: "Robberies",
        canRob: "Can rob",
        robbed: "robbed",
        robLost: "lost",
        timesInHospital: "times hospitalized",
        spentInTreatments: "in treatments",
        beatUps: "Beat ups",
        canBeat: "Can beat",
        beatSuccess: "successes",
        beatFailure: "failures",
        beatedUp: "times beated up",
        money: "Money",
        fromJobs: "from jobs",
        fromInvestments: "from investments",
        spent: "spent in shops",
        casino: "Casino",
        games: "games",
        won: "won",
        lost: "lost",
        alms: "Alms",
        almsReceive: "Receive",
        almsCanReceive: "Can receive",
        almsGive: "Give",
        almsCanGive: "Can give",
        almsReceived: "received",
        almsGiven: "given",
        scavenge: "Scavenge",
        scavengeCan: "Can scavenge",
        scavengeTries: "tries",
        scavengeItems: "items",
        scavengeFound: "found",
        scavengeMoney: "dinheiro",
        scavengeFailures: "failures",
        scavengeHospitalizations: "hospitalizations",
        scavengePrisions: "prisons",
        badges: "Badges",
        noBadges: "No badges",
        playingSince: "Playing since",
        goBack: "Go back",
    },
    [Language_1.Language.Portuguese]: {
        title: "Informações de",
        situation: "Situação",
        className: "Classe",
        available: "Disponível",
        currentStreak: "sequência atual",
        maxStreak: "sequência máxima",
        prison: "Prisão",
        timesInPrison: "vezes preso",
        escapes: "fugas",
        inBribery: "em suborno",
        robberies: "Roubos",
        canRob: "Pode roubar",
        robbed: "roubados",
        robLost: "perdidos",
        timesInHospital: "vezes hospitalizado",
        spentInTreatments: "em tratamentos",
        beatUps: "Espancamentos",
        canBeat: "Pode espancar",
        beatSuccess: "sucessos",
        beatFailure: "falhas",
        beatedUp: "vezes espancado",
        money: "Dinheiro",
        fromJobs: "de trabalhos",
        fromInvestments: "de investimentos",
        spent: "gastos em lojas",
        casino: "Cassino",
        games: "jogos",
        won: "ganhos",
        lost: "perdidos",
        alms: "Esmola",
        almsReceive: "Receber",
        almsCanReceive: "Pode receber",
        almsGive: "Doar",
        almsCanGive: "Pode doar",
        almsReceived: "recebidos",
        almsGiven: "doados",
        scavenge: "Vasculhar",
        scavengeCan: "Pode vasculhar",
        scavengeTries: "tentativas",
        scavengeItems: "itens",
        scavengeFound: "encontrados",
        scavengeMoney: "dinheiro",
        scavengeFailures: "falhas",
        scavengeHospitalizations: "hospitalizações",
        scavengePrisions: "prisões",
        badges: "Insígnias",
        noBadges: "Sem insígnias",
        playingSince: "Jogando desde",
        goBack: "Voltar",
    },
    [Language_1.Language.Spanish]: {
        title: "Informaciones de",
        situation: "Situación",
        className: "Clase",
        available: "Disponible",
        currentStreak: "racha actual",
        maxStreak: "racha máxima",
        prison: "Prisión",
        timesInPrison: "veces en prisión",
        escapes: "fugas",
        inBribery: "en soborno",
        robberies: "Robos",
        canRob: "Puede robar",
        robbed: "robados",
        robLost: "perdidos",
        timesInHospital: "veces hospitalizado",
        spentInTreatments: "en tratamientos",
        beatUps: "Golpiza",
        canBeat: "Puede golpear",
        beatSuccess: "sucesos",
        beatFailure: "fallos",
        beatedUp: "veces golpeado",
        money: "Dinero",
        fromJobs: "de trabajos",
        fromInvestments: "de inversiones",
        spent: "gastos en tiendas",
        casino: "Casino",
        games: "juegos",
        won: "ganados",
        lost: "perdidos",
        alms: "Limosna",
        almsReceive: "Recibir",
        almsCanReceive: "Puede recibir",
        almsGive: "Dar",
        almsCanGive: "Puede dar",
        almsReceived: "recibidos",
        almsGiven: "dado",
        scavenge: "Buscar",
        scavengeCan: "Puede buscar",
        scavengeTries: "intentos",
        scavengeItems: "artículos",
        scavengeFound: "encontrados",
        scavengeMoney: "dinero",
        scavengeFailures: "fallos",
        scavengeHospitalizations: "hospitalizaciones",
        scavengePrisions: "prisiones",
        badges: "Insignia",
        noBadges: "Sin insignia",
        playingSince: "Jugando desde",
        goBack: "Voltar",
    },
};
//# sourceMappingURL=user.js.map