import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import path from "node:path";
import fs from "node:fs";
import { SlashCommand } from "../../types";
import { logger } from "../../utils/log";

/**
 * @INFO: DONT FORGET TO RUN 'tsc --watch' FOR /RELOAD TO WORK PROPERLY
 */

module.exports = {
	data: new SlashCommandBuilder()
		.setName("reload")
		.setDescription("Reloads a command.")
		.addStringOption(option =>
			option.setName("command")
				.setDescription("The command to reload.")
				.setRequired(true)),

	async execute(interaction: ChatInputCommandInteraction) {
		const commandName = interaction.options.getString("command", true).toLowerCase();
		const command = interaction.client.commands.get(commandName);

		await interaction.deferReply();

		if (!command) {
			return interaction.editReply(`There is no command with name \`${commandName}\`!`);
		}

		const foldersPath = path.join(__dirname, "..");
		const commandFolders = fs.readdirSync(foldersPath);

		for (const folder of commandFolders) {
			const commandsPath = path.join(foldersPath, folder);
			const file = fs.readdirSync(commandsPath).find((file: string) => file.replace(".ts", "") === commandName && file.endsWith(".ts"));

			if (!file) {
				continue;
			}

			const filePath = path.join(commandsPath, file);
			delete require.cache[require.resolve(filePath)];
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const newCommand: SlashCommand = require(filePath);

			if ("data" in newCommand && "execute" in newCommand) {

				interaction.client.commands.set(newCommand.data.name, newCommand);
				logger.info(`Command ${file} reloaded`);
				return await interaction.editReply(`Command \`${newCommand.data.name}\` was reloaded!`);

			}
			else {
				return await interaction.editReply(`The command is missing a required "data" or "execute" property.`);
			}
		}

		return await interaction.editReply(`There was an error while reloading command \`${command.data.name}\``);
	},
};