import fs from "node:fs";
import { REST, Routes } from "discord.js";
import path from "node:path";
import dotenv from "dotenv";
import type { Command, SlashCommand } from "./types";
import { logger } from "#shared/log";

dotenv.config();

const environmentFile = process.env.NODE_ENV === "DEV" ? ".ts" : ".js";

const commands: SlashCommand[] = [];
const adminCommands: SlashCommand[] = [];
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	// Grab all the command files from the commands directory you created earlier
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter((file: string) => file.endsWith(environmentFile));
	// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const command = require(filePath);

		if ("data" in command && "execute" in command) {
			if (commandsPath.includes("admin")) {
				adminCommands.push(command.data.toJSON());
			}
			else {
				commands.push(command.data.toJSON());
			}

			logger.info(`Command ${file} deployed`);

		}
		else {
			logger.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const token = process.env.NODE_ENV === "DEV" ? process.env.TOKEN_DEV : process.env.TOKEN;
const clientId = process.env.NODE_ENV === "DEV" ? process.env.CLIENT_ID_DEV : process.env.CLIENT_ID;

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// and deploy your commands!
(async () => {
	try {
		logger.info(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data: Command[] = await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		) as Command[];

		const dataAdmin: Command[] = await rest.put(
			Routes.applicationGuildCommands(clientId, process.env.GUILD_ID),
			{ body: adminCommands },
		) as Command[];

		logger.info(`Successfully reloaded ${data.length} application (/) commands (and ${dataAdmin.length} admin commands).`);
	}
	catch (error) {
		// And of course, make sure you catch and log any errors!
		logger.error(error);
	}
})();