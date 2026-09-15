import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { EmoteBadgeString } from "#bot/utils/badges";
import { createButtonCollector, disableButtons } from "#bot/utils/collectors";
import { CrColors } from "#bot/utils/colors";
import { deferUpdate, replyWithContainer } from "#bot/utils/discordInteractions";
import { EmoteString } from "#bot/utils/emotes";
import { defaultComponent, formatMoney } from "#bot/utils/ui";
import { Language, type Localization } from "#core/models/Language";
import type { User } from "#core/models/User";
import { Season } from "#core/models/Season";
import { ClassList } from "#core/types/Classes";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	type ChatInputCommandInteraction,
	Locale,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("endseason")
		.setDescription("End the current season")
		.setNameLocalization(Locale.PortugueseBR, "fimtemporada")
		.setDescriptionLocalization(Locale.PortugueseBR, "Termina a temporada atual")
		.setNameLocalization(Locale.SpanishES, "fintemporada")
		.setDescriptionLocalization(Locale.SpanishES, "Termina la temporada actual")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addBooleanOption(option => option
			.setName("ispreseason")
			.setNameLocalization(Locale.PortugueseBR, "pretemporada")
			.setNameLocalization(Locale.SpanishES, "pretemporada")
			.setDescription("Is the current season a pre season?")
			.setDescriptionLocalization(Locale.PortugueseBR, "A temporada atual é uma pré-temporada?")
			.setDescriptionLocalization(Locale.SpanishES, "¿La temporada actual es una pretemporada?")
			.setRequired(true),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language = Language.English) {
		const s = Strings[language];
		const isPreSeason = interaction.options.getBoolean("ispreseason", true);
		const season = await Season.GetCurrent();

		let container = defaultComponent({
			user,
			description: s.confirmEnd(season.Number, isPreSeason),
			color: CrColors.Admin,
			buttons: new ActionRowBuilder<ButtonBuilder>()
				.setComponents(new ButtonBuilder()
					.setLabel(s.confirmButton)
					.setStyle(ButtonStyle.Success)
					.setCustomId("confirmRanking"),
				),
		});

		const response = await replyWithContainer(interaction, container);
		const collector = createButtonCollector(interaction, response, { idleTime: 120_000 });

		collector?.on("end", async () => {
			await disableButtons(interaction, container);
		});

		collector?.on("collect", async btn => {
			await deferUpdate(btn);

			if (btn.customId === "confirmRanking") {
				const texts: string[] = [];

				function getUserRow(u: { nickname: string; id: string; class: number }, info: string | number) {
					return `**${ClassList[u.class]?.Image.Emote.String || ""} ${u.nickname}**\n${info}\n-# \`Id: ${u.id}\``;
				}

				function getGangRow(gang: { name: string; id: number }, info: string | number) {
					return `**${gang.name}** (${info})\n-# \`Id: ${gang.id}\``;
				}

				const [
					topMoney,
					topGambler,
					topSpender,
					topThiefProfit,
					topThiefQuantity,
					topWorker,
					topBeater,
					topScavenger,
					topHospital,
					topBriber,
					topEscaper,
					topDrunk,
					topInvestor,
					topGang,
				] = await Season.GetEndSeasonRankingData();

				texts.push(
					`# ${s.rankingsPreviewTitle(season.Number)}`,
					`## ${EmoteBadgeString.Season6.Top1Money} ${s.topMoney}`,
					topMoney.length ? topMoney.map(u => getUserRow(u, formatMoney(u.money, language))).join("\n") : s.noData,
					``,
					`## ${EmoteBadgeString.Season6.EliteTrader} ${s.topGambler}`,
					topGambler.length ? topGambler.map(u => getUserRow(u, formatMoney(u.casinoWinSum, language))).join("\n") : s.noData,
					``,
					`## ${EmoteBadgeString.Season6.Preppy} ${s.topSpender}`,
					topSpender.length ? topSpender.map(u => getUserRow(u, formatMoney(u.shopSpentSum, language))).join("\n") : s.noData,
					``,
					`## ${EmoteBadgeString.Season6.LargePocket} ${s.topThiefProfit}`,
					topThiefProfit.length ? topThiefProfit.map(u => getUserRow(u, formatMoney(u.robberySuccessRobbedSum, language))).join("\n") : s.noData,
					``,
					`## ${EmoteString.Idle} ${s.topThiefQuantity}`,
					topThiefQuantity.length ? topThiefQuantity.map(u => getUserRow(u, u.robberySuccessCount)).join("\n") : s.noData,
					``,
					`## ${EmoteBadgeString.Season6.Workaholic} ${s.topWorker}`,
					topWorker.length ? topWorker.map(u => getUserRow(u, formatMoney(u.jobReceivedSum, language))).join("\n") : s.noData,
					``,
					`## ${EmoteBadgeString.Season6.HeadSmasher} ${s.topBeater}`,
					topBeater.length ? topBeater.map(u => getUserRow(u, u.beatUpSuccessCount)).join("\n") : s.noData,
					``,
					`## ${EmoteBadgeString.Season6.SherlockHolmes} ${s.topScavenger}`,
					topScavenger.length ? topScavenger.map(u => getUserRow(u, u.scavengeFoundTotal)).join("\n") : s.noData,
					``,
					`## ${EmoteBadgeString.Season6.Hypochondriac} ${s.topHospital}`,
					topHospital.length ? topHospital.map(u => getUserRow(u, formatMoney(u.hospitalTreatmentSum, language))).join("\n") : s.noData,
					``,
					`## ${EmoteBadgeString.Season6.Politician} ${s.topBriber}`,
					topBriber.length ? topBriber.map(u => getUserRow(u, formatMoney(u.prisonBriberySum, language))).join("\n") : s.noData,
					``,
					`## ${EmoteBadgeString.Season6.Escapist} ${s.topEscaper}`,
					topEscaper.length ? topEscaper.map(u => getUserRow(u, u.escapeCount)).join("\n") : s.noData,
					``,
					`## ${EmoteString.Idle} ${s.topDrunk}`,
					topDrunk.length ? topDrunk.map(u => getUserRow(u, `${u.drinkHappyHour} ${s.beers}`)).join("\n") : s.noData,
					``,
					`## ${EmoteBadgeString.Season6.Invester} ${s.topInvestor}`,
					topInvestor.length ? topInvestor.map(u => getUserRow(u, formatMoney(u.investmentTotalProfit, language))).join("\n") : s.noData,
					``,
					`## ${EmoteBadgeString.Season6.TopGang} ${s.topGang}`,
					topGang.length ? topGang.map(gang => getGangRow(gang, gang.level)).join("\n") : s.noData,
				);

				container = new CustomContainerBuilder()
					.setAccentColor(CrColors.Admin)
					.setUser(user)
					.addTexts(texts, 10)
					.addButtonRow(b => b
						.setLabel(s.continueButton)
						.setStyle(ButtonStyle.Primary)
						.setCustomId("confirmCheckValues"),
					)
					.addFooter();

				return replyWithContainer(interaction, container);
			}

			else if (btn.customId === "confirmCheckValues") {
				const [
					activeUsers,
					activeGangs,
					gangMembers,
					gangRoles,
					gangHeists,
					howManyItems,
					robberies,
					notifications,
					lotteryTickets,
					investments,
					horseRaceBets,
				] = await Season.GetEndSeasonStats();

				const texts = [
					`# ${s.dbWipeTitle}`,
					`### \`${activeUsers}\` ${s.activeUsers}`,
					`### \`${activeGangs}\` ${s.activeGangs}`,
					`### \`${gangMembers}\` ${s.gangMembers}`,
					`### \`${gangRoles}\` ${s.gangRoles}`,
					`### \`${gangHeists}\` ${s.gangHeists}`,
					`### \`${howManyItems}\` ${s.items}`,
					`### \`${robberies}\` ${s.robberies}`,
					`### \`${notifications}\` ${s.notifications}`,
					`### \`${lotteryTickets}\` ${s.lotteryTickets}`,
					`### \`${investments}\` ${s.investments}`,
					`### \`${horseRaceBets}\` ${s.horseRaceBets}`,
					``,
					s.wipeWarning,
				];

				container = new CustomContainerBuilder()
					.setAccentColor(CrColors.Admin)
					.setUser(user)
					.addTexts(texts, 10)
					.addButtonRow(b => b
						.setLabel(s.endSeasonButton)
						.setStyle(ButtonStyle.Danger)
						.setCustomId("clearValues"),
					)
					.addFooter();

				return replyWithContainer(interaction, container);
			}

			else if (btn.customId === "clearValues") {
				container = new CustomContainerBuilder()
					.setAccentColor(CrColors.Admin)
					.setUser(user)
					.addTexts([`# ${s.endingSeason}`], 10)
					.addFooter();

				await replyWithContainer(interaction, container);

				await Season.EndCurrentSeason(isPreSeason);

				collector?.stop();

				container = new CustomContainerBuilder()
					.setAccentColor(CrColors.Admin)
					.setUser(user)
					.addTexts([
						`# ${s.seasonEndedTitle}`,
						s.seasonEndedDescription(isPreSeason),
					], 10)
					.addFooter();

				await replyWithContainer(interaction, container);
			}
		});
	},
};

const Strings = {
	[Language.English]: {
		confirmEnd: (num: number, pre: boolean) => `Confirm ending current Season **${num}**?\n-# Pre-Season: ${pre ? "✅ Yes" : "❌ No"}`,
		confirmButton: "Preview Rankings",
		rankingsPreviewTitle: (num: number) => `Season ${num} Ranking Leaders`,
		continueButton: "Check Database Impact",
		dbWipeTitle: "Database Wipe Overview",
		endSeasonButton: "END SEASON NOW",
		endingSeason: "Ending season and resetting database...",
		seasonEndedTitle: "🏆 Season Ended Successfully!",
		seasonEndedDescription: (pre: boolean) => pre ? "Pre-season values have been reset and a fresh season has started." : "Winners have been awarded badges, announcements sent, database reset, and the new season has started!",
		topMoney: "Top Money (Top 1, 2, 3)",
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
		noData: "-# No recorded data",
		beers: "beers",
		activeUsers: "Active users",
		activeGangs: "Active gangs",
		gangMembers: "Gang members",
		gangRoles: "Gang roles",
		gangHeists: "Gang heists",
		items: "User items",
		robberies: "Robbery records",
		notifications: "Notifications",
		lotteryTickets: "Lottery tickets",
		investments: "Active investments",
		horseRaceBets: "Horse race bets",
		wipeWarning: "-# Clicking **END SEASON NOW** will reset seasonal user progression, reset Vault balances to default starting funds, and wipe Gangs, GangMembers, GangRoles, GangHeists, UserItems, RobHistories, Notifications, LotteryTickets, UserInvestments, and HorseRaceBets.\n-# UserBadges, UserBundles, and Cosmetics will NOT be erased.",
	},
	[Language.Portuguese]: {
		confirmEnd: (num: number, pre: boolean) => `Confirmar o encerramento da Temporada atual **${num}**?\n-# Pré-temporada: ${pre ? "✅ Sim" : "❌ Não"}`,
		confirmButton: "Visualizar Rankings",
		rankingsPreviewTitle: (num: number) => `Líderes de Ranking da Temporada ${num}`,
		continueButton: "Ver Impacto no Banco de Dados",
		dbWipeTitle: "Resumo da Limpeza do Banco de Dados",
		endSeasonButton: "FINALIZAR TEMPORADA AGORA",
		endingSeason: "Finalizando temporada e resetando banco de dados...",
		seasonEndedTitle: "🏆 Temporada Finalizada com Sucesso!",
		seasonEndedDescription: (pre: boolean) => pre ? "Os valores da pré-temporada foram resetados e uma nova temporada começou." : "Os vencedores receberam medalhas, anúncios foram enviados, dados resetados e a nova temporada começou!",
		topMoney: "Top Grana (Top 1, 2, 3)",
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
		noData: "-# Nenhum dado registrado",
		beers: "cervejas",
		activeUsers: "Usuários ativos",
		activeGangs: "Gangues ativas",
		gangMembers: "Membros de gangues",
		gangRoles: "Cargos de gangues",
		gangHeists: "Golpes de gangues",
		items: "Itens de usuários",
		robberies: "Histórico de roubos",
		notifications: "Notificações",
		lotteryTickets: "Bilhetes de loteria",
		investments: "Investimentos ativos",
		horseRaceBets: "Apostas de cavalos",
		wipeWarning: "-# Clicar em **FINALIZAR TEMPORADA AGORA** irá resetar a progressão sazonal dos usuários, restaurar os Cofres aos valores iniciais e apagar Gangs, GangMembers, GangRoles, GangHeists, UserItems, RobHistories, Notifications, LotteryTickets, UserInvestments e HorseRaceBets.\n-# Medalhas (UserBadges), Pacotes (UserBundles) e Cosméticos NÃO serão apagados.",
	},
	[Language.Spanish]: {
		confirmEnd: (num: number, pre: boolean) => `¿Confirmar el fin de la Temporada actual **${num}**?\n-# Pretemporada: ${pre ? "✅ Sí" : "❌ No"}`,
		confirmButton: "Ver Rankings",
		rankingsPreviewTitle: (num: number) => `Líderes de Ranking de la Temporada ${num}`,
		continueButton: "Ver Impacto en la Base de Datos",
		dbWipeTitle: "Resumen del Reinicio de la Base de Datos",
		endSeasonButton: "FINALIZAR TEMPORADA AHORA",
		endingSeason: "Finalizando temporada y reiniciando base de datos...",
		seasonEndedTitle: "🏆 ¡Temporada Finalizada con Éxito!",
		seasonEndedDescription: (pre: boolean) => pre ? "Los valores de la pretemporada se han reiniciado y comenzó una nueva temporada." : "¡Los ganadores recibieron sus insignias, se enviaron anuncios, se reiniciaron los datos y comenzó la nueva temporada!",
		topMoney: "Top Dinero (Top 1, 2, 3)",
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
		noData: "-# No hay datos registrados",
		beers: "cervezas",
		activeUsers: "Usuarios activos",
		activeGangs: "Pandillas activas",
		gangMembers: "Miembros de pandilla",
		gangRoles: "Roles de pandilla",
		gangHeists: "Golpes de pandilla",
		items: "Objetos de usuarios",
		robberies: "Historial de robos",
		notifications: "Notificaciones",
		lotteryTickets: "Billetes de lotería",
		investments: "Inversiones activas",
		horseRaceBets: "Apuestas de caballos",
		wipeWarning: "-# Hacer clic en **FINALIZAR TEMPORADA AHORA** reiniciará el progreso estacional de los usuarios, restablecerá las Bóvedas a sus fondos iniciales y borrará Gangs, GangMembers, GangRoles, GangHeists, UserItems, RobHistories, Notifications, LotteryTickets, UserInvestments y HorseRaceBets.\n-# Insignias (UserBadges), Paquetes (UserBundles) y Cosméticos NO serán eliminados.",
	},
} as const satisfies Localization;