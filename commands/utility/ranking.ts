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
} from "discord.js";
import { Roosters } from "../../database/Roosters";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { removeEmbedComponents } from "../../utils/logic";
import { Op } from "sequelize";
import { getRoosterEmote } from "../../models/RoosterImage";
import { EmoteString, getRoosterWinrate } from "../../utils/ui";

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName("ranking")
		.setDescription("List the top rooster from Battle Roosters Arena")
		.setDescriptionLocalization(Locale.PortugueseBR, "Liste os top galos do Battle Roosters Arena"),

	async execute(interaction: ChatInputCommandInteraction) {

		await interaction.deferReply();

		let roosterListWins: Roosters[] = [];
		let roosterListLevel: Roosters[] = [];

		let offset = 0;
		const limit = 5;

		async function findList() {

			roosterListWins = await Roosters.findAll({
				attributes: ["name", "wins", "losses", "nationality", "ownerId", "image"],
				limit,
				order: [["wins", "DESC"]],
				offset,
				where: {
					wins: {
						[Op.gt]: 0,
					},
					isDeleted: false,
				},
			});

			roosterListLevel = await Roosters.findAll({
				attributes: ["name", "level", "exp", "nationality", "ownerId", "image"],
				limit,
				order: [["level", "DESC"], ["exp", "DESC"]],
				offset,
				where: {
					wins: {
						[Op.gt]: 0,
					},
					isDeleted: false,
				},
			});
		}

		const howManyRoosters = await Roosters.count({
			where: {
				wins: {
					[Op.gt]: 0,
				},
				isDeleted: false,
			},
		});

		async function createEmbedRanking() {

			await findList();

			let levelExpText = "";
			let winsLossesText = "";

			for (let i = 0; i < roosterListLevel.length; i++) {
				const rooster = roosterListLevel[i];
				const underscore = rooster.ownerId == interaction.user.id ? "__" : "";
				const user = await interaction.client.users.fetch(rooster.ownerId);

				levelExpText += `### \`${i + offset + 1}.\` ${getRoosterEmote(rooster.image)} ${underscore}${rooster.name} (of ${user.displayName})${underscore}\n${EmoteString.Experience}Level ${rooster.level} (${rooster.exp} exp)\n-# \`ID: ${rooster.ownerId}\`\n`;
			}

			for (let i = 0; i < roosterListWins.length; i++) {
				const rooster = roosterListWins[i];
				const underscore = rooster.ownerId == interaction.user.id ? "__" : "";
				const user = await interaction.client.users.fetch(rooster.ownerId);

				winsLossesText += `### \`${i + offset + 1}.\` ${getRoosterEmote(rooster.image)} ${underscore}${rooster.name} (of ${user.displayName})${underscore}\n${EmoteString.Victory}${rooster.wins} ${EmoteString.Defeat}${rooster.losses} ${EmoteString.Winrate}${getRoosterWinrate(rooster.wins, rooster.losses)}\n-# \`ID: ${rooster.ownerId}\`\n`;
			}

			return new CustomEmbedBuilder()
				// .setTitle("Ranking")
				// .setThumbnail("https://i.imgur.com/KclS7D3.jpeg")
				.setColor(Colors.White)
				// .addFields([
				// 	{name: "## Level (exp)", value: levelExpList, inline: true},
				// 	{name: "## Wins / Losses", value: winsLossesList, inline: true}
				// ])
				.setDescription(`# Ranking\n## Level (exp)\n${levelExpText}\n## Victories / Defeats / Win rate\n${winsLossesText}`)
				.setDefaultFooter(interaction, `Showing ${offset + 1} - ${offset + limit} of ${howManyRoosters} results.`);
		}

		let embed: CustomEmbedBuilder = await createEmbedRanking();

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


		function createRowRanking() {
			const rowButtons = new ActionRowBuilder<ButtonBuilder>();

			if (offset != 0) {
				rowButtons.addComponents(buttonPrevious);
			}

			if (howManyRoosters > (offset + limit)) {
				rowButtons.addComponents(buttonNext);
			}

			return rowButtons;
		}

		const components = [];

		let row = createRowRanking();

		if (row.components.length > 0) {
			components.push(row);
		}

		const response = await interaction.editReply({
			embeds: [embed],
			components: components ?? undefined,
		});

		const collector = response.createMessageComponentCollector({
			filter: (i: MessageComponentInteraction) => i.user.id === interaction.user.id,
			componentType: ComponentType.Button,
			idle: 30_000,
		});

		collector.on("collect", async btn => {
			await btn.deferUpdate();

			if (btn.customId == "next") {
				offset += limit;
			}
			else if (btn.customId == "prev") {
				offset -= limit;
			}

			embed = await createEmbedRanking();
			row = createRowRanking();

			await interaction.editReply({ embeds: [embed], components: [row] });
		});

		collector.on("end", async () => {
			await removeEmbedComponents(interaction);
		});

	},
};