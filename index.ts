import fs from "node:fs";
import path from "node:path";
import { Collection } from "discord.js";
import { SlashCommand } from "./types";
import dotenv from "dotenv";
import { setClient } from "./client";
import { Log, logger } from "./utils/log";
import { GlobalFonts } from "@napi-rs/canvas";
// import { testImage } from "./utils/ui";
// testImage();

const client = setClient();

dotenv.config();

const environmentFile = process.env.NODE_ENV === "DEV" ? ".ts" : ".js";

// Events
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs.readdirSync(eventsPath).filter((file: string) => file.endsWith(environmentFile));

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
// Gang Invites
client.invites = new Collection<number, Collection<string, number>>();

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter((file: string) => file.endsWith(environmentFile));

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

client.login(token).then(() => logger.info(`Cross Roads Reborn Online! ENV: ${process.env.NODE_ENV}`));

const fontLoaded = GlobalFonts.registerFromPath(
	path.join(__dirname, "ui", "assets", "fonts", "InterSemiBold.ttf"),
	"Inter",
);

logger.info(`Loaded Inter font with ${fontLoaded ? "Success" : "Error"}`);