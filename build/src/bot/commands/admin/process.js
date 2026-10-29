"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const client_1 = require("#bot/client");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const colors_1 = require("#bot/utils/colors");
const UserRepository_1 = require("#core/repositories/UserRepository");
const date_fns_1 = require("date-fns");
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const emotes_1 = require("#bot/utils/emotes");
const Language_1 = require("#core/models/Language");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("process")
        .setDescription("See Node process data")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Veja dados do processo Node")
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator),
    async execute(interaction, user, language) {
        const s = Strings[language];
        const client = (0, client_1.getClient)();
        const playerCount = await UserRepository_1.UserRepository.CountActivePlayers();
        const onlineUsers = client.userLastCommand.filter(time => new Date(time) > (0, date_fns_1.subMinutes)(new Date(), 15)).size;
        const duration = (0, date_fns_1.intervalToDuration)({ start: 0, end: client.uptime ?? 0 });
        const uptimeParts = [];
        if (duration.days)
            uptimeParts.push(`${duration.days}d`);
        if (duration.hours || duration.days)
            uptimeParts.push(`${duration.hours ?? 0}h`);
        uptimeParts.push(`${duration.minutes ?? 0}m`);
        const uptime = uptimeParts.join(" ");
        const memoryUsage = process.memoryUsage().heapUsed / 1_024 / 1_024; // Convert to MB
        const container = new CustomContainerBuilder_1.CustomContainerBuilder()
            .setAccentColor(colors_1.CrColors.Admin)
            .setUser(user)
            .addSectionComponents(section => section
            .setThumbnailAccessory(thumb => thumb
            .setURL(client.user?.avatarURL() ?? ""))
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
            `## ${playerCount} (${emotes_1.EmoteString.Online}${onlineUsers} online)`,
        ]))
            .addFooter();
        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
    },
};
const Strings = {
    [Language_1.Language.English]: {
        uptime: "Uptime",
        memoryUsage: "Memory usage",
        activePlayers: "Active players",
        nodeVersion: "Node version",
        ping: "Ping",
    },
    [Language_1.Language.Portuguese]: {
        uptime: "Tempo de atividade",
        memoryUsage: "Uso de memória",
        activePlayers: "Jogadores ativos",
        nodeVersion: "Versão do Node",
        ping: "Ping",
    },
    [Language_1.Language.Spanish]: {
        uptime: "Tiempo de actividad",
        memoryUsage: "Uso de memoria",
        activePlayers: "Jugadores activos",
        nodeVersion: "Versión de Node",
        ping: "Ping",
    },
};
//# sourceMappingURL=process.js.map