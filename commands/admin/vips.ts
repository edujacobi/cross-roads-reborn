import { ChatInputCommandInteraction, Colors, Locale, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { CustomEmbedBuilder } from "../../models/CustomEmbedBuilder";
import { Users } from "../../database/Users";
import { Op } from "sequelize";
import { EmoteString } from "../../utils/emotes";
import { Pagination } from "../../models/Pagination";
import { Language } from "../../models/Language";
import { User } from "../../models/User";
import { ClassList } from "../../interfaces/Classes";
import { showTime } from "../../utils/ui";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("vips")
		.setDescription("See all VIPs and Remaining time")
		.setDescriptionLocalization(Locale.PortugueseBR, "Veja todos os VIPs e o tempo restante")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {

		await interaction.deferReply();

		let users: Users[] = [];
		const pagination = new Pagination(interaction, language);

		const where = {
			[Op.or]: {
				vipTime: {
					[Op.gt]: new Date(),
				},
				vipEternal: {
					[Op.not]: false,
				},
			},
		};

		async function findList() {
			users = await Users.findAll({
				where,
				limit: pagination.Limit,
				order: [["vipTime", "DESC"]],
				offset: pagination.Offset,
			});
		}

		pagination.HowManyRecords = await Users.count({ where });

		pagination.CustomizeEmbed = async () => {
			await findList();

			let text = "";

			for (let i = 0; i < users.length; i++) {
				const user = users[i];
				const emoteClass = ClassList[user.class].Image.Emote.String;

				const timeText = user.vipEternal ? "**Eternal**" : `Ends in ${showTime(new Date(user.vipTime!).getTime())}`;

				text += `### ${emoteClass} ${user.nickname}\n${timeText}\n-# \`ID: ${user.id}\`\n`;
			}

			return new CustomEmbedBuilder()
				.setColor(Colors.Gold)
				.setDescription(`# ${EmoteString.VIP} VIP Users\n${text}`)
				.setUserFooter({
					nickname: user.Nickname,
					image: interaction.user.avatarURL(),
					text: pagination.Showing(),
				});
		};

		await pagination.GenerateEmbed();
	},
};
