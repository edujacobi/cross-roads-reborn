import {
	ChatInputCommandInteraction,
	Locale,
	MessageFlags,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import { getClient } from "../../client";
import { replyInteraction } from "../../utils/logic";
import { CrColors } from "../../utils/colors";
import { Users } from "../../database/Users";
import { Op } from "sequelize";
import { subMinutes } from "date-fns";
import { CustomContainerBuilder } from "../../ui/builders/CustomContainerBuilder";
import { User } from "../../models/User";
import { EmoteString } from "../../utils/emotes";
import { Language } from "../../models/Language";

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
		const availableMemory = process.availableMemory() / 1024 / 1024; // Convert to MB

		const container = new CustomContainerBuilder()
			.setAccentColor(CrColors.Admin)
			.setUser(user)
			.addSectionComponents(section => section
				.setThumbnailAccessory(thumb => thumb
					.setURL(client.user?.avatarURL() ?? ""),
				)
				.addTextDisplayComponents(text => text
					.setContent([
						`-# ${s.uptime}`,
						`# ${uptime} min`,
						`-# ${s.memoryUsage}`,
						`# ${memoryUsage.toFixed(1)} MB / ${availableMemory.toFixed(1)} MB`,
						`-# ${s.activePlayers}`,
						`# ${playerCount} (${EmoteString.Online}${onlineUsers} online)`,
					].join("\n")),
				),
			)
			.addFooter();

		await replyInteraction(interaction, { components: [container], flags: MessageFlags.IsComponentsV2 });
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