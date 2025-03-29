import { ChatInputCommandInteraction, Colors, Locale, SlashCommandBuilder } from "discord.js";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { Op } from "sequelize";
import { formatMoney } from "../../utils/ui";
import { Users } from "../../database/Users";
import { User } from "../../models/User";
import { Language } from "../../models/Language";
import { ClassList } from "../../interfaces/Classes";
import { BadgeString } from "../../utils/badges";
import { Pagination } from "../../models/Pagination";

module.exports = {
	cooldown: 10,
	data: new SlashCommandBuilder()
		.setName("topworkers")
		.setNameLocalization(Locale.PortugueseBR, "toptrabalhadores")
		.setDescription("List the users who work the most")
		.setDescriptionLocalization(Locale.PortugueseBR, "Lista os usuários que mais trabalharam"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {

		const s = Strings[language];

		await interaction.deferReply();

		let users: Users[] = [];

		const pagination = new Pagination(interaction, language);

		async function findList() {
			users = await Users.findAll({
				attributes: ["nickname", "jobReceivedSum", "jobReceivedCount", "id", "class"],
				limit: pagination.Limit,
				order: [["jobReceivedSum", "DESC"]],
				offset: pagination.Offset,
				where: {
					jobReceivedSum: {
						[Op.gt]: 0,
					},
				},
			});
		}

		pagination.HowManyRecords = await Users.count({
			where: {
				jobReceivedSum: {
					[Op.gt]: 0,
				},
			},
		});

		pagination.CustomizeEmbed = async () => {
			await findList();

			let moneyText = "";

			for (let i = 0; i < users.length; i++) {
				const user = users[i];
				const underscore = user.id == interaction.user.id ? "__" : "";
				const emoteClass = ClassList[user.class].Image.Emote.String;

				let position = `\`${i + pagination.Offset + 1}.\``;
				if (i + pagination.Offset == 0) {
					position = BadgeString.Season6.Workaholic;
				}

				moneyText += `### ${position} ${emoteClass} ${underscore}${user.nickname}${underscore}\n${formatMoney(user.jobReceivedSum, language)} (${user.jobReceivedCount})\n-# \`ID: ${user.id}\`\n`;
			}

			return new CustomEmbedBuilder()
				.setColor(Colors.Green)
				.setDescription(`# Ranking ${s.title}\n${moneyText}`)
				.setUserFooter({
					nickname: user.Nickname,
					image: interaction.user.avatarURL(),
					text: pagination.Showing()
				});
		};

		await pagination.GenerateEmbed();
	},
};

const Strings = {
	[Language.English]: {
		title: "Workers",
	},
	[Language.Portuguese]: {
		title: "Trabalhadores",
	},
	[Language.Spanish]: {
		title: "Trabajadores",
	},
} as const;