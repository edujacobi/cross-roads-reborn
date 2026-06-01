import { type ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { deferReply } from "#bot/utils/discordInteractions";
import { formatDate, formatMoney } from "#bot/utils/ui";
import type { User } from "#core/models/User";
import type { RobHistories } from "#core/database/RobHistories";
import { RobHistoryRepository } from "#core/repositories/RobHistoryRepository";
import { EmoteString } from "#bot/utils/emotes";
import { Users } from "#core/database/Users";
import { Language, type Localization } from "#core/models/Language";
import { Pagination } from "#core/models/Pagination";
import { ClassList } from "#core/types/Classes";
import { LocationList } from "#core/types/Locations";
import { InvestmentList, type InvestmentId } from "#core/types/Investments";
import { ClashType } from "#core/types/Robbery";
import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { searchUser } from "#bot/utils/userUtils";

module.exports = {
	cooldown: 10,
	data: new SlashCommandBuilder()
		.setName("history")
		.setDescription("Shows the history of your robberies")
		.setNameLocalization(Locale.PortugueseBR, "historico")
		.setNameLocalization(Locale.SpanishES, "historial")
		.setDescriptionLocalization(Locale.PortugueseBR, "Mostra o seu histórico de roubos")
		.setDescriptionLocalization(Locale.SpanishES, "Muestra el historial de tus robos")
		.addStringOption(target => target
			.setName("target")
			.setDescription("The user to show")
			.setMinLength(3)
			.setNameLocalization(Locale.PortugueseBR, "alvo")
			.setDescriptionLocalization(Locale.PortugueseBR, "O usuário para mostrar"),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const nameOrId = interaction.options.getString("target");

		await deferReply(interaction);

		const target = nameOrId ? await searchUser(nameOrId, interaction) : user;

		if (!target) {
			return;
		}

		const s = Strings[language];

		const pagination = new Pagination(interaction, language);

		let robHistories: RobHistories[] = [];

		pagination.HowManyRecords = await RobHistoryRepository.Count(target.Id);

		pagination.CustomizeContainer = async () => {
			robHistories = await RobHistoryRepository.GetList(target.Id, pagination.Limit, pagination.Offset);

			let historyList = "";

			if (robHistories.length == 0) {
				historyList = `\n${s.empty}`;
			}

			for (let i = 0; i < robHistories.length; i++) {
				const rob = robHistories[i];

				const emoji = rob.success ? EmoteString.Victory : EmoteString.Defeat;
				const text = rob.success ? s.success : s.failure;
				const attacker = await Users.findByPk(rob.attackerId, { attributes: ["id", "class", "nickname"] });
				const defender = await Users.findByPk(rob.defenderId, { attributes: ["id", "class", "nickname"] });
				const location = LocationList[rob.locationId];

				if (!attacker) {
					continue;
				}

				const boldCs = `${attacker.id == user.Id ? "**__" : ""}`;
				const boldCe = `${attacker.id == user.Id ? "__**" : ""}`;
				const challengerName = `${ClassList[attacker.class].Image.Emote.String} ${boldCs}${attacker.nickname}${boldCe}`;

				let opponentName = "";

				if ((rob.type == ClashType.User || rob.type == ClashType.BeatUp || rob.type == ClashType.Investment) && defender) {
					const boldOs = `${defender.id == user.Id ? "**__" : ""}`;
					const boldOe = `${defender.id == user.Id ? "__**" : ""}`;
					opponentName = `${ClassList[defender.class].Image.Emote.String} ${boldOs}${defender.nickname}${boldOe}`;

					if (rob.type == ClashType.Investment && rob.locationId != null) {
						const inv = InvestmentList[rob.locationId as InvestmentId];
						if (inv) {
							opponentName = `${inv.Name[user.Language]} ${s.of} ${opponentName}`;
						}
					}
				}
				if (rob.type == ClashType.Location && location) {
					opponentName = `${location.Emote.String} ${location.Name[user.Language]}`;
				}

				let emoteShow = EmoteString.React;
				if (rob.type == ClashType.BeatUp) emoteShow = EmoteString.BaseballBat;
				if (rob.type == ClashType.Investment) emoteShow += EmoteString.InvestmentActive;

				let textMoney = rob.success && rob.type != ClashType.BeatUp ? ` • **${formatMoney(rob.money, user.Language)}**` : "";
				if (rob.type == ClashType.Investment) {
					textMoney += ` • ${s.gangAction}`;
				}

				historyList += `### ${challengerName} ${emoteShow} ${opponentName}\n-# ${emoji} ${text}${textMoney} • ${formatDate(rob.createdAt, language)}\n`;
			}

			return new CustomContainerBuilder()
				.setUser(user)
				.addTexts([
					`-# ${s.title} ${target.GetNameWithImage()}`,
				])
				.addLargeSeparator()
				.addTexts([
					historyList,
				]);
		};

		await pagination.GenerateContainer();
	},
};

const Strings = {
	[Language.English]: {
		empty: "This user doesn't have a history",
		success: "Success",
		failure: "Failure",
		title: `Robbery and beat ups history of`,
		data: "Data",
		history: "history",
		successes: "Successes",
		failures: "Failures",
		successRate: "Success rate",
		robbedTotal: "Robbed total of",
		robbedTimes: (beingRobbedCount: number) => `Robbed \`${beingRobbedCount}\` times`,
		lost: "Lost",
		of: "of",
		gangAction: "Gang action",
	},
	[Language.Portuguese]: {
		empty: "Este usuário não possui histórico",
		success: "Sucesso",
		failure: "Falha",
		title: `Histórico de roubos e espancamentos de`,
		data: "Dados",
		history: "Histórico",
		successes: "Sucessos",
		failures: "Falhas",
		successRate: "Taxa de sucesso",
		robbedTotal: "Roubou um total de",
		robbedTimes: (beingRobbedCount: number) => `Foi roubado \`${beingRobbedCount}\` vezes`,
		lost: "Perdeu",
		of: "de",
		gangAction: "Ação em Gangue",
	},
	[Language.Spanish]: {
		empty: "Este usuario no tiene historial",
		success: "Éxito",
		failure: "Fracaso",
		title: `Historial de robos y golpes de`,
		data: "Datos",
		history: "Historial",
		successes: "Éxitos",
		failures: "Fracasos",
		successRate: "Tasa de éxito",
		robbedTotal: "Robó un total de",
		robbedTimes: (beingRobbedCount: number) => `Fue robado \`${beingRobbedCount}\` veces`,
		lost: "Perdió",
		of: "de",
		gangAction: "Acción en cuadrilla",
	},
} as const satisfies Localization;