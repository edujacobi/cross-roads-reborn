import type { ChatInputCommandInteraction } from "discord.js";
import { User } from "#core/models/User";
/**
 * Assigns the 'Player' role to the user in the official server if they don't have it.
 * Only works in the production environment and official server.
 *
 * @param interaction - The interaction triggering the check.
 */
export declare function setPlayerRoleInOfficialServer(interaction: ChatInputCommandInteraction): Promise<void>;
/**
 * Synchronizes the 'VIP' role for the user in the official server based on their VIP status.
 * Only works in the production environment and official server.
 *
 * @param interaction - The interaction triggering the check.
 */
export declare function setVIPRoleInOfficialServer(interaction: ChatInputCommandInteraction): Promise<void>;
/**
 * Sets the user's nickname in the official server to match their game nickname.
 * Only works in the production environment and official server.
 *
 * @param interaction - The interaction triggering the check.
 * @param user - The user object containing the nickname.
 */
export declare function setPlayerNicknameInOfficialServer(interaction: ChatInputCommandInteraction, user: User): Promise<void>;
/**
 * Synchronizes a single user's roles and nickname in the official server.
 * This is a combined function to be called from the interaction handler.
 *
 * @param interaction - The interaction triggering the sync.
 * @param user - The user object from the database.
 */
export declare function syncUserInOfficialServer(interaction: ChatInputCommandInteraction, user: User): Promise<void>;
/**
 * Checks if the user is a server booster in the official server.
 * Only works in the production environment and official server.
 *
 * @param interaction - The interaction triggering the check.
 * @returns True if the user is a booster, false otherwise.
 */
export declare function isUserBoosterInOfficialServer(interaction: ChatInputCommandInteraction): Promise<boolean>;
export declare function isUserBoosterInOfficialServerByUserId(userId: string): boolean;
/**
 * Starts the procedure to periodically synchronize VIP roles in the official server.
 */
export declare function startVIPProcedure(): Promise<void>;
