import {
	ApplicationCommandType,
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	Collection,
	ModalSubmitInteraction,
	SlashCommandBuilder, Snowflake,
} from "discord.js";
import { User } from "@core/models/User";
import { Language } from "@core/models/Language";

export interface SlashCommand {
	data: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">,
	execute: (interaction: ChatInputCommandInteraction, user: User, language: Language) => void,
	autocomplete?: (interaction: AutocompleteInteraction) => void,
	modal?: (interaction: ModalSubmitInteraction) => void,
	cooldown?: number,
	vip?: boolean,
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
		userLastCommand: Collection<string, number>,
		userLastSync: Collection<string, number>,
		invites: Collection<number, Collection<string, number>>,
	}
}

export interface Command {
	id: Snowflake,
	application_id: Snowflake,
	version: Snowflake,
	default_member_permissions: string,
	type: ApplicationCommandType,
	name: string,
	name_localizations: { [key: string]: string },
	description: string,
	description_localizations: { [key: string]: string },
	guild_id: Snowflake,
	options: never[],
	nsfw: boolean
}