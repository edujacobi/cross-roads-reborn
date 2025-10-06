import { ChatInputCommandInteraction, Locale, SlashCommandBuilder } from "discord.js";
import { searchUser } from "../../utils/logic";
import { formatDate, formatMoney } from "../../utils/ui";
import { User } from "../../models/User";
import { RobHistories } from "../../database/RobHistories";
import { EmoteString } from "../../utils/emotes";
import { Users } from "../../database/Users";
import { Language } from "../../models/Language";
import { Pagination } from "../../models/Pagination";
import { ClassList } from "../../interfaces/Classes";
import { LocationList } from "../../interfaces/Locations";
import { ClashType } from "../../models/Robbery";
import { CustomContainerBuilder } from "../../ui/builders/CustomContainerBuilder";

module.exports = {
	cooldown: 10,
	data: new SlashCommandBuilder()
		.setName("history")
		.setDescription("Shows the history of your robberies")
		.setNameLocalization(Locale.PortugueseBR, "historico")
		.setDescriptionLocalization(Locale.PortugueseBR, "Mostra o seu histórico de roubos")
		.addStringOption(target => target
			.setName("target")
			.setDescription("The user to show")
			.setMinLength(3)
			.setNameLocalization(Locale.PortugueseBR, "alvo")
			.setDescriptionLocalization(Locale.PortugueseBR, "O usuário para mostrar"),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const nameOrId = interaction.options.getString("target");
		const target = nameOrId ? await searchUser(nameOrId, interaction) : user;

		if (!target) {
			return;
		}

		const s = Strings[language];

		await interaction.deferReply();

		const pagination = new Pagination(interaction, language);

		let robHistories: RobHistories[] = [];

		pagination.HowManyRecords = await RobHistories.Count(target.Id);

		pagination.CustomizeContainer = async () => {
			robHistories = await RobHistories.GetList(target.Id, pagination.Limit, pagination.Offset);

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

				if ((rob.type == ClashType.User || rob.type == ClashType.BeatUp) && defender) {
					const boldOs = `${defender.id == user.Id ? "**__" : ""}`;
					const boldOe = `${defender.id == user.Id ? "__**" : ""}`;
					opponentName = `${ClassList[defender.class].Image.Emote.String} ${boldOs}${defender.nickname}${boldOe}`;
				}
				if (rob.type == ClashType.Location && location) {
					opponentName = `${location.Emote.String} ${location.Description[user.Language]}`;
				}

				const emoteShow = rob.type == ClashType.BeatUp ? EmoteString.BaseballBat : EmoteString.React;

				const textMoney = rob.success && rob.type != ClashType.BeatUp ? ` • **${formatMoney(rob.money, user.Language)}**` : "";

				historyList += `### ${challengerName} ${emoteShow} ${opponentName}\n-# ${emoji} ${text}${textMoney} • ${formatDate(rob.createdAt, language)}\n`;
			}

			return new CustomContainerBuilder()
				.setUser(user)
				.addTextDisplayComponents(title => title
					.setContent(`-# ${s.title} ${target.GetNameWithImage()}`))
				.addLargeSeparator()
				.addTextDisplayComponents(content => content
					.setContent(historyList))
				.addFooter({
					text: pagination.Showing(),
				});
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
	},
} as const;