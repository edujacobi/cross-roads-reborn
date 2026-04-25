import fs from "node:fs";
import path from "node:path";
import { Collection } from "discord.js";
import type { SlashCommand } from "#bot/types";
import dotenv from "dotenv";
import { setClient } from "#bot/client";
import { logger, Log } from "#shared/log";
import { GlobalFonts } from "@napi-rs/canvas";
import { BackgroundPatternRegistry } from "#bot/ui/patterns/BackgroundPatternRegistry";
import { AvatarDecorationRegistry } from "#bot/ui/patterns/AvatarDecorationRegistry";

const client = setClient();

process.on("unhandledRejection", (reason) => {
	logger.error("Unhandled Rejection at Promise", reason);
});

process.on("uncaughtException", (err) => {
	logger.error("Uncaught Exception thrown", err);
});

client.on("error", (error) => {
	logger.error("Discord Client Error:", error);
});

client.on("shardError", (error, shardId) => {
	logger.error(`Discord Shard ${shardId} Error (Network issue):`, error);
});

client.on("shardDisconnect", (event, shardId) => {
	logger.warn(`Discord Shard ${shardId} Disconnected (Code: ${event.code}, Reason: ${event.reason || "None"}). Waiting to reconnect...`);
});

client.on("shardReconnecting", (shardId) => {
	logger.info(`Discord Shard ${shardId} Reconnecting to Discord Gateway...`);
});

client.on("shardResume", (shardId, replayedEvents) => {
	logger.info(`Discord Shard ${shardId} Successfully Resumed. Replayed ${replayedEvents} events.`);
});

const handleExit = (signal: string) => {
	logger.info(`Received ${signal}. Shutting down gracefully...`);
	client.destroy();
	process.exit(0);
};

process.on("SIGINT", () => handleExit("SIGINT"));
process.on("SIGTERM", () => handleExit("SIGTERM"));

dotenv.config();

// Events
const eventsPath = path.join(__dirname, "bot", "events");
const eventFiles = fs.readdirSync(eventsPath).filter((file: string) => file.endsWith(".ts"));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	const event = require(filePath);

	if (event.once) {
		client.once(event.name, (...args: never[][]) => event.execute(...args));
	}
	else {
		client.on(event.name, (...args: never[][]) => event.execute(...args));
	}
	logger.info(`Event ${file} loaded`);
}

// Cooldowns
client.cooldowns = new Collection<string, Collection<string, number>>();
// Commands
client.commands = new Collection<string, SlashCommand>();
// Users Last Commands
client.userLastCommand = new Collection<string, number>();
// Users Last Sync
client.userLastSync = new Collection<string, number>();
// Gang Invites
client.invites = new Collection<number, Collection<string, number>>();

const foldersPath = path.join(__dirname, "bot", "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter((file: string) => file.endsWith(".ts"));

	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const command: SlashCommand = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ("data" in command && "execute" in command) {
			client.commands.set(command.data.name, command);
			logger.info(`Command ${file} loaded`);

		}
		else {
			Log.Warning(`The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const token = process.env.NODE_ENV === "DEV" ? process.env.TOKEN_DEV : process.env.TOKEN;

const fontLoaded = GlobalFonts.registerFromPath(
	path.join(process.cwd(), "src", "bot", "ui", "assets", "fonts", "Inter.ttf"),
	"Inter",
);

logger.info(`Loaded Inter font with ${fontLoaded ? "Success" : "Error"}`);

const fontSemiBoldLoaded = GlobalFonts.registerFromPath(
	path.join(process.cwd(), "src", "bot", "ui", "assets", "fonts", "InterSemiBold.ttf"),
	"InterSemiBold",
);

logger.info(`Loaded InterSemiBold font with ${fontSemiBoldLoaded ? "Success" : "Error"}`);

const fontBoldLoaded = GlobalFonts.registerFromPath(
	path.join(process.cwd(), "src", "bot", "ui", "assets", "fonts", "InterBold.ttf"),
	"InterBold",
);

logger.info(`Loaded InterBold font with ${fontBoldLoaded ? "Success" : "Error"}`);

BackgroundPatternRegistry.initialize().catch(err => {
	Log.Error(`Failed to initialize background patterns: ${err}`);
});

AvatarDecorationRegistry.initialize().catch(err => {
	Log.Error(`Failed to initialize avatar decoration frames: ${err}`);
});

client.login(token)
	.then(() => logger.info(`Cross Roads Reborn Online! ENV: ${process.env.NODE_ENV}`))
	.catch((err) => logger.error("Failed to login to Discord:", err));
