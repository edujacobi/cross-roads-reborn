import {
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	Collection,
	ModalSubmitInteraction,
	SlashCommandBuilder
} from "discord.js";

export interface SlashCommand {
	data: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">,
	execute: (interaction: ChatInputCommandInteraction) => void,
	autocomplete?: (interaction: AutocompleteInteraction) => void,
	modal?: (interaction: ModalSubmitInteraction) => void,
	cooldown?: number // in seconds
}

declare global {
	namespace NodeJS {
		interface ProcessEnv {
			TOKEN: string,
			CLIENT_ID: string,
			GUILD_ID: string,
			SERVER_ID: string,
			JACOBI_ID: string,
			NODE_ENV: "PROD" | "DEV"
			TOKEN_DEV: string,
			CLIENT_ID_DEV: string,
		}
	}
}

declare module "discord.js" {
	export interface Client {
		commands: Collection<string, SlashCommand>,
		cooldowns: Collection<string, Collection<string, number>>
	}
}