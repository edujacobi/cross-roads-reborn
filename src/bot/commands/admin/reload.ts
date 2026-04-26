import { type ChatInputCommandInteraction, Colors, SlashCommandBuilder } from "discord.js";
import path from "node:path";
import fs from "node:fs";
import type { SlashCommand } from "#bot/types";
import { logger } from "#shared/log";
import { defaultComponent } from "#bot/utils/ui";
import type { User } from "#core/models/User";
import { deferReply, replyWithContainer } from "#bot/utils/discordInteractions";

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

	async execute(interaction: ChatInputCommandInteraction, user: User) {
		const commandName = interaction.options.getString("command", true).toLowerCase();
		const command = interaction.client.commands.get(commandName);

		await deferReply(interaction);

		if (!command) {
			const container = defaultComponent({
				description: `There is no command with name \`/${commandName}\`!`,
				color: Colors.Orange,
				user,
			});

			return replyWithContainer(interaction, container);
		}

		const foldersPath = path.join(__dirname, "..");
		const commandFolders = fs.readdirSync(foldersPath);

		for (const folder of commandFolders) {
			const commandsPath = path.join(foldersPath, folder);
			const file = fs.readdirSync(commandsPath).find((file: string) => file.replace(/\.(ts|js)$/, "") === commandName && (file.endsWith(".ts") || file.endsWith(".js")));

			if (!file) {
				continue;
			}

			const filePath = path.join(commandsPath, file);
			delete require.cache[require.resolve(filePath)];
			// eslint-disable-next-line @typescript-eslint/no-require-imports
			const newCommand: SlashCommand = require(filePath);

			if ("data" in newCommand && "execute" in newCommand) {

				interaction.client.commands.set(newCommand.data.name, newCommand);
				logger.info(`Command /${file} reloaded`);

				const container = defaultComponent({
					description: `Command \`/${newCommand.data.name}\` was reloaded!`,
					color: Colors.Green,
					user,
				});

				return replyWithContainer(interaction, container);

			}
			else {
				const container = defaultComponent({
					description: `The command \`/${commandName}\` is missing a required "data" or "execute" property`,
					color: Colors.Orange,
					user,
				});

				return replyWithContainer(interaction, container);
			}
		}

		const container = defaultComponent({
			description: `There was an error while reloading command \`/${command.data.name}\``,
			color: Colors.Red,
			user,
		});

		return replyWithContainer(interaction, container);
	},
};