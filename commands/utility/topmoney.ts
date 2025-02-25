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
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { removeEmbedComponents } from "../../utils/logic";
import { Op } from "sequelize";
import { formatMoney } from "../../utils/ui";
import { EmoteString } from "../../utils/emotes";
import { Users } from "../../database/Users";
import { User } from "../../models/User";
import { Language } from "../../models/Language";
import { ClassList } from "../../models/Class";

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName("topmoney")
		.setNameLocalization(Locale.PortugueseBR, "topgrana")
		.setDescription("List the top users with money")
		.setDescriptionLocalization(Locale.PortugueseBR, "Lista os usuários com mais dinheiro"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {

		const s = Strings[language];

		await interaction.deferReply();

		let users: Users[] = [];

		let offset = 0;
		const limit = 5;

		async function findList() {

			users = await Users.findAll({
				attributes: ["nickname", "money", "id", "class"],
				limit,
				order: [["money", "DESC"]],
				offset,
				where: {
					money: {
						[Op.gt]: 0,
					},
				},
			});
		}

		const howManyUsers = await Users.count({
			where: {
				money: {
					[Op.gt]: 0,
				},
			},
		});

		async function createEmbedRanking() {

			await findList();

			let moneyText = "";

			for (let i = 0; i < users.length; i++) {
				const user = users[i];
				const underscore = user.id == interaction.user.id ? "__" : "";

				moneyText += `### \`${i + offset + 1}.\` ${ClassList[user.class].Image.Emote.String} ${underscore}${user.nickname}${underscore}\n${formatMoney(user.money, language)}\n-# \`ID: ${user.id}\`\n`;
			}

			return new CustomEmbedBuilder()
				.setColor(Colors.Green)
				.setDescription(`# ${EmoteString.TopMoney} Ranking ${s.title}\n${moneyText}`)
				.setDefaultFooter(user.Nickname, interaction.user.avatarURL(), s.showing(offset, limit, howManyUsers));
		}

		let embed: CustomEmbedBuilder = await createEmbedRanking();

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


		function createRowRanking() {
			const rowButtons = new ActionRowBuilder<ButtonBuilder>();

			if (offset != 0) {
				rowButtons.addComponents(buttonPrevious);
			}

			if (howManyUsers > (offset + limit)) {
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

const Strings = {
	[Language.English]: {
		title: "Money",
		showing: (offset: number, limit: number, howMany: number) => `Showing ${offset + 1} - ${offset + limit} of ${howMany} results.`,
		next: "Next",
		previous: "Previous",
	},
	[Language.Portuguese]: {
		title: "Grana",
		showing: (offset: number, limit: number, howMany: number) => `Exibindo ${offset + 1} - ${offset + limit} de ${howMany} resultados.`,
		next: "Próximo",
		previous: "Anterior",
	},
	[Language.Spanish]: {
		title: "Dinero",
		showing: (offset: number, limit: number, howMany: number) => `Mostrando ${offset + 1} - ${offset + limit} de ${howMany} resultados.`,
		next: "Siguiente",
		previous: "Anterior",
	},
};