import {
	ChatInputCommandInteraction,
	Colors,
	Locale,
	SlashCommandBuilder,
	SlashCommandSubcommandBuilder,
} from "discord.js";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { Op } from "sequelize";
import { formatMoney } from "../../utils/ui";
import { Users } from "../../database/Users";
import { User } from "../../models/User";
import { Language } from "../../models/Language";
import { ClassList } from "../../interfaces/Classes";
import { EmoteBadgeString } from "../../utils/badges";
import { Pagination } from "../../models/Pagination";
import { IDescription } from "../../interfaces/Interfaces";

enum TopSubcommand {
	Money = "money",
	Gamblers = "gamblers",
	Spenders = "spenders",
	Thieves = "thieves",
	Workers = "workers",
}

interface TopSubcommandConfig {
	attributes: string[];
	orderField: string;
	valueField: string;
	countField: string | null;
	badge: string;
	strings: IDescription;
}

interface ITopSubcommandConfig {
	[key: string]: TopSubcommandConfig;
}

module.exports = {
	cooldown: 10,
	data: new SlashCommandBuilder()
		.setName("top")
		.setNameLocalization(Locale.PortugueseBR, "top")
		.setDescription("View various top rankings")
		.setDescriptionLocalization(Locale.PortugueseBR, "Veja vários rankings de top")
		// Money subcommand
		.addSubcommand(new SlashCommandSubcommandBuilder()
			.setName(TopSubcommand.Money)
			.setNameLocalization(Locale.PortugueseBR, "grana")
			.setDescription("List the top users with money")
			.setDescriptionLocalization(Locale.PortugueseBR, "Lista os usuários com mais dinheiro"),
		)
		// Gamblers subcommand
		.addSubcommand(new SlashCommandSubcommandBuilder()
			.setName(TopSubcommand.Gamblers)
			.setNameLocalization(Locale.PortugueseBR, "apostadores")
			.setDescription("List of users who have won the most at the casino")
			.setDescriptionLocalization(Locale.PortugueseBR, "Lista os usuários que mais ganharam no cassino"),
		)
		// Spenders subcommand
		.addSubcommand(new SlashCommandSubcommandBuilder()
			.setName(TopSubcommand.Spenders)
			.setNameLocalization(Locale.PortugueseBR, "gastadores")
			.setDescription("List the users who spend the most in the shops")
			.setDescriptionLocalization(Locale.PortugueseBR, "Lista os usuários que mais gastaram nas lojas"),
		)
		// Thieves subcommand
		.addSubcommand(new SlashCommandSubcommandBuilder()
			.setName(TopSubcommand.Thieves)
			.setNameLocalization(Locale.PortugueseBR, "ladroes")
			.setDescription("List the users who stole the most")
			.setDescriptionLocalization(Locale.PortugueseBR, "Lista os usuários que mais roubaram"),
		)
		// Workers subcommand
		.addSubcommand(new SlashCommandSubcommandBuilder()
			.setName(TopSubcommand.Workers)
			.setNameLocalization(Locale.PortugueseBR, "trabalhadores")
			.setDescription("List the users who work the most")
			.setDescriptionLocalization(Locale.PortugueseBR, "Lista os usuários que mais trabalharam"),
		),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const subcommand = interaction.options.getSubcommand();
		
		await interaction.deferReply();

		const defaultAttributes = ["nickname", "id", "class"];

		// Define configuration for each subcommand
		const config: ITopSubcommandConfig = {
			[TopSubcommand.Money]: {
				attributes: [...defaultAttributes, "money"],
				orderField: "money",
				valueField: "money",
				countField: null,
				badge: EmoteBadgeString.Season1.Top1Money,
				strings: {
					[Language.English]: "Money",
					[Language.Portuguese]: "Grana",
					[Language.Spanish]: "Dinero",
				},
			},
			[TopSubcommand.Gamblers]: {
				attributes: [...defaultAttributes, "casinoWinSum", "casinoWinCount"],
				orderField: "casinoWinSum",
				valueField: "casinoWinSum",
				countField: "casinoWinCount",
				badge: EmoteBadgeString.Season6.EliteTrader,
				strings: {
					[Language.English]: "Gamblers",
					[Language.Portuguese]: "Apostadores",
					[Language.Spanish]: "Apostadores",
				},
			},
			[TopSubcommand.Spenders]: {
				attributes: [...defaultAttributes, "shopSpentSum", "shopSpentCount"],
				orderField: "shopSpentSum",
				valueField: "shopSpentSum",
				countField: "shopSpentCount",
				badge: EmoteBadgeString.Season6.Preppy,
				strings: {
					[Language.English]: "Spenders",
					[Language.Portuguese]: "Gastadores",
					[Language.Spanish]: "Gastadores",
				},
			},
			[TopSubcommand.Thieves]: {
				attributes: [...defaultAttributes, "robberySuccessRobbedSum", "robberySuccessCount"],
				orderField: "robberySuccessRobbedSum",
				valueField: "robberySuccessRobbedSum",
				countField: "robberySuccessCount",
				badge: EmoteBadgeString.Season6.SillyHand,
				strings: {
					[Language.English]: "Thieves",
					[Language.Portuguese]: "Ladrões",
					[Language.Spanish]: "Ladrones",
				},
			},
			[TopSubcommand.Workers]: {
				attributes: [...defaultAttributes, "jobReceivedSum", "jobReceivedCount"],
				orderField: "jobReceivedSum",
				valueField: "jobReceivedSum",
				countField: "jobReceivedCount",
				badge: EmoteBadgeString.Season6.Workaholic,
				strings: {
					[Language.English]: "Workers",
					[Language.Portuguese]: "Trabalhadores",
					[Language.Spanish]: "Trabajadores",
				},
			},
		};

		// Get the configuration for the current subcommand
		const currentConfig = config[subcommand];
		const title = currentConfig.strings[language];
		
		let users: Users[] = [];
		const pagination = new Pagination(interaction, language);

		async function findList() {
			users = await Users.findAll({
				attributes: currentConfig.attributes,
				limit: pagination.Limit,
				order: [[currentConfig.orderField, "DESC"]],
				offset: pagination.Offset,
				where: {
					[currentConfig.orderField]: {
						[Op.gt]: 0,
					},
				},
			});
		}

		pagination.HowManyRecords = await Users.count({
			where: {
				[currentConfig.orderField]: {
					[Op.gt]: 0,
				},
			},
		});

		pagination.CustomizeEmbed = async () => {
			await findList();

			let text = "";

			for (let i = 0; i < users.length; i++) {
				const user = users[i];
				const underscore = user.id == interaction.user.id ? "__" : "";
				const emoteClass = ClassList[user.class].Image.Emote.String;

				let position = `\`${i + pagination.Offset + 1}.\``;
				if (i + pagination.Offset == 0) {
					position = currentConfig.badge;
				}
				// Special case for money ranking which has badges for top 3
				if (subcommand === TopSubcommand.Money) {
					if (i + pagination.Offset == 1) {
						position = EmoteBadgeString.Season1.Top2Money;
					}
					else if (i + pagination.Offset == 2) {
						position = EmoteBadgeString.Season1.Top3Money;
					}
				}

				const value = user[currentConfig.valueField as keyof Users] as number;
				const count = currentConfig.countField ? ` (${user[currentConfig.countField as keyof Users]})` : "";

				console.log(value, count);

				text += `### ${position} ${emoteClass} ${underscore}${user.nickname}${underscore}\n${formatMoney(value, language)}${count}\n-# \`ID: ${user.id}\`\n`;
			}

			return new CustomEmbedBuilder()
				.setColor(Colors.Green)
				.setDescription(`# Ranking ${title}\n${text}`)
				.setUserFooter({
					nickname: user.Nickname,
					image: interaction.user.avatarURL(),
					text: pagination.Showing(),
				});
		};

		await pagination.GenerateEmbed();
	},
};