import { ChatInputCommandInteraction, Colors, Locale, SlashCommandBuilder, SlashCommandUserOption } from "discord.js";
import { checkUser, replyUserDontExist } from "../../utils/logic";
import { formatMoney, showTime } from "../../utils/ui";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { User } from "../../models/User";
import { RobHistories } from "../../database/RobHistories";
import { EmoteString } from "../../utils/emotes";
import { Users } from "../../database/Users";
import { Language } from "../../models/Language";
import { Pagination } from "../../models/Pagination";
import { ClassList } from "../../models/Class";
import { LocationList } from "../../models/Locations";
import { RobTypes } from "../../models/Robbery";

module.exports = {
	cooldown: 10,
	vip: true,
	data: new SlashCommandBuilder()
		.setName("history")
		.setDescription("Shows the history of your robberies")
		.setNameLocalization(Locale.PortugueseBR, "historico")
		.setDescriptionLocalization(Locale.PortugueseBR, "Mostra o seu histórico de roubos")
		.addUserOption((option: SlashCommandUserOption) =>
			option
				.setName("target")
				.setDescription("The user to show")
				.setNameLocalization(Locale.PortugueseBR, "alvo")
				.setDescriptionLocalization(Locale.PortugueseBR, "O usuário para mostrar"),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const _user = interaction.options.getUser("target") || interaction.user;
		const target = _user ? await checkUser(_user.id, interaction) : user;

		if (!target) {
			return await replyUserDontExist(interaction, language);
		}

		const s = Strings[language];

		await interaction.deferReply();

		const pagination = new Pagination(interaction, language);
		pagination.Limit = 8;

		let robHistories: RobHistories[] = [];

		pagination.HowManyRecords = await RobHistories.Count(target.Id);

		pagination.CustomizeEmbed = async () => {
			robHistories = await RobHistories.GetList(target.Id, pagination.Limit, pagination.Offset);

			let historyList = "";

			if (robHistories.length == 0) {
				historyList = `\n${s.empty}`;
			}

			for (let i = 0; i < robHistories.length; i++) {
				const rob = robHistories[i];

				const emoji = rob.success ? EmoteString.Robbery : EmoteString.Police;
				const text = rob.success ? s.success : s.failure;
				const attacker = await Users.findByPk(rob.attackerId);
				const defender = await Users.findByPk(rob.defenderId);
				const location = LocationList[rob.locationId];

				if (!attacker) {
					continue;
				}

				const boldCs = `${attacker.id == user.Id ? "**__" : ""}`;
				const boldCe = `${attacker.id == user.Id ? "__**" : ""}`;
				const challengerName = `${ClassList[attacker.class].Image.Emote.String} ${boldCs}${attacker.nickname}${boldCe}`;

				let opponentName = "";

				if (rob.type == RobTypes.User && defender) {
					const boldOs = `${defender.id == user.Id ? "**__" : ""}`;
					const boldOe = `${defender.id == user.Id ? "__**" : ""}`;
					opponentName = `${ClassList[defender.class].Image.Emote.String} ${boldOs}${defender.nickname}${boldOe}`;
				}
				if (rob.type == RobTypes.Location && location) {
					opponentName = `${location.Emote.String} ${location.Description[user.Language]}`;
				}

				historyList += `${challengerName} ${EmoteString.React} ${opponentName}\n${rob.success ? `\`${formatMoney(rob.money, user.Language)}\`\n` : ""}-# ${emoji} ${text} • ${showTime(new Date(rob.createdAt).getTime())}\n\n`;
			}

			return new CustomEmbedBuilder()
				.setTitle(`${s.title} ${target.Nickname}`)
				.setThumbnail(_user.avatarURL() ?? null)
				.setColor(Colors.DarkButNotBlack)
				.setDescription(historyList)
				.setDefaultFooter(user.Nickname, interaction.user.avatarURL(), pagination.Showing());
		};

		await pagination.GenerateEmbed();
	},
};

const Strings = {
	[Language.English]: {
		empty: "This user doesn't have a history",
		success: "Success",
		failure: "Failure",
		title: `Robbery history of`,
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
		title: `Histórico de roubos de`,
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
		title: `Historial de robos de`,
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