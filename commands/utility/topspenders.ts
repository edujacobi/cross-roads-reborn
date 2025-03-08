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
	data: new SlashCommandBuilder()
		.setName("topspenders")
		.setNameLocalization(Locale.PortugueseBR, "topgastadores")
		.setDescription("List the users who spend the most in the shops")
		.setDescriptionLocalization(Locale.PortugueseBR, "Lista os usuários que mais gastaram nas lojas"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {

		const s = Strings[language];

		await interaction.deferReply();

		let users: Users[] = [];

		const pagination = new Pagination(interaction, language);

		async function findList() {
			users = await Users.findAll({
				attributes: ["nickname", "shopSpentSum", "shopSpentCount", "id", "class"],
				limit: pagination.Limit,
				order: [["shopSpentSum", "DESC"]],
				offset: pagination.Offset,
				where: {
					shopSpentSum: {
						[Op.gt]: 0,
					},
				},
			});
		}

		pagination.HowManyRecords = await Users.count({
			where: {
				shopSpentSum: {
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
					position = BadgeString.Season6.Preppy;
				}

				moneyText += `### ${position} ${emoteClass} ${underscore}${user.nickname}${underscore}\n${formatMoney(user.shopSpentSum, language)} (${user.shopSpentCount})\n-# \`ID: ${user.id}\`\n`;
			}

			return new CustomEmbedBuilder()
				.setColor(Colors.Green)
				.setDescription(`# Ranking ${s.title}\n${moneyText}`)
				.setDefaultFooter(user.Nickname, interaction.user.avatarURL(), pagination.Showing());
		};

		await pagination.GenerateEmbed();
	},
};

const Strings = {
	[Language.English]: {
		title: "Spenders",
	},
	[Language.Portuguese]: {
		title: "Gastadores",
	},
	[Language.Spanish]: {
		title: "Gastadores",
	},
} as const;