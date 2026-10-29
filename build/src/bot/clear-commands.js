"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const log_1 = require("#shared/log");
process.loadEnvFile();
const token = process.env.NODE_ENV === "DEV" ? process.env.TOKEN_DEV : process.env.TOKEN;
const clientId = process.env.NODE_ENV === "DEV" ? process.env.CLIENT_ID_DEV : process.env.CLIENT_ID;
const rest = new discord_js_1.REST().setToken(token);
(async () => {
    try {
        log_1.logger.info(`Started clearing application (/) commands.`);
        await rest.put(discord_js_1.Routes.applicationCommands(clientId), { body: [] });
        await rest.put(discord_js_1.Routes.applicationGuildCommands(clientId, process.env.GUILD_ID), { body: [] });
        log_1.logger.info(`Successfully cleared application (/) commands admin commands).`);
    }
    catch (error) {
        log_1.logger.error(`${error}`);
    }
})();
//# sourceMappingURL=clear-commands.js.map