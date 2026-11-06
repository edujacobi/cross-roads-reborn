"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
const badges_1 = require("#bot/utils/badges");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const Language_1 = require("#core/models/Language");
const discord_js_1 = require("discord.js");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("updates")
        .setDescription("Latest updates from Cross Roads!")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "atualizações")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Últimas atualizações do Cross Roads!")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "actualizaciones")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "¡Últimas actualizaciones de Cross Roads!"),
    async execute(interaction, user, language) {
        await (0, discordInteractions_1.deferReply)(interaction);
        const server = interaction.client.guilds.cache.get("529674666692837378");
        if (!server) {
            return (0, discordInteractions_1.replyInteraction)(interaction, Strings[language].errorServer);
        }
        const channel = server.channels.cache.get("529676748422512661");
        if (!channel) {
            return (0, discordInteractions_1.replyInteraction)(interaction, Strings[language].errorChannel);
        }
        const container = new CustomContainerBuilder_1.CustomContainerBuilder()
            .addTexts([
            `# ${badges_1.EmoteBadgeString.General.Developer} ${Strings[language].title}`,
        ])
            .addLargeSeparator()
            .addTexts([
            Strings[language].description,
            String(channel),
        ])
            .addFooter({
            text: `${interaction.client.user.username} • ${Strings[language].footer}`,
            button: new discord_js_1.ButtonBuilder()
                .setStyle(discord_js_1.ButtonStyle.Link)
                .setLabel(Strings[language].buttonLabel)
                .setURL("https://discord.com/invite/sNf8avn"),
        });
        await (0, discordInteractions_1.replyWithContainer)(interaction, container);
    },
};
const Strings = {
    [Language_1.Language.English]: {
        errorServer: "Error retrieving server",
        errorChannel: "Error retrieving updates channel",
        title: "Updates",
        description: "To follow the updates, check the specific channel on the official server:",
        footer: "If you can't access it, join the server!",
        buttonLabel: "Join official server",
    },
    [Language_1.Language.Portuguese]: {
        errorServer: "Erro ao recuperar o servidor",
        errorChannel: "Erro ao recuperar o canal de atualizações",
        title: "Atualizações",
        description: "Para acompanhar as atualizações, veja o canal específico, no servidor oficial:",
        footer: "Caso não consiga acessar, entre no servidor!",
        buttonLabel: "Entrar no servidor oficial",
    },
    [Language_1.Language.Spanish]: {
        errorServer: "Error al recuperar el servidor",
        errorChannel: "Error al recuperar el canal de actualizaciones",
        title: "Actualizaciones",
        description: "Para seguir las actualizaciones, consulta el canal específico en el servidor oficial:",
        footer: "Si no puedes acceder, ¡únete al servidor!",
        buttonLabel: "Unirse al servidor oficial",
    },
};
//# sourceMappingURL=updates.js.map