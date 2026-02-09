import {
	ButtonInteraction,
	ColorResolvable,
	Colors,
	CommandInteraction,
	ContainerBuilder,
	InteractionEditReplyOptions,
	InteractionReplyOptions,
	MessageComponentInteraction,
	MessageCreateOptions,
	MessageFlags,
	MessagePayload,
	Snowflake,
	TextDisplayBuilder,
} from "discord.js";
import { getClient } from "../client";
import { Log } from "@shared/log";
import { Language, Localization } from "@core/models/Language";
import { CustomContainerBuilder } from "@bot/ui/builders/CustomContainerBuilder";

interface PrivateMessageParams {
	userId: Snowflake;
	message: string;
	notificationMessage?: string;
	color?: ColorResolvable;
	footer?: string;
}

/**
 * Sends a private message (DM) to a user with a simple embed.
 *
 * @param params.userId - The ID of the user to send the message to.
 * @param params.message - The content of the message description.
 * @param params.notificationMessage - The content of the message that will be shown to pop up but not in message.
 * @param params.color - The color of the embed (default: DarkButNotBlack).
 * @param params.footer - Optional footer text for the embed.
 */
export async function sendPrivateMessage(params: PrivateMessageParams): Promise<void> {
	const client = getClient();

	try {
		const discordUser = await client.users.fetch(params.userId);
		const text = new TextDisplayBuilder().setContent(`||${params.notificationMessage ?? params.message}||`);

		const container = new CustomContainerBuilder()
			.addTexts([params.message]);

		if (params.color) {
			container.setAccentColor(params.color as number);
		}
		if (params.footer) {
			container.addFooter({ text: params.footer });
		}

		await discordUser.send({
			components: [text, container],
			flags: MessageFlags.IsComponentsV2
		});
	}
	catch (err) {
		Log.Warning(`Something went wrong with sending private message to user ${params.userId}. Error: ${err}`);
	}
}

/**
 * Sends a complex private message (DM) to a user.
 *
 * @param userId - The ID of the user to send the message to.
 * @param options - The message options (string, payload, or create options).
 * @returns The sent message or undefined if the user ID is missing or an error occurs.
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
		Log.Warning(`Something went wrong with replying interaction ${interaction.id} of user ${interaction.user.displayName} in server ${interaction.guild?.name} (ID: ${interaction.guild?.id}). Error: ${err}`);
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
		Log.Warning(`Something went wrong with deferring interaction ${interaction.id} of user ${interaction.user.displayName} in server ${interaction.guild?.name} (ID: ${interaction.guild?.id}). Error: ${err}`);
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