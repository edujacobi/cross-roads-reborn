"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const discord_js_1 = require("discord.js");
const node_path_1 = __importDefault(require("node:path"));
const log_1 = require("#shared/log");
process.loadEnvFile();
const commands = [];
const adminCommands = [];
const foldersPath = node_path_1.default.join(__dirname, "commands");
const commandFolders = node_fs_1.default.readdirSync(foldersPath);
for (const folder of commandFolders) {
    // Grab all the command files from the commands directory you created earlier
    const commandsPath = node_path_1.default.join(foldersPath, folder);
    const commandFiles = node_fs_1.default.readdirSync(commandsPath).filter((file) => (file.endsWith(".ts") || file.endsWith(".js")) && !file.endsWith(".d.ts") && !file.endsWith(".map"));
    // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
    for (const file of commandFiles) {
        const filePath = node_path_1.default.join(commandsPath, file);
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const command = require(filePath);
        if ("data" in command && "execute" in command) {
            if (commandsPath.includes("admin")) {
                adminCommands.push(command.data.toJSON());
            }
            else {
                commands.push(command.data.toJSON());
            }
            log_1.logger.info(`Command ${file} deployed`);
        }
        else {
            log_1.logger.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}
const token = process.env.NODE_ENV === "DEV" ? process.env.TOKEN_DEV : process.env.TOKEN;
const clientId = process.env.NODE_ENV === "DEV" ? process.env.CLIENT_ID_DEV : process.env.CLIENT_ID;
// Construct and prepare an instance of the REST module
const rest = new discord_js_1.REST().setToken(token);
// and deploy your commands!
(async () => {
    try {
        log_1.logger.info(`Started refreshing ${commands.length} application (/) commands.`);
        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(discord_js_1.Routes.applicationCommands(clientId), { body: commands });
        const dataAdmin = await rest.put(discord_js_1.Routes.applicationGuildCommands(clientId, process.env.GUILD_ID), { body: adminCommands });
        log_1.logger.info(`Successfully reloaded ${data.length} application (/) commands (and ${dataAdmin.length} admin commands).`);
    }
    catch (error) {
        // And of course, make sure you catch and log any errors!
        log_1.logger.error(error);
    }
})();
//# sourceMappingURL=deploy-commands.js.map