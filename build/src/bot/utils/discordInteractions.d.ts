import type { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
import { Language } from "#core/models/Language";
import { ButtonInteraction, type ColorResolvable, type CommandInteraction, type ContainerBuilder, type InteractionEditReplyOptions, type InteractionReplyOptions, MessageComponentInteraction, type MessageCreateOptions, type MessagePayload, type Snowflake } from "discord.js";
/**
 * Sends a private message (DM) to a user with a simple embed.
 *
 * @param userId - The Id of the user to send the message to.
 * @param message - The content of the message description.
 * @param color - The color of the embed (default: DarkButNotBlack).
 * @param footer - Optional footer text for the embed.
 */
export declare function sendPrivateMessage(userId: string, message: string, color?: ColorResolvable, footer?: string): Promise<void>;
/**
 * Sends a complex private message (DM) to a user.
 *
 * @param userId - The Id of the user to send the message to.
 * @param options - The message options (string, payload, or create options).
 * @returns The sent message or undefined if the user Id is missing or an error occurs.
 */
export declare function sendComplexPrivateMessage(userId: Snowflake | undefined, options: string | MessagePayload | MessageCreateOptions): Promise<import("discord.js").Message<false> | undefined>;
/**
 * Replies to an interaction, handling deferred or already replied states.
 *
 * @param interaction - The interaction to reply to.
 * @param options - The reply options.
 * @returns The reply message or undefined if an error occurs.
 */
export declare function replyInteraction(interaction: CommandInteraction | ButtonInteraction | MessageComponentInteraction, options: string | MessagePayload | InteractionReplyOptions | InteractionEditReplyOptions): Promise<import("discord.js").InteractionResponse<boolean> | import("discord.js").Message<boolean> | undefined>;
/**
 * Replies to an interaction with a custom container (UI).
 *
 * @param interaction - The interaction to reply to.
 * @param container - The container builder with components.
 * @param ephemeral - Whether the reply should be ephemeral (default: false).
 * @returns The reply message.
 */
export declare function replyWithContainer(interaction: CommandInteraction | ButtonInteraction | MessageComponentInteraction, container: CustomContainerBuilder | ContainerBuilder, ephemeral?: boolean): Promise<import("discord.js").InteractionResponse<boolean> | import("discord.js").Message<boolean> | undefined>;
/**
 * Defers the reply to an interaction if it hasn't been deferred already.
 *
 * @param interaction - The interaction to defer.
 */
export declare function deferReply(interaction: CommandInteraction | ButtonInteraction | MessageComponentInteraction): Promise<void>;
/**
 * Defers the update to an interaction if it hasn't been deferred already.
 *
 * @param interaction - The interaction to defer.
 */
export declare function deferUpdate(interaction: ButtonInteraction | MessageComponentInteraction): Promise<void>;
/**
 * Replies to an interaction indicating that the user does not exist.
 *
 * @param interaction - The interaction to reply to.
 * @param language - The language for the error message.
 * @returns The reply message.
 */
export declare function replyUserDontExist(interaction: CommandInteraction, language: Language): Promise<import("discord.js").InteractionResponse<boolean> | import("discord.js").Message<boolean> | undefined>;
