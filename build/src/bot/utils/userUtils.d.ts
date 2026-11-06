import { Language } from "#core/models/Language";
import { User } from "#core/models/User";
import type { CommandInteraction } from "discord.js";
/**
 * Checks if the user exists in the database. If the user is the one who invoked the interaction,
 * it creates a new user if they don't exist, or updates their language if it has changed.
 *
 * @param userId - The Id of the user to check.
 * @param interaction - The interaction that triggered this check.
 * @returns The user object if found or created, otherwise undefined.
 */
export declare function checkUser(userId: string, interaction: CommandInteraction): Promise<User | null | undefined>;
/**
 * Searches for a user by name or Id.
 *
 * @param nameOrId - The name or Id of the user to search for.
 * @param interaction - The interaction to reply to if the user is not found.
 * @param language - The language to use for the reply message.
 * @returns The user object if found, otherwise null.
 */
export declare function searchUser(nameOrId: string, interaction: CommandInteraction, language?: Language): Promise<User | null>;
/**
 * Removes all users from any active actions (robbing, scavenging, beating, etc.) in the database.
 * This is typically used to reset states.
 */
export declare function removeAllFromActions(): Promise<void>;
