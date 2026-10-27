"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const discord_js_1 = require("discord.js");
const client_1 = require("#bot/client");
const log_1 = require("#shared/log");
const canvas_1 = require("@napi-rs/canvas");
const BackgroundPatternRegistry_1 = require("#bot/ui/patterns/BackgroundPatternRegistry");
const AvatarDecorationRegistry_1 = require("#bot/ui/patterns/AvatarDecorationRegistry");
const server_1 = require("#api/server");
const Database_1 = require("#core/database/Database");
const AdminAuditLogsV2_1 = require("#core/database/migrations/AdminAuditLogsV2");
const AdminAuditLogsV3_1 = require("#core/database/migrations/AdminAuditLogsV3");
const AdminAuditLogsV4_1 = require("#core/database/migrations/AdminAuditLogsV4");
const AdminAuditLogsV5_1 = require("#core/database/migrations/AdminAuditLogsV5");
const Dashboard_1 = require("#core/models/Dashboard");
const Prison_1 = require("#core/models/Prison");
const TimedAction_1 = require("#core/models/TimedAction");
const MultiplayerSession_1 = require("#core/models/MultiplayerSession");
const multiplayerSessionDiscordBridge_1 = require("#bot/utils/multiplayerSessionDiscordBridge");
const client = (0, client_1.setClient)();
const stopMultiplayerSessionDiscordBridge = (0, multiplayerSessionDiscordBridge_1.initializeMultiplayerSessionDiscordBridge)();
process.on("unhandledRejection", (reason) => {
    log_1.logger.error("Unhandled Rejection at Promise", reason);
});
process.on("uncaughtException", (err) => {
    log_1.logger.error("Uncaught Exception thrown", err);
});
client.on(discord_js_1.Events.Error, (error) => {
    log_1.logger.error("Discord Client Error:", error);
});
client.on(discord_js_1.Events.ShardError, (error, shardId) => {
    log_1.logger.error(`Discord Shard ${shardId} Error (Network issue):`, error);
});
client.on(discord_js_1.Events.ShardDisconnect, (event, shardId) => {
    log_1.logger.warn(`Discord Shard ${shardId} Disconnected (Code: ${event.code}, Reason: ${event.reason || "None"}). Waiting to reconnect...`);
});
client.on(discord_js_1.Events.ShardReconnecting, (shardId) => {
    log_1.logger.info(`Discord Shard ${shardId} Reconnecting to Discord Gateway...`);
});
client.on(discord_js_1.Events.ShardResume, (shardId, replayedEvents) => {
    log_1.logger.info(`Discord Shard ${shardId} Successfully Resumed. Replayed ${replayedEvents} events.`);
});
const handleExit = async (signal) => {
    log_1.logger.info(`Received ${signal}. Shutting down gracefully...`);
    (0, Prison_1.cleanupActiveEscapes)();
    TimedAction_1.TimedAction.Stop();
    stopMultiplayerSessionDiscordBridge();
    try {
        await MultiplayerSession_1.MultiplayerSession.Stop();
    }
    catch (error) {
        log_1.logger.error("Failed to abort multiplayer sessions during shutdown:", error);
    }
    try {
        await (0, server_1.stopApiServer)();
    }
    finally {
        client.destroy();
        process.exit(0);
    }
};
process.on("SIGINT", () => void handleExit("SIGINT"));
process.on("SIGTERM", () => void handleExit("SIGTERM"));
process.loadEnvFile();
// Events
const eventsPath = node_path_1.default.join(__dirname, "bot", "events");
const eventFiles = node_fs_1.default.readdirSync(eventsPath).filter((file) => (file.endsWith(".ts") || file.endsWith(".js")) && !file.endsWith(".d.ts") && !file.endsWith(".map"));
for (const file of eventFiles) {
    const filePath = node_path_1.default.join(eventsPath, file);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    }
    else {
        client.on(event.name, (...args) => event.execute(...args));
    }
    log_1.logger.info(`Event ${file} loaded`);
}
// Cooldowns
client.cooldowns = new discord_js_1.Collection();
// Commands
client.commands = new discord_js_1.Collection();
// Users Last Commands
client.userLastCommand = new discord_js_1.Collection();
// Users Last Sync
client.userLastSync = new discord_js_1.Collection();
// Gang Invites
client.invites = new discord_js_1.Collection();
const foldersPath = node_path_1.default.join(__dirname, "bot", "commands");
const commandFolders = node_fs_1.default.readdirSync(foldersPath);
for (const folder of commandFolders) {
    const commandsPath = node_path_1.default.join(foldersPath, folder);
    const commandFiles = node_fs_1.default.readdirSync(commandsPath).filter((file) => (file.endsWith(".ts") || file.endsWith(".js")) && !file.endsWith(".d.ts") && !file.endsWith(".map"));
    for (const file of commandFiles) {
        const filePath = node_path_1.default.join(commandsPath, file);
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const command = require(filePath);
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ("data" in command && "execute" in command) {
            client.commands.set(command.data.name, command);
            log_1.logger.info(`Command ${file} loaded`);
        }
        else {
            log_1.Log.Warning(`The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}
const token = process.env.NODE_ENV === "DEV" ? process.env.TOKEN_DEV : process.env.TOKEN;
const fontLoaded = canvas_1.GlobalFonts.registerFromPath(node_path_1.default.join(process.cwd(), "src", "bot", "ui", "assets", "fonts", "Inter.ttf"), "Inter");
log_1.logger.info(`Loaded Inter font with ${fontLoaded ? "Success" : "Error"}`);
const fontSemiBoldLoaded = canvas_1.GlobalFonts.registerFromPath(node_path_1.default.join(process.cwd(), "src", "bot", "ui", "assets", "fonts", "InterSemiBold.ttf"), "InterSemiBold");
log_1.logger.info(`Loaded InterSemiBold font with ${fontSemiBoldLoaded ? "Success" : "Error"}`);
const fontBoldLoaded = canvas_1.GlobalFonts.registerFromPath(node_path_1.default.join(process.cwd(), "src", "bot", "ui", "assets", "fonts", "InterBold.ttf"), "InterBold");
log_1.logger.info(`Loaded InterBold font with ${fontBoldLoaded ? "Success" : "Error"}`);
BackgroundPatternRegistry_1.BackgroundPatternRegistry.initialize().catch(err => {
    log_1.Log.Error(`Failed to initialize background patterns: ${err}`);
});
AvatarDecorationRegistry_1.AvatarDecorationRegistry.initialize().catch(err => {
    log_1.Log.Error(`Failed to initialize avatar decoration frames: ${err}`);
});
async function startApplication() {
    await Database_1.sequelize.sync();
    await (0, AdminAuditLogsV2_1.migrateAdminAuditLogsV2)();
    await (0, AdminAuditLogsV3_1.migrateAdminAuditLogsV3)();
    await (0, AdminAuditLogsV4_1.migrateAdminAuditLogsV4)();
    await (0, AdminAuditLogsV5_1.migrateAdminAuditLogsV5)();
    await Prison_1.Prison.Initialize();
    await MultiplayerSession_1.MultiplayerSession.Initialize();
    await TimedAction_1.TimedAction.Initialize();
    await Dashboard_1.Dashboard.Initialize();
    await Promise.all([
        (0, server_1.startApiServer)().catch((err) => {
            log_1.Log.Error(`Failed to start Admin API Server: ${err}`);
        }),
        client.login(token)
            .then(() => log_1.logger.info(`Cross Roads Reborn Online! ENV: ${process.env.NODE_ENV}`))
            .catch((err) => log_1.logger.error("Failed to login to Discord:", err)),
    ]);
}
startApplication().catch((err) => {
    log_1.logger.error("Failed to initialize application:", err);
});
//# sourceMappingURL=index.js.map