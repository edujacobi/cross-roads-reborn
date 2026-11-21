"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = __importDefault(require("node:fs"));
const log_1 = require("#shared/log");
const ui_1 = require("#bot/utils/ui");
const discordInteractions_1 = require("#bot/utils/discordInteractions");
/**
 * @INFO: DONT FORGET TO RUN 'tsc --watch' FOR /RELOAD TO WORK PROPERLY
 */
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("reload")
        .setDescription("Reloads a command.")
        .addStringOption(option => option.setName("command")
        .setDescription("The command to reload.")
        .setRequired(true)),
    async execute(interaction, user) {
        const commandName = interaction.options.getString("command", true).toLowerCase();
        const command = interaction.client.commands.get(commandName);
        await (0, discordInteractions_1.deferReply)(interaction);
        if (!command) {
            const container = (0, ui_1.defaultComponent)({
                description: `There is no command with name \`/${commandName}\`!`,
                color: discord_js_1.Colors.Orange,
                user,
            });
            return (0, discordInteractions_1.replyWithContainer)(interaction, container);
        }
        const foldersPath = node_path_1.default.join(__dirname, "..");
        const commandFolders = node_fs_1.default.readdirSync(foldersPath);
        for (const folder of commandFolders) {
            const commandsPath = node_path_1.default.join(foldersPath, folder);
            const file = node_fs_1.default.readdirSync(commandsPath).find((file) => file.replace(/\.(ts|js)$/, "") === commandName && (file.endsWith(".ts") || file.endsWith(".js")));
            if (!file) {
                continue;
            }
            const filePath = node_path_1.default.join(commandsPath, file);
            delete require.cache[require.resolve(filePath)];
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const newCommand = require(filePath);
            if ("data" in newCommand && "execute" in newCommand) {
                interaction.client.commands.set(newCommand.data.name, newCommand);
                log_1.logger.info(`Command /${file} reloaded`);
                const container = (0, ui_1.defaultComponent)({
                    description: `Command \`/${newCommand.data.name}\` was reloaded!`,
                    color: discord_js_1.Colors.Green,
                    user,
                });
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
            else {
                const container = (0, ui_1.defaultComponent)({
                    description: `The command \`/${commandName}\` is missing a required "data" or "execute" property`,
                    color: discord_js_1.Colors.Orange,
                    user,
                });
                return (0, discordInteractions_1.replyWithContainer)(interaction, container);
            }
        }
        const container = (0, ui_1.defaultComponent)({
            description: `There was an error while reloading command \`/${command.data.name}\``,
            color: discord_js_1.Colors.Red,
            user,
        });
        return (0, discordInteractions_1.replyWithContainer)(interaction, container);
    },
};
//# sourceMappingURL=reload.js.map