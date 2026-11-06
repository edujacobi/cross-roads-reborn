"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = __importDefault(require("node:fs"));
const Language_1 = require("#core/models/Language");
const colors_1 = require("#bot/utils/colors");
const CustomContainerBuilder_1 = require("#bot/ui/builders/CustomContainerBuilder");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("commands")
        .setDescription("See all the commands and their descriptions!")
        .setNameLocalization(discord_js_1.Locale.PortugueseBR, "comandos")
        .setNameLocalization(discord_js_1.Locale.SpanishES, "comandos")
        .setDescriptionLocalization(discord_js_1.Locale.PortugueseBR, "Veja todos os comandos e suas descrições!")
        .setDescriptionLocalization(discord_js_1.Locale.SpanishES, "Ver la lista de comandos disponibles"),
    async execute(interaction, user, language) {
        const s = Strings[language];
        const commandFiles = node_fs_1.default.readdirSync(__dirname).filter((file) => (file.endsWith(".ts") || file.endsWith(".js")) && !file.endsWith(".d.ts") && !file.endsWith(".map"));
        let text = "";
        for (const file of commandFiles) {
            const filePath = node_path_1.default.join(__dirname, file);
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const command = require(filePath);
            if ("data" in command && "execute" in command) {
                const commandName = command.data.name_localizations?.[interaction.locale] ?? command.data.name;
                const commandDescription = command.data.description_localizations?.[interaction.locale] ?? command.data.description;
                text += `### /${commandName}\n-# ${commandDescription}\n`;
            }
        }
        const container = new CustomContainerBuilder_1.CustomContainerBuilder()
            .setUser(user)
            .setAccentColor(colors_1.CrColors.Default)
            .addSectionComponents(section => section
            .addTexts([
            `# ${s.title}`,
            text,
        ])
            .setThumbnailAccessory(thumb => thumb
            .setURL(interaction.client.user.avatarURL({ size: 512 }) ?? "")))
            .addFooter({
            text: interaction.locale,
        });
        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
    },
};
const Strings = {
    [Language_1.Language.English]: {
        title: "Commands",
    },
    [Language_1.Language.Portuguese]: {
        title: "Comandos",
    },
    [Language_1.Language.Spanish]: {
        title: "Comandos",
    },
};
//# sourceMappingURL=commands.js.map