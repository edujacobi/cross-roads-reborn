import { ChatInputCommandInteraction, Colors, Locale, SlashCommandBuilder } from "discord.js";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { Op } from "sequelize";
import { formatMoney } from "../../utils/ui";
import { Users } from "../../database/Users";
import { User } from "../../models/User";
import { Language } from "../../models/Language";
import { ClassList } from "../../models/Class";
import { BadgeString } from "../../utils/badges";
import { Pagination } from "../../models/Pagination";

module.exports = {
	cooldown: 10,
	vip: true,
	data: new SlashCommandBuilder()
		.setName("topgamblers")
		.setNameLocalization(Locale.PortugueseBR, "topapostadores")
		.setDescription("List of users who have won the most at the casino")
		.setDescriptionLocalization(Locale.PortugueseBR, "Lista os usuários que mais ganharam no cassino"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {

		const s = Strings[language];

		await interaction.deferReply();

		let users: Users[] = [];

		const pagination = new Pagination(interaction, language);

		async function findList() {
			users = await Users.findAll({
				attributes: ["nickname", "casinoWinSum", "casinoWinCount", "id", "class"],
				limit: pagination.Limit,
				order: [["casinoWinSum", "DESC"]],
				offset: pagination.Offset,
				where: {
					casinoWinSum: {
						[Op.gt]: 0,
					},
				},
			});
		}

		pagination.HowManyRecords = await Users.count({
			where: {
				casinoWinSum: {
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
					position = BadgeString.Season6.TraderElite;
				}

				moneyText += `### ${position} ${emoteClass} ${underscore}${user.nickname}${underscore}\n${formatMoney(user.casinoWinSum, language)} (${user.casinoWinCount})\n-# \`ID: ${user.id}\`\n`;
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
		title: "Gamblers",
	},
	[Language.Portuguese]: {
		title: "Apostadores",
	},
	[Language.Spanish]: {
		title: "Apostadores",
	},
} as const;