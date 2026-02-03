import { ChatInputCommandInteraction, Colors, Locale, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Users } from "@core/database/Users";
import { Op } from "sequelize";
import { EmoteString } from "@bot/utils/emotes";
import { Pagination } from "@core/models/Pagination";
import { Language } from "@core/models/Language";
import { User } from "@core/models/User";
import { ClassList } from "@core/types/Classes";
import { showTime } from "@bot/utils/ui";
import { CustomContainerBuilder } from "@bot/ui/builders/CustomContainerBuilder";
import { deferReply } from "@bot/utils/logic";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("vips")
		.setDescription("See all VIPs and Remaining time")
		.setDescriptionLocalization(Locale.PortugueseBR, "Veja todos os VIPs e o tempo restante")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		await deferReply(interaction);

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

		pagination.CustomizeContainer = async () => {
			await findList();

			let text = "";

			for (let i = 0; i < users.length; i++) {
				const user = users[i];
				const emoteClass = ClassList[user.class].Image.Emote.String;

				const timeText = user.vipEternal ? "**Eternal**" : `Ends in ${showTime(new Date(user.vipTime!).getTime())}`;

				text += `### ${emoteClass} ${user.nickname}\n${timeText}\n-# \`ID: ${user.id}\`\n`;
			}

			return new CustomContainerBuilder()
				.setUser(user)
				.setAccentColor(Colors.Gold)
				.addTexts([
					`# ${EmoteString.VIP} VIP Users`,
				])
				.addLargeSeparator()
				.addTexts([
					text,
				]);
		};

		await pagination.GenerateContainer();
	},
};
