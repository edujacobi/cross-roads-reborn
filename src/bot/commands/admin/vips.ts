import { type ChatInputCommandInteraction, Colors, Locale, PermissionFlagsBits, SlashCommandBuilder, time, TimestampStyles } from "discord.js";
import { UserRepository } from "#core/repositories/UserRepository";
import type { Users } from "#core/database/Users";
import { EmoteString } from "#bot/utils/emotes";
import { Pagination } from "#core/models/Pagination";
import type { Language } from "#core/models/Language";
import type { User } from "#core/models/User";
import { ClassList } from "#core/types/Classes";
import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { deferReply } from "#bot/utils/discordInteractions";

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

		async function findList() {
			users = await UserRepository.FindAllVips(pagination.Limit, pagination.Offset);
		}

		pagination.HowManyRecords = await UserRepository.CountVips();

		pagination.CustomizeContainer = async () => {
			await findList();

			let text = "";

			for (let i = 0; i < users.length; i++) {
				const user = users[i];
				const emoteClass = ClassList[user.class].Image.Emote.String;

				const timeText = user.vipEternal ? "**Eternal**" : `Ends in ${time(user.vipTime!, TimestampStyles.ShortDateTime)}`;

				text += `### ${emoteClass} ${user.nickname}\n${timeText}\n-# \`Id: ${user.id}\`\n`;
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
