"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const Language_1 = require("#core/models/Language");
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("about")
        .setDescription("Informations about Cross Roads Reborn!")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "sobre")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "sobre")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Informações sobre Cross Roads Reborn!")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Información sobre Cross Roads Reborn!"),
    async execute(interaction, user, language) {
        const s = Strings[language];
        const container = new CustomContainerBuilder_1.CustomContainerBuilder()
            .setAccentColor(discord_js_1.Colors.Green)
            .addTexts([
            `# ${s.title}`,
        ])
            .addImage("https://media.discordapp.net/attachments/1233604589064818808/1374807950438170675/Header_About.png")
            .addTexts([
            `### ${s.direction}`,
            `Jacobi`,
        ])
            .addLargeSeparator()
            .addTexts([
            `### ${s.programming}`,
        ])
            .addSectionComponents(section => section
            .addTexts([
            `Jacobi`,
        ])
            .setButtonAccessory(new discord_js_1.ButtonBuilder()
            .setLabel("GitHub")
            .setStyle(discord_js_1.ButtonStyle.Link)
            .setURL("https://github.com/edujacobi/")))
            .addLargeSeparator()
            .addSectionComponents(section => section
            .addTexts([
            `### ${s.art}`,
            `Jacobi`,
            `Miguel`,
            `Cesar`,
            `Kenny`,
        ])
            .setThumbnailAccessory(thumb => thumb
            .setURL("https://media.discordapp.net/attachments/1233604589064818808/1378075287518187591/Artist2.png")))
            .addLargeSeparator()
            .addTexts([
            `-# ${s.others}: Quantum, nadalao, CassadorEterno`,
        ]);
        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
    },
};
const Strings = {
    [Language_1.Language.English]: {
        title: "About",
        credits: "Credits",
        direction: "Direction",
        programming: "Programming",
        art: "Art",
        others: "Others",
    },
    [Language_1.Language.Portuguese]: {
        title: "Sobre",
        credits: "Créditos",
        direction: "Direção",
        programming: "Programação",
        art: "Arte",
        others: "Outros",
    },
    [Language_1.Language.Spanish]: {
        title: "Acerca de",
        credits: "Créditos",
        direction: "Dirección",
        programming: "Programación",
        art: "Arte",
        others: "Otros",
    },
};
//# sourceMappingURL=about.js.map