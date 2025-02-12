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
import { checkRooster, checkUser, removeEmbedComponents, replyInteraction } from "../../utils/logic";
import { Roosters } from "../../database/Roosters";
import { Op } from "sequelize";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { EmoteString, getRarityText, getRoosterWinrate } from "../../utils/ui";
import { getRoosterEmote } from "../../models/RoosterImage";
import { Language } from "../../models/Language";

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName("findopponent")
		.setDescription("Find opponent at your level")
		.setNameLocalization(Locale.PortugueseBR, "encontraroponente")
		.setDescriptionLocalization(Locale.PortugueseBR, "Encontre oponentes em seu nível"),

	async execute(interaction: ChatInputCommandInteraction) {

		const user = await checkUser(interaction.user.id, interaction);

		if (!user) {
			return;
		}

		const s = Strings[user.Language];

		const rooster = await checkRooster(interaction.user.id, interaction);

		if (!rooster) {
			return;
		}

		await interaction.deferReply();

		let roosterList: Roosters[] = [];
		let howManyRoosters = 0;

		let offset = 0;
		const limit = 5;
		let level = rooster.Level;

		async function findList() {
			const { count, rows } = await Roosters.findAndCountAll({
				attributes: ["name", "image", "ownerId", "wins", "losses", "rarity"],
				limit,
				offset,
				where: {
					id: {
						[Op.not]: rooster?.Id,
					},
					level: level,
					isDeleted: false,
				},
			});
			roosterList = rows;
			howManyRoosters = count;
		}

		async function createEmbed() {
			await findList();
			let text = "";

			for (let i = 0; i < roosterList.length; i++) {
				const rooster = roosterList[i];
				const user = await interaction.client.users.fetch(rooster.ownerId);

				text += `### ${getRoosterEmote(rooster.image)} ${rooster.name} (${s.of} ${user.displayName})\n${EmoteString.Victory}${rooster.wins} ${EmoteString.Defeat}${rooster.losses} ${EmoteString.Winrate}${getRoosterWinrate(rooster.wins, rooster.losses)}\n-# \`ID: ${rooster.ownerId}\`\n`;
			}

			if (text.length == 0) {
				text = s.noOpponents;
			}

			return new CustomEmbedBuilder()
				.setColor(Colors.White)
				.setDescription(`# ${s.opponentsAtLevel} ${level}\n${text}`)
				.setDefaultFooter(interaction, s.pagination(offset, limit, howManyRoosters));
		}

		let embed: CustomEmbedBuilder = await createEmbed();

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

		const buttonUp = new ButtonBuilder()
			.setCustomId("up")
			.setLabel(s.moreLevel)
			.setStyle(ButtonStyle.Secondary)
			.setEmoji("⏫");

		const buttonDown = new ButtonBuilder()
			.setCustomId("down")
			.setLabel(s.lessLevel)
			.setStyle(ButtonStyle.Secondary)
			.setEmoji("⏬");


		function createRow() {
			const rowButtons = new ActionRowBuilder<ButtonBuilder>();

			if (offset != 0) {
				rowButtons.addComponents(buttonPrevious);
			}

			if (howManyRoosters > (offset + limit)) {
				rowButtons.addComponents(buttonNext);
			}

			rowButtons.addComponents(buttonUp);

			if (level > 0) {
				rowButtons.addComponents(buttonDown);
			}

			return rowButtons;
		}


		let row = createRow();

		const response = await interaction.editReply({ embeds: [embed], components: [row] });

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
			if (btn.customId == "up") {
				level += 1;
			}
			else if (btn.customId == "down") {
				level -= 1;
			}

			embed = await createEmbed();
			row = createRow();

			await replyInteraction(interaction, { embeds: [embed], components: [row] });
		});

		collector.on("end", async () => {
			await removeEmbedComponents(interaction);
		});

	},
};

const Strings = {
	[Language.English]: {
		pagination: (offset: number, limit: number, howMany: number) => `Showing ${offset + 1} - ${offset + limit} of ${howMany} results.`,
		of: "of",
		noOpponents: "No opponents found on this level.",
		opponentsAtLevel: "Opponents at level",
		previous: "Previous",
		next: "Next",
		moreLevel: "Increase level",
		lessLevel: "Decrease level",
	},

	[Language.Portuguese]: {
		pagination: (offset: number, limit: number, howMany: number) => `Mostrando ${offset + 1} - ${offset + limit} de ${howMany} resultados.`,
		of: "de",
		noOpponents: "Nenhum oponente encontrado neste nível.",
		opponentsAtLevel: "Oponentes no nível",
		previous: "Anterior",
		next: "Próximo",
		moreLevel: "Aumentar nível",
		lessLevel: "Diminuir nível",
	},

	[Language.Spanish]: {
		pagination: (offset: number, limit: number, howMany: number) => `Mostrando ${offset + 1} - ${offset + limit} de ${howMany} resultados.`,
		of: "de",
		noOpponents: "No se encontraron oponentes en este nivel.",
		opponentsAtLevel: "Oponentes en el nivel",
		previous: "Anterior",
		next: "Siguiente",
		moreLevel: "Aumentar nivel",
		lessLevel: "Disminuir nivel",
	},
} as const;