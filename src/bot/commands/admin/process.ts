import { type ChatInputCommandInteraction, Locale, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { getClient } from "#bot/client";
import { replyWithContainer } from "#bot/utils/discordInteractions";
import { CrColors } from "#bot/utils/colors";
import { Users } from "#core/database/Users";
import { Op } from "sequelize";
import { subMinutes, intervalToDuration } from "date-fns";
import { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import type { User } from "#core/models/User";
import { EmoteString } from "#bot/utils/emotes";
import { Language } from "#core/models/Language";

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

		const duration = intervalToDuration({ start: 0, end: client.uptime ?? 0 });
		const uptimeParts = [];
		if (duration.days) uptimeParts.push(`${duration.days}d`);
		if (duration.hours || duration.days) uptimeParts.push(`${duration.hours ?? 0}h`);
		uptimeParts.push(`${duration.minutes ?? 0}m`);
		const uptime = uptimeParts.join(" ");

		const memoryUsage = process.memoryUsage().heapUsed / 1_024 / 1_024; // Convert to MB

		const container = new CustomContainerBuilder()
			.setAccentColor(CrColors.Admin)
			.setUser(user)
			.addSectionComponents(section => section
				.setThumbnailAccessory(thumb => thumb
					.setURL(client.user?.avatarURL() ?? ""),
				)
				.addTexts([
					`-# ${s.uptime}`,
					`## ${uptime}`,

					`-# ${s.memoryUsage}`,
					`## ${memoryUsage.toFixed(1)} MB`,

					`-# ${s.nodeVersion}`,
					`## ${process.version}`,

					`-# ${s.ping}`,
					`## ${client.ws.ping} ms`,

					`-# ${s.activePlayers}`,
					`## ${playerCount} (${EmoteString.Online}${onlineUsers} online)`,
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
		nodeVersion: "Node version",
		ping: "Ping",
	},
	[Language.Portuguese]: {
		uptime: "Tempo de atividade",
		memoryUsage: "Uso de memória",
		activePlayers: "Jogadores ativos",
		nodeVersion: "Versão do Node",
		ping: "Ping",
	},
	[Language.Spanish]: {
		uptime: "Tiempo de actividad",
		memoryUsage: "Uso de memoria",
		activePlayers: "Jugadores activos",
		nodeVersion: "Versión de Node",
		ping: "Ping",
	},
};