import { REST, Routes } from "discord.js";
import { logger } from "#shared/log";

process.loadEnvFile();

const token = process.env.NODE_ENV === "DEV" ? process.env.TOKEN_DEV : process.env.TOKEN;
const clientId = process.env.NODE_ENV === "DEV" ? process.env.CLIENT_ID_DEV : process.env.CLIENT_ID;

const rest = new REST().setToken(token);

(async () => {
	try {
		logger.info(`Started clearing application (/) commands.`);

		await rest.put(
			Routes.applicationCommands(clientId),
			{ body: [] },
		);

		await rest.put(
			Routes.applicationGuildCommands(clientId, process.env.GUILD_ID),
			{ body: [] },
		);

		logger.info(`Successfully cleared application (/) commands admin commands).`);
	}
	catch (error) {
		logger.error(`${error}`);
	}
})();