import type { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { Language, type Localization } from "#core/models/Language";
import { Log, logger } from "#shared/log";
import {
	ButtonInteraction,
	type ColorResolvable,
	Colors,
	type CommandInteraction,
	type ContainerBuilder,
	type DiscordAPIError,
	EmbedBuilder,
	type InteractionEditReplyOptions,
	type InteractionReplyOptions,
	MessageComponentInteraction,
	type MessageCreateOptions,
	MessageFlags,
	type MessagePayload,
	type Snowflake,
} from "discord.js";
import { getClient } from "../client";

/**
 * Sends a private message (DM) to a user with a simple embed.
 *
 * @param userId - The Id of the user to send the message to.
 * @param message - The content of the message description.
 * @param color - The color of the embed (default: DarkButNotBlack).
 * @param footer - Optional footer text for the embed.
 */
export async function sendPrivateMessage(userId: string, message: string, color: ColorResolvable = Colors.DarkButNotBlack, footer: string = "") {
	const client = getClient();

	try {
		const discordUser = await client.users.fetch(userId);
		const embed = new EmbedBuilder()
			.setDescription(message);

		if (color) {
			embed.setColor(color);
		}
		if (footer) {
			embed.setFooter({ text: footer });
		}

		await discordUser.send({ embeds: [embed] });
	}
	catch (err) {
		Log.Warning(`Something went wrong with sending private message to user ${userId}. Error: ${err}`);
	}
}

/**
 * Sends a complex private message (DM) to a user.
 *
 * @param userId - The Id of the user to send the message to.
 * @param options - The message options (string, payload, or create options).
 * @returns The sent message or undefined if the user Id is missing or an error occurs.
 */
export async function sendComplexPrivateMessage(userId: Snowflake | undefined, options: string | MessagePayload | MessageCreateOptions) {
	if (!userId) {
		return;
	}
	const client = getClient();

	try {
		const discordUser = await client.users.fetch(userId);
		return await discordUser.send(options);
	}
	catch (err) {
		Log.Warning(`Something went wrong with sending private message to user ${userId}. Error: ${err}`);
	}
}

/**
 * Replies to an interaction, handling deferred or already replied states.
 *
 * @param interaction - The interaction to reply to.
 * @param options - The reply options.
 * @returns The reply message or undefined if an error occurs.
 */
export async function replyInteraction(interaction: CommandInteraction | ButtonInteraction | MessageComponentInteraction, options: string | MessagePayload | InteractionReplyOptions | InteractionEditReplyOptions) {
	try {
		if (interaction instanceof ButtonInteraction) {
			if (interaction.replied || interaction.deferred) {
				return await interaction.followUp(options as InteractionReplyOptions);
			}
			return await interaction.reply(options as InteractionReplyOptions);
		}
		if (interaction.replied || interaction.deferred) {
			return await interaction.editReply(options as InteractionEditReplyOptions);
		}
		if (interaction instanceof MessageComponentInteraction) {
			return await interaction.update(options as InteractionEditReplyOptions);
		}

		return await interaction.reply(options as InteractionReplyOptions);
	}
	catch (err) {
		const error = err as DiscordAPIError;
		logger.debug(error);

		// Handle specific Discord errors gracefully (Console only)
		if (error.code === 10_008) {
			logger.warn(`[CONSOLE] Interaction reply failed: Deleted Message (Code 10008) for user ${interaction.user.displayName} (Id: ${interaction.user.id}) in server ${interaction.guild?.name} (Id: ${interaction.guild?.id}).`);
			return;
		}

		if (error.code === 50_027) {
			logger.warn(`[CONSOLE] Interaction reply failed: Token Expired (Code 50027) for user ${interaction.user.displayName} (Id: ${interaction.user.id}) in server ${interaction.guild?.name} (Id: ${interaction.guild?.id}).`);
			return;
		}

		if (error.name === "AbortError") {
			logger.warn(`[CONSOLE] Interaction reply timed out (AbortError) for user ${interaction.user.displayName} (Id: ${interaction.user.id}) in server ${interaction.guild?.name} (Id: ${interaction.guild?.id}). This is usually a temporary Discord API or network issue.`);
			return;
		}

		Log.Warning(`Something went wrong with replying interaction of user ${interaction.user.displayName} (Id: ${interaction.user.id}) in server ${interaction.guild?.name} (Id: ${interaction.guild?.id}). Error: ${error.message}`);
	}
}

/**
 * Replies to an interaction with a custom container (UI).
 *
 * @param interaction - The interaction to reply to.
 * @param container - The container builder with components.
 * @param ephemeral - Whether the reply should be ephemeral (default: false).
 * @returns The reply message.
 */
export async function replyWithContainer(interaction: CommandInteraction | ButtonInteraction | MessageComponentInteraction, container: CustomContainerBuilder | ContainerBuilder, ephemeral = false) {
	return await replyInteraction(interaction, {
		components: [container],
		flags: ephemeral ? [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral] : MessageFlags.IsComponentsV2,
	});
}

/**
 * Defers the reply to an interaction if it hasn't been deferred already.
 *
 * @param interaction - The interaction to defer.
 */
export async function deferReply(interaction: CommandInteraction | ButtonInteraction | MessageComponentInteraction) {
	try {
		if (interaction.deferred) {
			return;
		}
		await interaction.deferReply();
	}
	catch (err) {
		const error = err as Error;
		if (error.name === "AbortError") {
			Log.Warning(`Deferring reply timed out (AbortError) for interaction ${interaction.id} of user ${interaction.user.displayName}.`);
			return;
		}
		Log.Warning(`Something went wrong with deferring interaction ${interaction.id} of user ${interaction.user.displayName} in server ${interaction.guild?.name} (Id: ${interaction.guild?.id}). Error: ${err}`);
	}
}

/**
 * Defers the update to an interaction if it hasn't been deferred already.
 *
 * @param interaction - The interaction to defer.
 */
export async function deferUpdate(interaction: ButtonInteraction | MessageComponentInteraction) {
	try {
		if (interaction.deferred) {
			return;
		}
		await interaction.deferUpdate();
	}
	catch (err) {
		const error = err as Error;
		if (error.name === "AbortError") {
			Log.Warning(`Deferring update timed out (AbortError) for interaction ${interaction.id} of user ${interaction.user.displayName}.`);
			return;
		}
		Log.Warning(`Something went wrong with deferring interaction ${interaction.id} of user ${interaction.user.displayName} in server ${interaction.guild?.name} (Id: ${interaction.guild?.id}). Error: ${err}`);
	}
}

/**
 * Replies to an interaction indicating that the user does not exist.
 *
 * @param interaction - The interaction to reply to.
 * @param language - The language for the error message.
 * @returns The reply message.
 */
export async function replyUserDontExist(interaction: CommandInteraction, language: Language) {
	return await replyInteraction(interaction, {
		content: Strings[language].userDontExist,
		flags: [MessageFlags.Ephemeral],
	});
}

const Strings = {
	[Language.English]: {
		userDontExist: "This user doesn't exist in the database.",
	},
	[Language.Portuguese]: {
		userDontExist: "Este usuário não existe no banco de dados.",
	},
	[Language.Spanish]: {
		userDontExist: "Este usuario no existe en la base de datos.",
	},
} as const satisfies Localization;