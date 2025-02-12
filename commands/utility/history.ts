import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	ComponentType,
	Locale,
	MessageComponentInteraction,
	SlashCommandBuilder,
	SlashCommandUserOption,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} from "discord.js";
import { Rooster } from "../../models/Rooster";
import { checkRooster, removeEmbedComponents, replyInteraction, sendPrivateMessage } from "../../utils/logic";
import { EmoteId, EmoteString, formatDate, getRarityColor, showTime } from "../../utils/ui";
import { Roosters } from "../../database/Roosters";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { BattleHistory } from "../../models/BattleHistory";
import { BattleType } from "../../models/Battle";
import { getRoosterEmote } from "../../models/RoosterImage";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("history")
		.setDescription("Shows the history of battles of a Rooster")
		.setNameLocalization(Locale.PortugueseBR, "historico")
		.setDescriptionLocalization(Locale.PortugueseBR, "Mostra o histórico de batalhas de um galo")
		.addUserOption((option: SlashCommandUserOption) =>
			option
				.setName("target")
				.setDescription("The user's rooster to show")
				.setNameLocalization(Locale.PortugueseBR, "alvo")
				.setDescriptionLocalization(Locale.PortugueseBR, "O dono do galo para mostrar"),
		),

	async execute(interaction: ChatInputCommandInteraction) {

		const user = interaction.options.getUser("target") ?? interaction.user;

		const rooster = await checkRooster(user.id, interaction);

		if (!rooster) {
			return;
		}

		await interaction.deferReply();

		let offset = 0;
		const limit = 5;
		let battleHistories: BattleHistory[] = [];

		const select = new StringSelectMenuBuilder()
			.setCustomId("select")
			.setPlaceholder("Select a battle to download");

		const howManyBattles = await BattleHistory.Count(rooster.Id);

		async function createEmbedHistory(rooster: Rooster) {

			battleHistories = await BattleHistory.GetList(rooster.Id, limit, offset);

			let historyList = "";

			select.setOptions();

			if (battleHistories.length == 0) {
				historyList = "\nThis rooster doesn't have a history";
			}

			for (let i = 0; i < battleHistories.length; i++) {
				const battle = battleHistories[i];

				const emoji = battle.WinnerId == rooster.Id ? EmoteString.Victory : EmoteString.Defeat;
				const text = battle.WinnerId == rooster.Id ? "Victory" : "Defeat";
				const challenger = await Roosters.findByPk(battle.ChallengerId);
				const opponent = await Roosters.findByPk(battle.OpponentId);

				if (!challenger || !opponent) {
					continue;
				}

				const boldC = `${challenger.ownerId == user.id ? "**" : ""}`;
				const boldO = `${opponent.ownerId == user.id ? "**" : ""}`;

				const challengerName = `${boldC}${getRoosterEmote(challenger.image)} ${challenger.name}${boldC}`;
				const opponentName = `${boldO}${getRoosterEmote(opponent.image)} ${opponent.name}${boldO}`;

				historyList += `### ${emoji} ${text}\n${challengerName} (${battle.ChallengerLevel}) vs ${opponentName} (${battle.OpponentLevel})\n\`ID: ${battle.Id}. ${formatDate(battle.CreatedAt)}\`${battle.Type == BattleType.Championship ? ` • ${EmoteString.CampeaoCanja} **Championship**` : ""} \n`;

				select.addOptions([new StringSelectMenuOptionBuilder()
					.setLabel(`${challenger.name} vs ${opponent.name}`)
					.setValue(String(battle.Id))
					.setDescription(`ID: ${battle.Id}${battle.Type == BattleType.Championship ? ` • Championship` : ""}`)
					.setEmoji(battle.WinnerId == rooster.Id ? EmoteId.Victory : EmoteId.Defeat)]);
			}

			return new CustomEmbedBuilder()
				.setTitle(`Battle history of ${rooster.Name}`)
				.setThumbnail(rooster.GetImage())
				.setColor(getRarityColor(rooster.Rarity))
				.setDescription(`${rooster.GetNameWithImage()} has ${EmoteString.Victory}\`${rooster.Wins}\` victories and ${EmoteString.Defeat}\`${rooster.Losses}\` defeats, with a ${EmoteString.Winrate}win rate of \`${rooster.GetWinrate()}\`\n${historyList}`)
				.setDefaultFooter(interaction, `Showing ${offset + 1} - ${offset + limit} of ${howManyBattles} results.`);
		}

		const buttonPrevious = new ButtonBuilder()
			.setCustomId("prev")
			.setLabel("Previous")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji("⬅️");

		const buttonNext = new ButtonBuilder()
			.setCustomId("next")
			.setLabel("Next")
			.setStyle(ButtonStyle.Secondary)
			.setEmoji("➡️");

		function createRowHistory() {
			const rowButtons = new ActionRowBuilder<ButtonBuilder>();

			if (offset != 0) {
				rowButtons.addComponents([buttonPrevious]);
			}

			if (howManyBattles > (offset + limit)) {
				rowButtons.addComponents([buttonNext]);
			}

			return rowButtons;
		}

		let embed = await createEmbedHistory(rooster);

		let buttonRow = createRowHistory();

		const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>()
			.addComponents(select);

		const components = [];

		if (buttonRow.components.length > 0) {
			components.push(buttonRow);
		}

		if (selectRow.components.length > 0 && selectRow.components[0].options.length > 0) {
			components.push(selectRow);
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

			embed = await createEmbedHistory(rooster);
			buttonRow = createRowHistory();

			await btn.editReply({
				embeds: [embed],
				components: [buttonRow ?? undefined, selectRow ?? undefined],
			});
		});

		buttonCollector.on("end", async () => {
			await removeEmbedComponents(interaction);
		});

		const selectCollector = response?.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === interaction.user.id,
			componentType: ComponentType.StringSelect,
			time: 60_000,
		});

		selectCollector?.on("collect", async select => {
			await select.deferUpdate();

			const battleText = await BattleHistory.GetBattleText(Number(select.values[0]));

			if (battleText) {
				await sendPrivateMessage(interaction.user.id, battleText);
			}
		});
	},
};