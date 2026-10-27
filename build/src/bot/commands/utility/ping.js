"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const ui_1 = require("#bot/utils/ui");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("ping")
        .setDescription("Replies with Pong!")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Responde com Pong!")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "¡Responde con Pong!"),
    async execute(interaction, user) {
        const botPing = Math.round(interaction.client.ws.ping);
        const svPing = new Date().getTime();
        const container = (0, ui_1.defaultComponent)({
            user,
            description: `:satellite_orbital: ${botPing}ms API.`,
        });
        await (0, discordInteractions_1.replyWithContainer)(interaction, container);
        container.changeTextFromSectionId(1, `:satellite_orbital: ${botPing}ms API. ${Math.round(new Date().getTime() - svPing)}ms Server.`);
        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
    },
};
//# sourceMappingURL=ping.js.map