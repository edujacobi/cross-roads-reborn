import { ChatInputCommandInteraction, Locale, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { getClient } from "../../client";
import { replyWithContainer } from "@bot/utils/discordInteractions";
import { CrColors } from "@bot/utils/colors";
import { Users } from "@core/database/Users";
import { Op } from "sequelize";
import { subMinutes } from "date-fns";
import { CustomContainerBuilder } from "@bot/ui/builders/CustomContainerBuilder";
import { User } from "@core/models/User";
import { EmoteString } from "@bot/utils/emotes";
import { Language } from "@core/models/Language";

module.exports = {
	data: new SlashCommandBuilder()
		.setName("process")
		.setDescription("See Node process data")
		.setDescriptionLocalization(Locale.PortugueseBR, "Veja dados do processo Node")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	async execute(interaction: ChatInputCommandInteraction, user: User, language: Language) {
		const s = Strings[language];

		const client = getClient();

		const playerCount = await Users.count({
			where: {
				class: {
					[Op.not]: 0,
				},
			},
		});

		const onlineUsers = client.userLastCommand.filter(time => new Date(time) > subMinutes(new Date(), 15)).size;
		const uptime = client.uptime ? Math.floor(client.uptime / 1000 / 60) : 0;
		const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // Convert to MB

		const container = new CustomContainerBuilder()
			.setAccentColor(CrColors.Admin)
			.setUser(user)
			.addSectionComponents(section => section
				.setThumbnailAccessory(thumb => thumb
					.setURL(client.user?.avatarURL() ?? ""),
				)
				.addTexts([
					`-# ${s.uptime}`,
					`# ${uptime} min`,
					`-# ${s.memoryUsage}`,
					`# ${memoryUsage.toFixed(1)} MB`,
					`-# ${s.activePlayers}`,
					`# ${playerCount} (${EmoteString.Online}${onlineUsers} online)`,
				]),
			)
			.addFooter();

		return replyWithContainer(interaction, container);
	},
};

const Strings = {
	[Language.English]: {
		uptime: "Uptime",
		memoryUsage: "Memory usage",
		activePlayers: "Active players",
	},
	[Language.Portuguese]: {
		uptime: "Tempo de atividade",
		memoryUsage: "Uso de memória",
		activePlayers: "Jogadores ativos",
	},
	[Language.Spanish]: {
		uptime: "Tiempo de actividad",
		memoryUsage: "Uso de memoria",
		activePlayers: "Jugadores activos",
	},
};