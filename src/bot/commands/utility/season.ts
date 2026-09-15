import {
	ActionRowBuilder,
	type ChatInputCommandInteraction,
	Colors,
	Locale,
	SlashCommandBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	time,
	TimestampStyles,
} from "discord.js";
import { Language, type Localization } from "#core/models/Language";
import { Season, type TopGangEntry, type TopUserEntry } from "#core/models/Season";
import type { User } from "#core/models/User";
import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { EmoteBadgeString } from "#bot/utils/badges";
import { EmoteString } from "#bot/utils/emotes";
import { defaultComponent, formatMoney } from "#bot/utils/ui";
import { deferReply, deferUpdate, replyWithContainer } from "#bot/utils/discordInteractions";
import { createStringSelectCollector, disableButtons } from "#bot/utils/collectors";
import { ClassList } from "#core/types/Classes";
import { CrColors } from "#bot/utils/colors";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("season")
		.setDescription("Shows information about the current or a specific season")
		.setNameLocalization(Locale.PortugueseBR, "temporada")
		.setDescriptionLocalization(Locale.PortugueseBR, "Mostra informações sobre a temporada atual ou uma temporada específica")
		.setNameLocalization(Locale.SpanishES, "temporada")
		.setDescriptionLocalization(Locale.SpanishES, "Muestra información sobre la temporada actual o una temporada específica")
		.addIntegerOption(option => option
			.setName("number")
			.setDescription("The season number to view (leave empty for current season)")
			.setNameLocalization(Locale.PortugueseBR, "numero")
			.setDescriptionLocalization(Locale.PortugueseBR, "O número da temporada para visualizar (deixe vazio para a temporada atual)")
			.setNameLocalization(Locale.SpanishES, "numero")
			.setDescriptionLocalization(Locale.SpanishES, "El número de temporada a ver (dejar vacío para la actual)")
			.setMinValue(1)
			.setRequired(false),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language = Language.English) {
		const s = Strings[language];
		await deferReply(interaction);

		const requestedSeasonNumber = interaction.options.getInteger("number");
		let season: Season | null;

		if (requestedSeasonNumber) {
			season = await Season.GetByNumber(requestedSeasonNumber);
			if (!season) {
				const container = defaultComponent({
					user,
					description: s.seasonNotFound(requestedSeasonNumber),
					color: Colors.Red,
				});
				return replyWithContainer(interaction, container);
			}
		}
		else {
			season = await Season.GetCurrent();
		}

		const allSeasons = await Season.GetSeasonsList();

		function buildSeasonSelectRow(selectedNumber: number) {
			const menu = new StringSelectMenuBuilder()
				.setCustomId("select_season")
				.setPlaceholder(s.selectSeason)
				.addOptions(
					allSeasons.slice(0, 25).map(ss =>
						new StringSelectMenuOptionBuilder()
							.setLabel(`${s.season} ${ss.number}`)
							.setValue(ss.number.toString())
							.setDefault(ss.number === selectedNumber),
					),
				);

			return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
		}

		let container = await createSeasonContainer(season);
		const response = await replyWithContainer(interaction, container);

		const collector = createStringSelectCollector(interaction, response, 90_000);

		collector?.on("collect", async select => {
			await deferUpdate(select);

			if (select.customId === "select_season") {
				const selectedSeasonNumber = parseInt(select.values[0]);
				season = await Season.GetByNumber(selectedSeasonNumber);

				if (!season) {
					const errorContainer = defaultComponent({
						user,
						description: s.seasonNotFound(selectedSeasonNumber),
						color: Colors.Red,
					});
					return replyWithContainer(interaction, errorContainer);
				}

				container = await createSeasonContainer(season);
				await replyWithContainer(interaction, container);
			}
		});

		collector?.on("end", async () => {
			await disableButtons(interaction, container);
		});

		async function createSeasonContainer(targetSeason: Season): Promise<CustomContainerBuilder> {
			const isActive = targetSeason.IsActive;
			const howMany = isActive ? await Season.GetActivePlayerCount() : targetSeason.HowManyPlayers;

			const c = new CustomContainerBuilder()
				.setUser(user)
				.setAccentColor(CrColors.Default)
				.addTexts([
					`# ${s.seasonTitle(targetSeason.Number)}`,
					s.seasonDescription(targetSeason, isActive),
				])
				.addActionRowComponents(buildSeasonSelectRow(targetSeason.Number));

			if (!isActive) {
				const data = targetSeason.TopData;

				const formatUserList = (entries: TopUserEntry[], formatFn?: (val: number) => string) => {
					if (!entries || entries.length === 0) return s.noData;
					return entries.map((u, i) => {
						const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉";
						const classEmote = ClassList[u.class]?.Image.Emote.String || "";
						const valStr = formatFn ? formatFn(u.value) : `${u.value}`;
						return `${medal} ${classEmote} **${u.nickname}** — ${valStr}\n-# \`ID: ${u.id}\``;
					}).join("\n");
				};

				const formatGangList = (entries: TopGangEntry[]) => {
					if (!entries || entries.length === 0) return s.noData;
					return entries.map((g) => {
						return `🥇 👑 **${g.name}** — ${s.level} ${g.level}\n-# \`ID: ${g.id}\``;
					}).join("\n");
				};

				c
					.addLargeSeparator()
					.addTexts([
						`## ${EmoteBadgeString.Season6.Top1Money} ${s.topMoney}`,
						formatUserList(data.topMoney, v => formatMoney(v, language)),
						``,
						`## ${EmoteBadgeString.Season6.EliteTrader} ${s.topGambler}`,
						formatUserList(data.topGambler, v => formatMoney(v, language)),
						``,
						`## ${EmoteBadgeString.Season6.Preppy} ${s.topSpender}`,
						formatUserList(data.topSpender, v => formatMoney(v, language)),
						``,
						`## ${EmoteBadgeString.Season6.LargePocket} ${s.topThiefProfit}`,
						formatUserList(data.topThiefProfit, v => formatMoney(v, language)),
						``,
						`## ${EmoteString.Idle} ${s.topThiefQuantity}`,
						formatUserList(data.topThiefQuantity),
						``,
						`## ${EmoteBadgeString.Season6.Workaholic} ${s.topWorker}`,
						formatUserList(data.topWorker, v => formatMoney(v, language)),
						``,
						`## ${EmoteBadgeString.Season6.HeadSmasher} ${s.topBeater}`,
						formatUserList(data.topBeater),
						``,
						`## ${EmoteBadgeString.Season6.SherlockHolmes} ${s.topScavenger}`,
						formatUserList(data.topScavenger),
						``,
						`## ${EmoteBadgeString.Season6.Hypochondriac} ${s.topHospital}`,
						formatUserList(data.topHospital, v => formatMoney(v, language)),
						``,
						`## ${EmoteBadgeString.Season6.Politician} ${s.topBriber}`,
						formatUserList(data.topBriber, v => formatMoney(v, language)),
						``,
						`## ${EmoteBadgeString.Season6.Escapist} ${s.topEscaper}`,
						formatUserList(data.topEscaper),
						``,
						`## ${EmoteString.Idle} ${s.topDrunk}`,
						formatUserList(data.topDrunk, v => `${v} ${s.beers}`),
						``,
						`## ${EmoteBadgeString.Season6.Invester} ${s.topInvestor}`,
						formatUserList(data.topInvestor, v => formatMoney(v, language)),
						``,
						`## ${EmoteBadgeString.Season6.TopGang} ${s.topGang}`,
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
	[Language.English]: {
		season: "Season",
		seasonTitle: (num: number) => `🏆 Season ${num}`,
		seasonDescription: (season: Season, isActive: boolean) => {
			if (isActive) {
				return `**Current Season**\n-# Ends ${time(season.EndDate, TimestampStyles.RelativeTime)} (${time(season.EndDate, TimestampStyles.ShortDateTime)})\n\n**Start Date**: ${time(season.StartDate, TimestampStyles.ShortDateTime)}\n**End Date**: ${time(season.EndDate, TimestampStyles.ShortDateTime)}\n\n-# Each season lasts ${Season.DEFAULT_DURATION_DAYS} days and tracks top players across all categories.`;
			}
			return `**Past Season**\n\n**Start Date**: ${time(season.StartDate, TimestampStyles.ShortDateTime)}\n**End Date**: ${time(season.EndDate, TimestampStyles.ShortDateTime)}\n\n-# Historical Hall of Fame archive.`;
		},
		selectSeason: "Select a season to view",
		seasonNotFound: (num: number) => `Season ${num} was not found.`,
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
	[Language.Portuguese]: {
		season: "Temporada",
		seasonTitle: (num: number) => `🏆 Temporada ${num}`,
		seasonDescription: (season: Season, isActive: boolean) => {
			if (isActive) {
				return `**Temporada Atual**\n-# Termina ${time(season.EndDate, TimestampStyles.RelativeTime)} (${time(season.EndDate, TimestampStyles.ShortDateTime)})\n\n**Data de Início**: ${time(season.StartDate, TimestampStyles.ShortDateTime)}\n**Data de Término**: ${time(season.EndDate, TimestampStyles.ShortDateTime)}\n\n-# Cada temporada dura ${Season.DEFAULT_DURATION_DAYS} dias e acompanha os melhores jogadores em todas as categorias.`;
			}
			return `**Temporada Passada**\n\n**Data de Início**: ${time(season.StartDate, TimestampStyles.ShortDateTime)}\n**Data de Término**: ${time(season.EndDate, TimestampStyles.ShortDateTime)}\n\n-# Arquivo histórico do Hall da Fama.`;
		},
		selectSeason: "Selecione uma temporada para visualizar",
		seasonNotFound: (num: number) => `Temporada ${num} não foi encontrada.`,
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
	[Language.Spanish]: {
		season: "Temporada",
		seasonTitle: (num: number) => `🏆 Temporada ${num}`,
		seasonDescription: (season: Season, isActive: boolean) => {
			if (isActive) {
				return `**Temporada Actual**\n-# Termina ${time(season.EndDate, TimestampStyles.RelativeTime)} (${time(season.EndDate, TimestampStyles.ShortDateTime)})\n\n**Fecha de Inicio**: ${time(season.StartDate, TimestampStyles.ShortDateTime)}\n**Fecha de Fin**: ${time(season.EndDate, TimestampStyles.ShortDateTime)}\n\n-# Cada temporada dura ${Season.DEFAULT_DURATION_DAYS} días y sigue a los mejores jugadores en todas las categorías.`;
			}
			return `**Temporada Pasada**\n\n**Fecha de Inicio**: ${time(season.StartDate, TimestampStyles.ShortDateTime)}\n**Fecha de Fin**: ${time(season.EndDate, TimestampStyles.ShortDateTime)}\n\n-# Archivo histórico del Salón de la Fama.`;
		},
		selectSeason: "Selecciona una temporada para ver",
		seasonNotFound: (num: number) => `La temporada ${num} no fue encontrada.`,
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
} as const satisfies Localization;
