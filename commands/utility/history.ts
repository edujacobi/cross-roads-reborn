import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	Colors,
	ComponentType,
	Locale,
	MessageComponentInteraction,
	SlashCommandBuilder,
	SlashCommandUserOption,
} from "discord.js";
import { checkUser, removeEmbedComponents, replyUserDontExist } from "../../utils/logic";
import { formatMoney, showTime } from "../../utils/ui";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { User } from "../../models/User";
import { RobHistories } from "../../database/RobHistories";
import { EmoteString } from "../../utils/emotes";
import { Users } from "../../database/Users";
import { Language } from "../../models/Language";

module.exports = {
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

		let offset = 0;
		const limit = 5;
		let robHistories: RobHistories[] = [];

		const howManyRobberies = await RobHistories.Count(target.Id);

		async function createEmbedHistory(user: User) {

			robHistories = await RobHistories.GetList(user.Id, limit, offset);

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

				if (!attacker || !defender) {
					continue;
				}

				const boldCs = `${attacker.id == user.Id ? "**__" : ""}`;
				const boldOs = `${defender.id == user.Id ? "**__" : ""}`;
				const boldCe = `${attacker.id == user.Id ? "__**" : ""}`;
				const boldOe = `${defender.id == user.Id ? "__**" : ""}`;

				const challengerName = `${boldCs}${attacker.nickname}${boldCe}`;
				const opponentName = `${boldOs}${defender.nickname}${boldOe}`;

				historyList += `### ${emoji} ${text}\n${challengerName} ${EmoteString.Colt45} ${opponentName}\n${rob.success ? `\`${formatMoney(rob.money, user.Language)}\`\n` : ""}-# ${showTime(new Date(rob.createdAt).getTime())}\n`;
			}

			const winrate = `${user.Robbery.SuccessCount + user.Robbery.FailureCount > 0 ? (user.Robbery.SuccessCount / (user.Robbery.FailureCount + user.Robbery.SuccessCount) * 100).toFixed(2) : "0"}%`;

			return new CustomEmbedBuilder()
				.setTitle(`${s.title} ${user.Nickname}`)
				.setThumbnail(_user.avatarURL() ?? null)
				.setColor(Colors.DarkButNotBlack)
				.setDescription(`-# ${s.data}
${EmoteString.Victory} ${s.successes}: \`${user.Robbery.SuccessCount}\`
${EmoteString.Defeat} ${s.failures}: \`${user.Robbery.FailureCount}\`
${EmoteString.Winrate} ${s.successRate}: \`${winrate}\`
${s.robbedTotal} \`${formatMoney(user.Robbery.SuccessRobbedSum, user.Language)}\`
${s.robbedTimes(user.Robbery.BeingRobbedCount)}
${s.lost} \`${formatMoney(user.Robbery.BeingRobbedSum, user.Language)}\`

-# ${s.history}
${historyList}`)
				.setDefaultFooter(user.Nickname, null, `Showing ${offset + 1} - ${offset + limit} of ${howManyRobberies} results.`);
		}

		const buttonPrevious = new ButtonBuilder()
			.setCustomId("prev")
			.setLabel(s.previous)
			.setStyle(ButtonStyle.Secondary)
			.setEmoji("⬅️");

		const buttonNext = new ButtonBuilder()
			.setCustomId("next")
			.setLabel(s.next)
			.setStyle(ButtonStyle.Secondary)
			.setEmoji("➡️");

		function createRowHistory() {
			const rowButtons = new ActionRowBuilder<ButtonBuilder>();

			if (offset != 0) {
				rowButtons.addComponents([buttonPrevious]);
			}

			if (howManyRobberies > (offset + limit)) {
				rowButtons.addComponents([buttonNext]);
			}

			return rowButtons;
		}

		let embed = await createEmbedHistory(target);

		let buttonRow = createRowHistory();

		const components = [];

		if (buttonRow.components.length > 0) {
			components.push(buttonRow);
		}

		const response = await interaction.editReply({
			embeds: [embed],
			components: components ?? undefined,
		});

		const buttonCollector = response.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === interaction.user.id,
			componentType: ComponentType.Button,
			idle: 30_000,
		});

		buttonCollector.on("collect", async btn => {
			await btn.deferUpdate();
			if (btn.customId == "next") {
				offset += limit;
			}
			else if (btn.customId == "prev") {
				offset -= limit;
			}

			embed = await createEmbedHistory(target);
			buttonRow = createRowHistory();

			await btn.editReply({
				embeds: [embed],
				components: [buttonRow ?? undefined],
			});
		});

		buttonCollector.on("end", async () => {
			await removeEmbedComponents(interaction);
		});
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
		previous: "Previous",
		next: "Next",
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
		previous: "Anterior",
		next: "Próximo",
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
		previous: "Anterior",
		next: "Próximo",
	},
} as const;