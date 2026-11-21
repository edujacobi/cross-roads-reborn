"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("#bot/client");
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const GangImageCanvasBuilder_1 = require("#bot/ui/builders/GangImageCanvasBuilder");
const UserRankingCardCanvasBuilder_1 = require("#bot/ui/builders/UserRankingCardCanvasBuilder");
const badges_1 = require("#bot/utils/badges");
const beatupHelper_1 = require("#bot/utils/beatupHelper");
const colors_1 = require("#bot/utils/colors");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const emotes_1 = require("#bot/utils/emotes");
const invUtils_1 = require("#bot/utils/invUtils");
const robberyHelper_1 = require("#bot/utils/robberyHelper");
const ui_1 = require("#bot/utils/ui");
const userUtils_1 = require("#bot/utils/userUtils");
const UserRepository_1 = require("#core/repositories/UserRepository");
const GangRepository_1 = require("#core/repositories/GangRepository");
const BeatUp_1 = require("#core/models/BeatUp");
const Gang_1 = require("#core/models/Gang");
const Language_1 = require("#core/models/Language");
const Pagination_1 = require("#core/models/Pagination");
const UserRobberyStrategy_1 = require("#core/models/strategies/robbery/UserRobberyStrategy");
const User_1 = require("#core/models/User");
const GangColors_1 = require("#core/types/GangColors");
const discord_js_1 = require("discord.js");
var TopSubcommand;
(function (TopSubcommand) {
    TopSubcommand["Money"] = "money";
    TopSubcommand["Gamblers"] = "gamblers";
    TopSubcommand["Spenders"] = "spenders";
    TopSubcommand["Thieves"] = "thieves";
    TopSubcommand["Workers"] = "workers";
    TopSubcommand["Drunkers"] = "drunkers";
    TopSubcommand["Beaters"] = "beaters";
    TopSubcommand["Scavengers"] = "scavengers";
    TopSubcommand["Hospital"] = "hospital";
    TopSubcommand["Bribers"] = "bribers";
    TopSubcommand["Escapers"] = "escapers";
    TopSubcommand["Gangs"] = "gangs";
    TopSubcommand["Investors"] = "investors";
})(TopSubcommand || (TopSubcommand = {}));
module.exports = {
    cooldown: 10,
    data: new discord_js_1.SlashCommandBuilder()
        .setName("top")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "top")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "top")
        .setDescription("View various top rankings")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Veja vários rankings de top")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Ver varios rankings de top")
        .addSubcommand(money => money
        .setName(TopSubcommand.Money)
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "grana")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "dinero")
        .setDescription("List the top users with money")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Lista os usuários com mais dinheiro")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Lista de usuarios con más dinero"))
        .addSubcommand(gamblers => gamblers
        .setName(TopSubcommand.Gamblers)
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "apostadores")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "apostadores")
        .setDescription("List of users who have won the most at the casino")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Lista os usuários que mais ganharam no cassino")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Lista de usuarios que más han ganado en el casino"))
        .addSubcommand(spenders => spenders
        .setName(TopSubcommand.Spenders)
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "gastadores")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "gastadores")
        .setDescription("List the users who spend the most in the shops")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Lista os usuários que mais gastaram nas lojas")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Lista de usuarios que más gastan en las tiendas"))
        .addSubcommand(thieves => thieves
        .setName(TopSubcommand.Thieves)
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "ladroes")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "ladrones")
        .setDescription("List the users who stole the most")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Lista os usuários que mais roubaram")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Lista de usuarios que más robaron"))
        .addSubcommand(workers => workers
        .setName(TopSubcommand.Workers)
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "trabalhadores")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "trabajadores")
        .setDescription("List the users who work the most")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Lista os usuários que mais trabalharam")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Lista de usuarios que más trabajaron"))
        .addSubcommand(drunkers => drunkers
        .setName(TopSubcommand.Drunkers)
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "bêbados")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "bebedores")
        .setDescription("List the users who drank the most")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Lista os usuários que mais beberam")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Lista de usuarios que más bebieron"))
        .addSubcommand(beaters => beaters
        .setName(TopSubcommand.Beaters)
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "espancadores")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "golpeadores")
        .setDescription("List the users who beat up the most")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Lista os usuários que mais espancaram")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Lista de usuarios que más golpearon"))
        .addSubcommand(scavengers => scavengers
        .setName(TopSubcommand.Scavengers)
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "vasculhadores")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "buscadores")
        .setDescription("List the users who scavenge the most")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Lista os usuários que mais vasculharam")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Lista de usuarios que más buscaron"))
        .addSubcommand(hospital => hospital
        .setName(TopSubcommand.Hospital)
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "doentes")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "enfermos")
        .setDescription("List the users who paid the most in hospital treatments")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Lista os usuários que mais pagaram por tratamentos no hospital")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Lista de usuarios que más pagaron por tratamientos"))
        .addSubcommand(bribers => bribers
        .setName(TopSubcommand.Bribers)
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "subornadores")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "sobornadores")
        .setDescription("List the users who paid the most in prison bribes")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Lista os usuários que mais pagaram por subornos na prisão")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Lista de usuarios que más pagaron por sobornos"))
        .addSubcommand(escapers => escapers
        .setName(TopSubcommand.Escapers)
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "fujões")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "fugitivos")
        .setDescription("List the users who escape the most in prison")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Lista os usuários que mais fugiram da prisão")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Lista de usuarios que más escaparon de prisión"))
        .addSubcommand(gang => gang
        .setName(TopSubcommand.Gangs)
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "gangues")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "cuadrillas")
        .setDescription("List the gangs")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Lista as gangues")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Lista de cuadrillas"))
        .addSubcommand(investors => investors
        .setName(TopSubcommand.Investors)
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "investidores")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "inversores")
        .setDescription("List the users who earned the most from investments")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Lista os usuários que mais ganharam com investimentos")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Lista de usuarios que más ganaron con inversiones")),
    async execute(interaction, user, language) {
        const subcommand = interaction.options.getSubcommand();
        await (0, discordInteractions_1.deferReply)(interaction);
        const defaultAttributes = ["nickname", "id", "class", "avatarDecoration", "backgroundDecoration", "vipTime", "vipEternal"];
        // Define configuration for each subcommand
        const config = {
            [TopSubcommand.Money]: {
                attributes: [...defaultAttributes, "money"],
                orderField: "money",
                valueField: "money",
                valueModifier: ui_1.formatMoney,
                badge: badges_1.EmoteBadgeString.Season1.Top1Money,
                strings: {
                    [Language_1.Language.English]: "Money",
                    [Language_1.Language.Portuguese]: "Grana",
                    [Language_1.Language.Spanish]: "Dinero",
                },
            },
            [TopSubcommand.Gamblers]: {
                attributes: [...defaultAttributes, "casinoWinSum", "casinoWinCount"],
                orderField: "casinoWinSum",
                valueField: "casinoWinSum",
                valueModifier: ui_1.formatMoney,
                countField: "casinoWinCount",
                badge: badges_1.EmoteBadgeString.Season6.EliteTrader,
                strings: {
                    [Language_1.Language.English]: "Gamblers",
                    [Language_1.Language.Portuguese]: "Apostadores",
                    [Language_1.Language.Spanish]: "Apostadores",
                },
            },
            [TopSubcommand.Spenders]: {
                attributes: [...defaultAttributes, "shopSpentSum", "shopSpentCount"],
                orderField: "shopSpentSum",
                valueField: "shopSpentSum",
                valueModifier: ui_1.formatMoney,
                countField: "shopSpentCount",
                badge: badges_1.EmoteBadgeString.Season6.Preppy,
                strings: {
                    [Language_1.Language.English]: "Spenders",
                    [Language_1.Language.Portuguese]: "Gastadores",
                    [Language_1.Language.Spanish]: "Gastadores",
                },
            },
            [TopSubcommand.Thieves]: {
                attributes: [...defaultAttributes, "robberySuccessRobbedSum", "robberySuccessCount"],
                orderField: "robberySuccessRobbedSum",
                valueField: "robberySuccessRobbedSum",
                valueModifier: ui_1.formatMoney,
                countField: "robberySuccessCount",
                badge: badges_1.EmoteBadgeString.Season6.SillyHand,
                strings: {
                    [Language_1.Language.English]: "Thieves",
                    [Language_1.Language.Portuguese]: "Ladrões",
                    [Language_1.Language.Spanish]: "Ladrones",
                },
            },
            [TopSubcommand.Workers]: {
                attributes: [...defaultAttributes, "jobReceivedSum", "jobReceivedCount"],
                orderField: "jobReceivedSum",
                valueField: "jobReceivedSum",
                valueModifier: ui_1.formatMoney,
                countField: "jobReceivedCount",
                badge: badges_1.EmoteBadgeString.Season6.Workaholic,
                strings: {
                    [Language_1.Language.English]: "Workers",
                    [Language_1.Language.Portuguese]: "Trabalhadores",
                    [Language_1.Language.Spanish]: "Trabajadores",
                },
            },
            // Todo: drunkCount?
            [TopSubcommand.Drunkers]: {
                attributes: [...defaultAttributes, "drunkCount", "drinkNormal", "drinkHappyHour"],
                orderField: "drinkHappyHour",
                valueField: "drinkHappyHour",
                valuePrefix: {
                    [Language_1.Language.English]: "Drank",
                    [Language_1.Language.Portuguese]: "Bebeu",
                    [Language_1.Language.Spanish]: "Bebió",
                },
                valueSufix: {
                    [Language_1.Language.English]: "at Happy Hour",
                    [Language_1.Language.Portuguese]: "no Happy Hour",
                    [Language_1.Language.Spanish]: "en Happy Hour",
                },
                countField: "drunkCount",
                countPrefix: {
                    [Language_1.Language.English]: "Drunk",
                    [Language_1.Language.Portuguese]: "Bêbado",
                    [Language_1.Language.Spanish]: "Bebido",
                },
                countSufix: {
                    [Language_1.Language.English]: "times",
                    [Language_1.Language.Portuguese]: "vezes",
                    [Language_1.Language.Spanish]: "veces",
                },
                badge: emotes_1.EmoteString.Idle,
                strings: {
                    [Language_1.Language.English]: "Drunkers",
                    [Language_1.Language.Portuguese]: "Bêbados",
                    [Language_1.Language.Spanish]: "Bebedores",
                },
            },
            [TopSubcommand.Beaters]: {
                attributes: [...defaultAttributes, "beatUpSuccessCount", "beatUpBeatedUpCount"],
                orderField: "beatUpSuccessCount",
                valueField: "beatUpSuccessCount",
                valuePrefix: {
                    [Language_1.Language.English]: "Beated",
                    [Language_1.Language.Portuguese]: "Espancou",
                    [Language_1.Language.Spanish]: "Golpeó",
                },
                countField: "beatUpBeatedUpCount",
                countPrefix: {
                    [Language_1.Language.English]: "Was beated",
                    [Language_1.Language.Portuguese]: "Foi espancado",
                    [Language_1.Language.Spanish]: "Fue golpeado",
                },
                badge: badges_1.EmoteBadgeString.Season6.HeadSmasher,
                strings: {
                    [Language_1.Language.English]: "Beaters",
                    [Language_1.Language.Portuguese]: "Espancadores",
                    [Language_1.Language.Spanish]: "Golpeadores",
                },
            },
            [TopSubcommand.Scavengers]: {
                attributes: [...defaultAttributes, "scavengeFoundTotal", "scavengeCount"],
                orderField: "scavengeFoundTotal",
                valueField: "scavengeFoundTotal",
                valuePrefix: {
                    [Language_1.Language.English]: "Found",
                    [Language_1.Language.Portuguese]: "Encontrou",
                    [Language_1.Language.Spanish]: "Encontró",
                },
                countField: "scavengeCount",
                countSufix: {
                    [Language_1.Language.English]: "attempts",
                    [Language_1.Language.Portuguese]: "tentativas",
                    [Language_1.Language.Spanish]: "intentos",
                },
                badge: badges_1.EmoteBadgeString.Season6.SherlockHolmes,
                strings: {
                    [Language_1.Language.English]: "Scavengers",
                    [Language_1.Language.Portuguese]: "Vasculhadores",
                    [Language_1.Language.Spanish]: "Buscadores",
                },
            },
            [TopSubcommand.Hospital]: {
                attributes: [...defaultAttributes, "hospitalTreatmentSum", "hospitalTreatmentCount"],
                orderField: "hospitalTreatmentSum",
                valueField: "hospitalTreatmentSum",
                valueModifier: ui_1.formatMoney,
                countField: "hospitalTreatmentCount",
                badge: badges_1.EmoteBadgeString.Season6.Hypochondriac,
                strings: {
                    [Language_1.Language.English]: "Hospital",
                    [Language_1.Language.Portuguese]: "Doentes",
                    [Language_1.Language.Spanish]: "Enfermos",
                },
            },
            [TopSubcommand.Bribers]: {
                attributes: [...defaultAttributes, "prisonBriberySum", "prisonBriberyCount"],
                orderField: "prisonBriberySum",
                valueField: "prisonBriberySum",
                valueModifier: ui_1.formatMoney,
                countField: "prisonBriberyCount",
                badge: badges_1.EmoteBadgeString.Season6.Politician,
                strings: {
                    [Language_1.Language.English]: "Bribers",
                    [Language_1.Language.Portuguese]: "Subornadores",
                    [Language_1.Language.Spanish]: "Sobornadores",
                },
            },
            [TopSubcommand.Escapers]: {
                attributes: [...defaultAttributes, "escapeCount", "prisonCount"],
                orderField: "escapeCount",
                valueField: "escapeCount",
                valuePrefix: {
                    [Language_1.Language.English]: "Escaped",
                    [Language_1.Language.Portuguese]: "Fugiu",
                    [Language_1.Language.Spanish]: "Encontró",
                },
                valueSufix: {
                    [Language_1.Language.English]: "times",
                    [Language_1.Language.Portuguese]: "vezes",
                    [Language_1.Language.Spanish]: "veces",
                },
                countField: "prisonCount",
                countPrefix: {
                    [Language_1.Language.English]: "Inprisoned",
                    [Language_1.Language.Portuguese]: "Preso",
                    [Language_1.Language.Spanish]: "Encarcelado",
                },
                countSufix: {
                    [Language_1.Language.English]: "times",
                    [Language_1.Language.Portuguese]: "vezes",
                    [Language_1.Language.Spanish]: "veces",
                },
                badge: badges_1.EmoteBadgeString.Season6.Escapist,
                strings: {
                    [Language_1.Language.English]: "Escapers",
                    [Language_1.Language.Portuguese]: "Fujões",
                    [Language_1.Language.Spanish]: "Fugitivos",
                },
            },
            [TopSubcommand.Gangs]: {
                attributes: ["id"],
                orderField: "level",
                valueField: "level",
                badge: badges_1.EmoteBadgeString.Season6.TopGang,
                valuePrefix: {
                    [Language_1.Language.English]: "Leader",
                    [Language_1.Language.Portuguese]: "Líder",
                    [Language_1.Language.Spanish]: "Líder",
                },
                countPrefix: {
                    [Language_1.Language.English]: "Level",
                    [Language_1.Language.Portuguese]: "Nível",
                    [Language_1.Language.Spanish]: "Nivel",
                },
                strings: {
                    [Language_1.Language.English]: "Gangs",
                    [Language_1.Language.Portuguese]: "Gangues",
                    [Language_1.Language.Spanish]: "Cuadrillas",
                },
            },
            [TopSubcommand.Investors]: {
                attributes: [...defaultAttributes, "investmentTotalProfit"],
                orderField: "investmentTotalProfit",
                valueField: "investmentTotalProfit",
                valueModifier: ui_1.formatMoney,
                badge: badges_1.EmoteBadgeString.Season6.Invester,
                strings: {
                    [Language_1.Language.English]: "Investors",
                    [Language_1.Language.Portuguese]: "Investidores",
                    [Language_1.Language.Spanish]: "Inversores",
                },
            },
        };
        const s = Strings[language];
        // Get the configuration for the current subcommand
        const currentConfig = config[subcommand];
        const title = currentConfig.strings[language];
        let users = [];
        let gangs = [];
        const pagination = new Pagination_1.Pagination(interaction, language);
        async function findList() {
            users = await UserRepository_1.UserRepository.FindTopUsers(currentConfig.orderField, pagination.Limit, pagination.Offset);
        }
        async function findGangs() {
            const list = await GangRepository_1.GangRepository.FindTopGangs(pagination.Limit, pagination.Offset);
            gangs = [];
            for (const g of list) {
                const gang = await Gang_1.Gang.GetBasicById(g.id);
                if (!gang) {
                    continue;
                }
                gangs.push(gang);
            }
            return gangs;
        }
        if (subcommand === TopSubcommand.Gangs) {
            pagination.HowManyRecords = await GangRepository_1.GangRepository.CountAllGangs();
        }
        else {
            pagination.HowManyRecords = await UserRepository_1.UserRepository.CountTopUsers(currentConfig.orderField);
        }
        if (subcommand === TopSubcommand.Gangs) {
            pagination.CustomizeContainer = async () => {
                await findGangs();
                const container = new CustomContainerBuilder_1.CustomContainerBuilder()
                    .setUser(user)
                    .setAccentColor(discord_js_1.Colors.Green)
                    .addTexts([
                    `# Ranking ${title}`,
                ])
                    .addLargeSeparator();
                for (let i = 0; i < gangs.length; i++) {
                    const gang = gangs[i];
                    const underscore = gang.Id === user.GangId ? "__" : "";
                    const position = i + pagination.Offset + 1;
                    let positionText = `\`${position}.\``;
                    if (i + pagination.Offset === 0) {
                        positionText = currentConfig.badge;
                    }
                    const level = currentConfig.countPrefix?.[language] ?? "";
                    const leader = currentConfig.valuePrefix?.[language] ?? "";
                    const leaderUser = await User_1.User.Search(gang.LeaderId);
                    if (!leaderUser) {
                        continue;
                    }
                    container
                        .addSectionComponents(list => list
                        .addTexts([
                        `### ${positionText} ${underscore}[${gang.Acronym}] ${gang.Name}${underscore}${GangColors_1.GangColor[gang.Color].Emote.String}`,
                        `-# ${level} ${gang.Level}`,
                        `-# ${gang.GetExpBar(6, language)}`,
                        `-# ${leader}: **${leaderUser.GetNameWithImage()}**`,
                    ])
                        .setThumbnailAccessory(thumb => thumb
                        .setURL(gang.Image || GangImageCanvasBuilder_1.DEFAULT_GANG_IMAGE)));
                    if (i !== gangs.length - 1) {
                        container.addLargeSeparator();
                    }
                }
                return container;
            };
        }
        else {
            pagination.CustomizeContainer = async () => {
                await findList();
                const container = new CustomContainerBuilder_1.CustomContainerBuilder()
                    .setUser(user)
                    .setAccentColor(discord_js_1.Colors.Green)
                    .addTexts([
                    `# ${currentConfig.badge} Ranking ${title}`,
                ])
                    .addLargeSeparator();
                const cardBuffers = [];
                for (let i = 0; i < users.length; i++) {
                    const u = users[i];
                    const position = i + pagination.Offset + 1;
                    const value = u[currentConfig.valueField];
                    const valueModified = currentConfig.valueModifier ? currentConfig.valueModifier(value, language) : value;
                    const vPrefix = currentConfig.valuePrefix ? `${currentConfig.valuePrefix[language]} ` : "";
                    const vSufix = currentConfig.valueSufix ? ` ${currentConfig.valueSufix[language]}` : "";
                    const cPrefix = currentConfig.countPrefix ? `${currentConfig.countPrefix[language]} ` : "";
                    const cSufix = currentConfig.countSufix ? ` ${currentConfig.countSufix[language]}` : "";
                    const count = currentConfig.countField ? ` (${cPrefix}${u[currentConfig.countField]}${cSufix})` : "";
                    const valueText = `${vPrefix}${valueModified}${vSufix}${count}`;
                    // Resolve discord user for avatar
                    const discordUser = await interaction.client.users.fetch(u.id).catch(() => null);
                    const avatarUrl = discordUser?.avatarURL({ size: 512 }) || null;
                    const userModel = new User_1.User(u.id);
                    await userModel.GetSimpleInfo(u);
                    const cardBuilder = new UserRankingCardCanvasBuilder_1.UserRankingCardCanvasBuilder(userModel, position, valueText, avatarUrl)
                        .SetDecoration(u.backgroundDecoration);
                    cardBuffers.push(await cardBuilder.GenerateImage());
                }
                const attachments = [];
                for (let i = 0; i < users.length; i++) {
                    const attachmentName = `top${i + 1}.webp`;
                    attachments.push(new discord_js_1.AttachmentBuilder(cardBuffers[i], { name: attachmentName }));
                    const position = i + pagination.Offset + 1;
                    container
                        .addImage(`attachment://${attachmentName}`, `#${position}: ${users[i].nickname}`)
                        // .addSectionComponents(section => section
                        // 	.addTexts([
                        // 		`\u200b`
                        // 	])
                        // 	.setButtonAccessory(btn => btn
                        // 		.setLabel(s.options)
                        // 		.setCustomId("position" + position)
                        // 		.setStyle(ButtonStyle.Secondary)
                        // 	)
                        // );
                        .addButtonRow(btn => btn
                        .setLabel(s.options)
                        .setCustomId("position" + position)
                        .setStyle(discord_js_1.ButtonStyle.Secondary));
                    if (i !== users.length - 1) {
                        container.addSmallSeparator();
                    }
                }
                // We need to pass the attachments to the final response
                // The Pagination class needs to be aware of these
                pagination.Attachments = attachments;
                return container;
            };
        }
        const { collector } = await pagination.GenerateContainer();
        let position;
        collector?.on("collect", async (btn) => {
            if (["next", "prev"].includes(btn.customId)) {
                return;
            }
            await (0, discordInteractions_1.deferUpdate)(btn);
            if (btn.customId.includes("position")) {
                const positionId = Number(btn.customId.replace("position", ""));
                position = (positionId - 1) % pagination.Limit;
                // const text = await getTextFromIndex(position);
                const newContainer = new CustomContainerBuilder_1.CustomContainerBuilder()
                    .setUser(user)
                    .setAccentColor(colors_1.CrColors.Default)
                    .addTexts([
                    `# ${currentConfig.badge} Ranking ${title}`,
                ])
                    .addLargeSeparator()
                    .addImage(`attachment://top${position + 1}.webp`)
                    .addLargeSeparator()
                    .addButtonRow(btn => btn
                    .setLabel(s.goback)
                    .setCustomId("goback")
                    .setStyle(discord_js_1.ButtonStyle.Secondary), btn => btn
                    .setLabel(s.inv)
                    .setEmoji(emotes_1.EmoteId.CloseInv)
                    .setCustomId("inv")
                    .setStyle(discord_js_1.ButtonStyle.Secondary), btn => btn
                    .setLabel(s.rob)
                    .setEmoji(emotes_1.EmoteId.Robbery)
                    .setCustomId("rob")
                    .setStyle(discord_js_1.ButtonStyle.Secondary), btn => btn
                    .setLabel(s.beat)
                    .setEmoji(emotes_1.EmoteId.Beat)
                    .setCustomId("beat")
                    .setStyle(discord_js_1.ButtonStyle.Secondary))
                    .addFooter();
                await (0, discordInteractions_1.replyWithContainer)(interaction, newContainer);
            }
            else if (btn.customId === "rob") {
                pagination.UserHasInteractedOutside = true;
                const target = await (0, userUtils_1.searchUser)(users[position].id, interaction, language);
                if (!target) {
                    return;
                }
                await user.GetInfo();
                const robbery = new UserRobberyStrategy_1.UserRobberyStrategy(user, target);
                const { canRob, message } = await robbery.CanRob();
                if (!canRob) {
                    const container = (0, ui_1.defaultComponent)({
                        user,
                        color: colors_1.CrColors.Robbery,
                        description: message,
                    });
                    return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                }
                await (0, robberyHelper_1.runUserRobbery)(interaction, user, target);
            }
            else if (btn.customId === "beat") {
                pagination.UserHasInteractedOutside = true;
                const target = await (0, userUtils_1.searchUser)(users[position].id, interaction, language);
                if (!target) {
                    return;
                }
                await user.GetInfo();
                const beatUp = new BeatUp_1.BeatUp(user, target);
                const { canBeat, message } = await beatUp.CanBeatUser();
                if (!canBeat) {
                    const container = (0, ui_1.defaultComponent)({
                        user,
                        color: colors_1.CrColors.BeatUp,
                        description: message,
                    });
                    return (0, discordInteractions_1.replyWithContainer)(interaction, container);
                }
                await (0, beatupHelper_1.runUserBeatUp)(interaction, user, target);
            }
            else if (btn.customId === "inv") {
                pagination.UserHasInteractedOutside = true;
                const target = await (0, userUtils_1.searchUser)(users[position].id, interaction, language);
                const _user = target ? await (0, client_1.getClient)().users.fetch(target.Id) : interaction.user;
                if (!target) {
                    return;
                }
                const inventory = new invUtils_1.Inventory(interaction, target, _user, language);
                await inventory.Load();
                await inventory.Generate();
                return;
            }
            else if (btn.customId === "goback") {
                const container = await pagination.BuildContainerWithRow();
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
        });
    },
};
const Strings = {
    [Language_1.Language.English]: {
        options: "Options",
        rob: "Rob",
        beat: "Beat",
        inv: "Inventory",
        goback: "Go back",
    },
    [Language_1.Language.Portuguese]: {
        options: "Opções",
        rob: "Roubar",
        beat: "Espancar",
        inv: "Inventário",
        goback: "Voltar",
    },
    [Language_1.Language.Spanish]: {
        options: "Opciones",
        rob: "Robar",
        beat: "Golpear",
        inv: "Inventario",
        goback: "Volver",
    },
};
//# sourceMappingURL=top.js.map