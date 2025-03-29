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
		.setName("topmoney")
		.setNameLocalization(Locale.PortugueseBR, "topgrana")
		.setDescription("List the top users with money")
		.setDescriptionLocalization(Locale.PortugueseBR, "Lista os usuários com mais dinheiro"),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {

		const s = Strings[language];

		await interaction.deferReply();

		let users: Users[] = [];

		const pagination = new Pagination(interaction, language);

		async function findList() {
			users = await Users.findAll({
				attributes: ["nickname", "money", "id", "class"],
				limit: pagination.Limit,
				order: [["money", "DESC"]],
				offset: pagination.Offset,
				where: {
					money: {
						[Op.gt]: 0,
					},
				},
			});
		}

		pagination.HowManyRecords = await Users.count({
			where: {
				money: {
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
					position = BadgeString.Season1.Top1Money;
				}
				else if (i + pagination.Offset == 1) {
					position = BadgeString.Season1.Top2Money;
				}
				else if (i + pagination.Offset == 2) {
					position = BadgeString.Season1.Top3Money;
				}

				moneyText += `### ${position} ${emoteClass} ${underscore}${user.nickname}${underscore}\n${formatMoney(user.money, language)}\n-# \`ID: ${user.id}\`\n`;
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
		title: "Money",
	},
	[Language.Portuguese]: {
		title: "Grana",
	},
	[Language.Spanish]: {
		title: "Dinero",
	},
} as const;