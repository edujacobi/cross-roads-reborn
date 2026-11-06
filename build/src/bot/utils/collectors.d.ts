import { type ButtonInteraction, type CommandInteraction, type ContainerBuilder, type InteractionResponse, type Message, type MessageComponentInteraction } from "discord.js";
import type { CustomContainerBuilder } from "#bot/ui/builders/CustomContainerBuilder";
/**
 * Creates a button interaction collector for a message.
 *
 * @param interaction - The original interaction.
 * @param response - The message or interaction response to collect from.
 * @param options - Optional settings for the collector (idleTime and maxClicks).
 * @returns The collector or undefined if response is missing.
 */
export declare function createButtonCollector(interaction: CommandInteraction | ButtonInteraction | MessageComponentInteraction, response: Message | InteractionResponse | undefined, options?: {
    idleTime?: number;
    maxClicks?: number;
}): import("discord.js").InteractionCollector<ButtonInteraction<import("discord.js").CacheType>> | undefined;
/**
 * Creates a string select menu interaction collector for a message.
 *
 * @param interaction - The original interaction.
 * @param response - The message or interaction response to collect from.
 * @param idleTime - The idle time in milliseconds before the collector stops (default: 60_000).
 * @returns The collector or undefined if response is missing.
 */
export declare function createStringSelectCollector(interaction: CommandInteraction | ButtonInteraction | MessageComponentInteraction, response: Message | InteractionResponse | undefined, idleTime?: number): import("discord.js").InteractionCollector<import("discord.js").StringSelectMenuInteraction<import("discord.js").CacheType>> | undefined;
/**
 * Disables all buttons and select menus in a container and updates the interaction.
 *
 * @param interaction - The interaction to update.
 * @param container - The container with components to disable.
 */
export declare function disableButtons(interaction: CommandInteraction | ButtonInteraction, container: ContainerBuilder | CustomContainerBuilder): Promise<void>;
