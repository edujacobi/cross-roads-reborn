"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const Language_1 = require("#core/models/Language");
const Season_1 = require("#core/models/Season");
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const badges_1 = require("#bot/utils/badges");
const emotes_1 = require("#bot/utils/emotes");
const ui_1 = require("#bot/utils/ui");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const collectors_1 = require("#bot/utils/collectors");
const Classes_1 = require("#core/types/Classes");
const colors_1 = require("#bot/utils/colors");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("season")
        .setDescription("Shows information about the current or a specific season")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "temporada")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Mostra informações sobre a temporada atual ou uma temporada específica")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "temporada")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Muestra información sobre la temporada actual o una temporada específica")
        .addIntegerOption(option => option
        .setName("number")
        .setDescription("The season number to view (leave empty for current season)")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "numero")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "O número da temporada para visualizar (deixe vazio para a temporada atual)")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "numero")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "El número de temporada a ver (dejar vacío para la actual)")
        .setMinValue(1)
        .setRequired(false)),
    async execute(interaction, user, language = Language_1.Language.English) {
        const s = Strings[language];
        await (0, discordInteractions_1.deferReply)(interaction);
        const requestedSeasonNumber = interaction.options.getInteger("number");
        let season;
        if (requestedSeasonNumber) {
            season = await Season_1.Season.GetByNumber(requestedSeasonNumber);
            if (!season) {
                const container = (0, ui_1.defaultComponent)({
                    user,
                    description: s.seasonNotFound(requestedSeasonNumber),
                    color: discord_js_1.Colors.Red,
                });
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
        }
        else {
            season = await Season_1.Season.GetCurrent();
        }
        const allSeasons = await Season_1.Season.GetSeasonsList();
        function buildSeasonSelectRow(selectedNumber) {
            const menu = new discord_js_1.StringSelectMenuBuilder()
                .setCustomId("select_season")
                .setPlaceholder(s.selectSeason)
                .addOptions(allSeasons.slice(0, 25).map(ss => new discord_js_1.StringSelectMenuOptionBuilder()
                .setLabel(`${s.season} ${ss.number}`)
                .setValue(ss.number.toString())
                .setDefault(ss.number === selectedNumber)));
            return new discord_js_1.ActionRowBuilder().addComponents(menu);
        }
        let container = await createSeasonContainer(season);
        const response = await (0, discordInteractions_1.replyWithContainer)(interaction, container);
        const collector = (0, collectors_1.createStringSelectCollector)(interaction, response, 90_000);
        collector?.on("collect", async (select) => {
            await (0, discordInteractions_1.deferUpdate)(select);
            if (select.customId === "select_season") {
                const selectedSeasonNumber = parseInt(select.values[0]);
                season = await Season_1.Season.GetByNumber(selectedSeasonNumber);
                if (!season) {
                    const errorContainer = (0, ui_1.defaultComponent)({
                        user,
                        description: s.seasonNotFound(selectedSeasonNumber),
                        color: discord_js_1.Colors.Red,
                    });
                    return (0, discordInteractions_1.replyWithContainer)(interaction, errorContainer);
                }
                container = await createSeasonContainer(season);
                await (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
        });
        collector?.on("end", async () => {
            await (0, collectors_1.disableButtons)(interaction, container);
        });
        async function createSeasonContainer(targetSeason) {
            const isActive = targetSeason.IsActive;
            const howMany = isActive ? await Season_1.Season.GetActivePlayerCount() : targetSeason.HowManyPlayers;
            const c = new CustomContainerBuilder_1.CustomContainerBuilder()
                .setUser(user)
                .setAccentColor(colors_1.CrColors.Default)
                .addTexts([
                `# ${s.seasonTitle(targetSeason.Number)}`,
                s.seasonDescription(targetSeason, isActive),
            ])
                .addActionRowComponents(buildSeasonSelectRow(targetSeason.Number));
            if (!isActive) {
                const data = targetSeason.TopData;
                const formatUserList = (entries, formatFn) => {
                    if (!entries || entries.length === 0)
                        return s.noData;
                    return entries.map((u, i) => {
                        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉";
                        const classEmote = Classes_1.ClassList[u.class]?.Image.Emote.String || "";
                        const valStr = formatFn ? formatFn(u.value) : `${u.value}`;
                        return `${medal} ${classEmote} **${u.nickname}** — ${valStr}\n-# \`ID: ${u.id}\``;
                    }).join("\n");
                };
                const formatGangList = (entries) => {
                    if (!entries || entries.length === 0)
                        return s.noData;
                    return entries.map((g) => {
                        return `🥇 👑 **${g.name}** — ${s.level} ${g.level}\n-# \`ID: ${g.id}\``;
                    }).join("\n");
                };
                c
                    .addLargeSeparator()
                    .addTexts([
                    `## ${badges_1.EmoteBadgeString.Season6.Top1Money} ${s.topMoney}`,
                    formatUserList(data.topMoney, v => (0, ui_1.formatMoney)(v, language)),
                    ``,
                    `## ${badges_1.EmoteBadgeString.Season6.EliteTrader} ${s.topGambler}`,
                    formatUserList(data.topGambler, v => (0, ui_1.formatMoney)(v, language)),
                    ``,
                    `## ${badges_1.EmoteBadgeString.Season6.Preppy} ${s.topSpender}`,
                    formatUserList(data.topSpender, v => (0, ui_1.formatMoney)(v, language)),
                    ``,
                    `## ${badges_1.EmoteBadgeString.Season6.LargePocket} ${s.topThiefProfit}`,
                    formatUserList(data.topThiefProfit, v => (0, ui_1.formatMoney)(v, language)),
                    ``,
                    `## ${emotes_1.EmoteString.Idle} ${s.topThiefQuantity}`,
                    formatUserList(data.topThiefQuantity),
                    ``,
                    `## ${badges_1.EmoteBadgeString.Season6.Workaholic} ${s.topWorker}`,
                    formatUserList(data.topWorker, v => (0, ui_1.formatMoney)(v, language)),
                    ``,
                    `## ${badges_1.EmoteBadgeString.Season6.HeadSmasher} ${s.topBeater}`,
                    formatUserList(data.topBeater),
                    ``,
                    `## ${badges_1.EmoteBadgeString.Season6.SherlockHolmes} ${s.topScavenger}`,
                    formatUserList(data.topScavenger),
                    ``,
                    `## ${badges_1.EmoteBadgeString.Season6.Hypochondriac} ${s.topHospital}`,
                    formatUserList(data.topHospital, v => (0, ui_1.formatMoney)(v, language)),
                    ``,
                    `## ${badges_1.EmoteBadgeString.Season6.Politician} ${s.topBriber}`,
                    formatUserList(data.topBriber, v => (0, ui_1.formatMoney)(v, language)),
                    ``,
                    `## ${badges_1.EmoteBadgeString.Season6.Escapist} ${s.topEscaper}`,
                    formatUserList(data.topEscaper),
                    ``,
                    `## ${emotes_1.EmoteString.Idle} ${s.topDrunk}`,
                    formatUserList(data.topDrunk, v => `${v} ${s.beers}`),
                    ``,
                    `## ${badges_1.EmoteBadgeString.Season6.Invester} ${s.topInvestor}`,
                    formatUserList(data.topInvestor, v => (0, ui_1.formatMoney)(v, language)),
                    ``,
                    `## ${badges_1.EmoteBadgeString.Season6.TopGang} ${s.topGang}`,
                    formatGangList(data.topGang),
                ]);
            }
            c.addFooter({
                text: `${howMany} ${s.howManyPlayers}`,
            });
            return c;
        }
    },
};
const Strings = {
    [Language_1.Language.English]: {
        season: "Season",
        seasonTitle: (num) => `🏆 Season ${num}`,
        seasonDescription: (season, isActive) => {
            if (isActive) {
                return `**Current Season**\n-# Ends ${(0, discord_js_1.time)(season.EndDate, discord_js_1.TimestampStyles.RelativeTime)} (${(0, discord_js_1.time)(season.EndDate, discord_js_1.TimestampStyles.ShortDateTime)})\n\n**Start Date**: ${(0, discord_js_1.time)(season.StartDate, discord_js_1.TimestampStyles.ShortDateTime)}\n**End Date**: ${(0, discord_js_1.time)(season.EndDate, discord_js_1.TimestampStyles.ShortDateTime)}\n\n-# Each season lasts ${Season_1.Season.DEFAULT_DURATION_DAYS} days and tracks top players across all categories.`;
            }
            return `**Past Season**\n\n**Start Date**: ${(0, discord_js_1.time)(season.StartDate, discord_js_1.TimestampStyles.ShortDateTime)}\n**End Date**: ${(0, discord_js_1.time)(season.EndDate, discord_js_1.TimestampStyles.ShortDateTime)}\n\n-# Historical Hall of Fame archive.`;
        },
        selectSeason: "Select a season to view",
        seasonNotFound: (num) => `Season ${num} was not found.`,
        howManyPlayers: "players participated in this season",
        level: "Level",
        beers: "beers",
        noData: "-# No recorded entries",
        topMoney: "Top Money",
        topGambler: "Top Gambler (Casino)",
        topSpender: "Top Spender (Shops)",
        topThiefProfit: "Top Thief (Profit)",
        topThiefQuantity: "Top Thief (Quantity - Info Only)",
        topWorker: "Top Worker (Jobs)",
        topBeater: "Top Beater (Beat Ups)",
        topScavenger: "Top Scavenger (Scavenge)",
        topHospital: "Top Hospital (Treatments)",
        topBriber: "Top Briber (Prison Bribes)",
        topEscaper: "Top Escaper (Prison Escapes)",
        topDrunk: "Top Drunk (Happy Hour - Info Only)",
        topInvestor: "Top Investor (Investments)",
        topGang: "Top Gang (Highest Level)",
    },
    [Language_1.Language.Portuguese]: {
        season: "Temporada",
        seasonTitle: (num) => `🏆 Temporada ${num}`,
        seasonDescription: (season, isActive) => {
            if (isActive) {
                return `**Temporada Atual**\n-# Termina ${(0, discord_js_1.time)(season.EndDate, discord_js_1.TimestampStyles.RelativeTime)} (${(0, discord_js_1.time)(season.EndDate, discord_js_1.TimestampStyles.ShortDateTime)})\n\n**Data de Início**: ${(0, discord_js_1.time)(season.StartDate, discord_js_1.TimestampStyles.ShortDateTime)}\n**Data de Término**: ${(0, discord_js_1.time)(season.EndDate, discord_js_1.TimestampStyles.ShortDateTime)}\n\n-# Cada temporada dura ${Season_1.Season.DEFAULT_DURATION_DAYS} dias e acompanha os melhores jogadores em todas as categorias.`;
            }
            return `**Temporada Passada**\n\n**Data de Início**: ${(0, discord_js_1.time)(season.StartDate, discord_js_1.TimestampStyles.ShortDateTime)}\n**Data de Término**: ${(0, discord_js_1.time)(season.EndDate, discord_js_1.TimestampStyles.ShortDateTime)}\n\n-# Arquivo histórico do Hall da Fama.`;
        },
        selectSeason: "Selecione uma temporada para visualizar",
        seasonNotFound: (num) => `Temporada ${num} não foi encontrada.`,
        howManyPlayers: "jogadores participaram nesta temporada",
        level: "Nível",
        beers: "cervejas",
        noData: "-# Nenhum registro encontrado",
        topMoney: "Top Grana",
        topGambler: "Top Apostador (Cassino)",
        topSpender: "Top Gastador (Lojas)",
        topThiefProfit: "Top Ladrão (Lucro)",
        topThiefQuantity: "Top Ladrão (Quantidade - Apenas Info)",
        topWorker: "Top Trabalhador (Empregos)",
        topBeater: "Top Pancada (Espancamentos)",
        topScavenger: "Top Vasculhador (Vasculhar)",
        topHospital: "Top Hospital (Tratamentos)",
        topBriber: "Top Suborno (Prisão)",
        topEscaper: "Top Fujão (Fugas)",
        topDrunk: "Top Bêbado (Happy Hour - Apenas Info)",
        topInvestor: "Top Investidor (Investimentos)",
        topGang: "Top Gangue (Maior Nível)",
    },
    [Language_1.Language.Spanish]: {
        season: "Temporada",
        seasonTitle: (num) => `🏆 Temporada ${num}`,
        seasonDescription: (season, isActive) => {
            if (isActive) {
                return `**Temporada Actual**\n-# Termina ${(0, discord_js_1.time)(season.EndDate, discord_js_1.TimestampStyles.RelativeTime)} (${(0, discord_js_1.time)(season.EndDate, discord_js_1.TimestampStyles.ShortDateTime)})\n\n**Fecha de Inicio**: ${(0, discord_js_1.time)(season.StartDate, discord_js_1.TimestampStyles.ShortDateTime)}\n**Fecha de Fin**: ${(0, discord_js_1.time)(season.EndDate, discord_js_1.TimestampStyles.ShortDateTime)}\n\n-# Cada temporada dura ${Season_1.Season.DEFAULT_DURATION_DAYS} días y sigue a los mejores jugadores en todas las categorías.`;
            }
            return `**Temporada Pasada**\n\n**Fecha de Inicio**: ${(0, discord_js_1.time)(season.StartDate, discord_js_1.TimestampStyles.ShortDateTime)}\n**Fecha de Fin**: ${(0, discord_js_1.time)(season.EndDate, discord_js_1.TimestampStyles.ShortDateTime)}\n\n-# Archivo histórico del Salón de la Fama.`;
        },
        selectSeason: "Selecciona una temporada para ver",
        seasonNotFound: (num) => `La temporada ${num} no fue encontrada.`,
        howManyPlayers: "jugadores participaron en esta temporada",
        level: "Nivel",
        beers: "cervezas",
        noData: "-# No hay registros",
        topMoney: "Top Dinero",
        topGambler: "Top Apostador (Casino)",
        topSpender: "Top Gastador (Tiendas)",
        topThiefProfit: "Top Ladrón (Beneficio)",
        topThiefQuantity: "Top Ladrón (Cantidad - Solo Info)",
        topWorker: "Top Trabajador (Trabajos)",
        topBeater: "Top Golpeador (Peleas)",
        topScavenger: "Top Rebuscador (Rebuscar)",
        topHospital: "Top Hospital (Tratamientos)",
        topBriber: "Top Soborno (Prisión)",
        topEscaper: "Top Escapista (Fugas)",
        topDrunk: "Top Borracho (Happy Hour - Solo Info)",
        topInvestor: "Top Inversor (Inversiones)",
        topGang: "Top Pandilla (Mayor Nivel)",
    },
};
//# sourceMappingURL=season.js.map