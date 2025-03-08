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
		.setName("topthieves")
		.setNameLocalization(Locale.PortugueseBR, "topladroes")
		.setDescription("List the users who stole the most")
		.setDescriptionLocalization(Locale.PortugueseBR, "Lista os usuários que mais roubaram"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {

		const s = Strings[language];

		await interaction.deferReply();

		let users: Users[] = [];

		const pagination = new Pagination(interaction, language);

		async function findList() {
			users = await Users.findAll({
				attributes: ["nickname", "robberySuccessRobbedSum", "robberySuccessCount", "id", "class"],
				limit: pagination.Limit,
				order: [["robberySuccessRobbedSum", "DESC"]],
				offset: pagination.Offset,
				where: {
					robberySuccessRobbedSum: {
						[Op.gt]: 0,
					},
				},
			});
		}

		pagination.HowManyRecords = await Users.count({
			where: {
				robberySuccessRobbedSum: {
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
					position = BadgeString.Season6.SillyHand;
				}

				moneyText += `### ${position} ${emoteClass} ${underscore}${user.nickname}${underscore}\n${formatMoney(user.robberySuccessRobbedSum, language)} (${user.robberySuccessCount})\n-# \`ID: ${user.id}\`\n`;
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
		title: "Thieves",
	},
	[Language.Portuguese]: {
		title: "Ladrões",
	},
	[Language.Spanish]: {
		title: "Ladrones",
	},
} as const;