"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const ui_1 = require("#bot/utils/ui");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const colors_1 = require("#bot/utils/colors");
const Language_1 = require("#core/models/Language");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("invite")
        .setDescription("Invite Cross Roads Reborn to your server!")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "convite")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Convide Cross Roads Reborn para o seu servidor!")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "invitar")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "¡Invita a Cross Roads Reborn a tu servidor!"),
    async execute(interaction, user, language) {
        const s = Strings[language];
        const buttonInvite = new discord_js_1.ButtonBuilder()
            .setLabel(s.addTo)
            .setStyle(discord_js_1.ButtonStyle.Link)
            .setURL(`https://discord.com/oauth2/authorize?client_id=${interaction.client.user.id}&permissions=319488&scope=applications.commands+bot`);
        const buttonServer = new discord_js_1.ButtonBuilder()
            .setLabel(s.join)
            .setStyle(discord_js_1.ButtonStyle.Link)
            .setURL("https://discord.com/invite/sNf8avn");
        const row = new discord_js_1.ActionRowBuilder()
            .setComponents([buttonInvite, buttonServer]);
        const container = (0, ui_1.defaultComponent)({
            user,
            color: colors_1.CrColors.Default,
            thumbnail: interaction.client.user.avatarURL({ size: 512 }) ?? undefined,
            footer: s.footer,
            description: s.description,
            buttons: row,
        });
        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
    },
};
const Strings = {
    [Language_1.Language.English]: {
        footer: "Just click the buttons above!",
        description: `# Invite\nInvite Cross Roads Reborn to your server or join the official server and challenge new players!`,
        addTo: "Add to server",
        join: "Join the official server",
    },
    [Language_1.Language.Portuguese]: {
        footer: "Apenas clique nos botões acima!",
        description: "# Convite\nConvide Cross Roads Reborn para o seu servidor ou junte-se ao servidor oficial e desafie novos jogadores!",
        addTo: "Adicionar ao servidor",
        join: "Junte-se ao servidor oficial",
    },
    [Language_1.Language.Spanish]: {
        footer: "¡Simplemente haz clic en los botones de arriba!",
        description: "# Invitación\n¡Invita a Cross Roads Reborn a tu servidor o únete al servidor oficial y desafía a nuevos jugadores!",
        addTo: "Añadir al servidor",
        join: "Únete al servidor oficial",
    },
};
//# sourceMappingURL=invite.js.map