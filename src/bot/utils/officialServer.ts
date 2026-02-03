import { ChatInputCommandInteraction } from "discord.js";
import { User } from "@core/models/User";
import { Log } from "@shared/log";
import { getClient } from "@bot/client";

/**
 * Assigns the 'Player' role to the user in the official server if they don't have it.
 * Only works in the production environment and official server.
 *
 * @param interaction - The interaction triggering the check.
 */
export async function setPlayerRoleInOfficialServer(interaction: ChatInputCommandInteraction) {
	if (process.env.NODE_ENV !== "PROD") {
		return;
	}

	const playerRoleId = "824341916929622017";

	const isInOfficialServer = interaction.guild?.id === process.env.SERVER_ID;

	if (!isInOfficialServer) {
		return;
	}

	const playerRole = interaction.guild.roles.cache.get(playerRoleId);

	if (!playerRole) {
		return;
	}

	const user = interaction.guild.members.cache.get(interaction.user.id);

	if (!user) {
		return;
	}

	const isPlayer = user.roles.cache.some(role => role.id === playerRoleId);

	if (isPlayer) {
		return;
	}

	try {
		await user.roles.add(playerRole);
		Log.Success(`Role Player added to user ${interaction.user.displayName} (ID: ${interaction.user.id})`);
	}
	catch (err) {
		Log.Warning(`Something went wrong with adding role Player to user ${interaction.user.displayName} (ID: ${interaction.user.id}).`);
	}
}

/**
 * Synchronizes the 'VIP' role for the user in the official server based on their VIP status.
 * Only works in the production environment and official server.
 *
 * @param interaction - The interaction triggering the check.
 */
export async function setVIPRoleInOfficialServer(interaction: ChatInputCommandInteraction) {
	if (process.env.NODE_ENV !== "PROD") {
		return;
	}

	const VIPRoleId = "529680357591613442";

	const isInOfficialServer = interaction.guild?.id === process.env.SERVER_ID;

	if (!isInOfficialServer) {
		return;
	}

	const VIPRole = interaction.guild.roles.cache.get(VIPRoleId);

	if (!VIPRole) {
		return;
	}

	const user = interaction.guild.members.cache.get(interaction.user.id);

	if (!user) {
		return;
	}

	const player = await new User(interaction.user.id).GetInfo();

	if (!player) {
		return;
	}

	const hasVIPRole = user.roles.cache.some(role => role.id === VIPRoleId);

	if (hasVIPRole && player.IsVip()) {
		return;
	}

	if (hasVIPRole && !player.IsVip()) {
		try {
			await user.roles.remove(VIPRole);
			Log.Success(`Role VIP removed from user ${interaction.user.displayName} (ID: ${interaction.user.id})`);
		}
		catch (err) {
			Log.Warning(`Something went wrong with removing role VIP from user ${interaction.user.displayName} (ID: ${interaction.user.id}).`);
		}
	}

	if (!hasVIPRole && player.IsVip()) {
		try {
			await user.roles.add(VIPRole);
			Log.Success(`Role VIP added to user ${interaction.user.displayName} (ID: ${interaction.user.id})`);
		}
		catch (err) {
			Log.Warning(`Something went wrong with adding role VIP to user ${interaction.user.displayName} (ID: ${interaction.user.id}).`);
		}
	}
}

/**
 * Sets the user's nickname in the official server to match their game nickname.
 * Only works in the production environment and official server.
 *
 * @param interaction - The interaction triggering the check.
 * @param user - The user object containing the nickname.
 */
export async function setPlayerNicknameInOfficialServer(interaction: ChatInputCommandInteraction, user: User) {
	if (process.env.NODE_ENV !== "PROD") {
		return;
	}

	if (user.Id === process.env.JACOBI_ID) {
		return;
	}

	const isInOfficialServer = interaction.guild?.id === process.env.SERVER_ID;

	if (!isInOfficialServer) {
		return;
	}

	const member = interaction.guild.members.cache.get(interaction.user.id);

	if (!member) {
		return;
	}

	if (member.nickname === user.Nickname) {
		return;
	}

	try {
		await member.setNickname(user.Nickname);
		Log.Success(`Nickname in server added to user ${interaction.user.displayName} (ID: ${interaction.user.id})`);
	}
	catch (err) {
		Log.Warning(`Something went wrong with adding Nickname in server to user ${interaction.user.displayName} (ID: ${interaction.user.id}).`);
	}
}

/**
 * Checks if the user is a server booster in the official server.
 * Only works in the production environment and official server.
 *
 * @param interaction - The interaction triggering the check.
 * @returns True if the user is a booster, false otherwise.
 */
export async function isUserBoosterInOfficialServer(interaction: ChatInputCommandInteraction) {
	if (process.env.NODE_ENV !== "PROD") {
		return false;
	}

	const boosterRoleId = "758691633544953936";

	const isInOfficialServer = interaction.guild?.id === process.env.SERVER_ID;

	if (!isInOfficialServer) {
		return false;
	}

	const boosterRole = interaction.guild.roles.cache.get(boosterRoleId);

	if (!boosterRole) {
		return false;
	}

	const user = interaction.guild.members.cache.get(interaction.user.id);

	if (!user) {
		return false;
	}

	return user.roles.cache.some(role => role.id === boosterRoleId);
}

/**
 * Checks all members of the official server and synchronizes their VIP role.
 * VIP users without the role will receive it; non-VIP users with the role will lose it.
 */
async function setAllVIPRolesInOfficialServer() {
	if (process.env.NODE_ENV !== "PROD") {
		return;
	}

	const client = getClient();
	const serverId = process.env.SERVER_ID;
	const VIPRoleId = "529680357591613442";

	if (!serverId) {
		Log.Warning("SERVER_ID is not set in environment variables.");
		return;
	}

	const guild = client.guilds.cache.get(serverId);
	if (!guild) {
		Log.Warning(`Official server with Id ${serverId} not found.`);
		return;
	}

	let members;
	try {
		members = await guild.members.fetch();
	}
	catch (err) {
		Log.Warning(`Failed to fetch members for server Id ${serverId}. Error: ${err}`);
		return;
	}

	const VIPRole = guild.roles.cache.get(VIPRoleId);
	if (!VIPRole) {
		Log.Warning(`VIP role with Id ${VIPRoleId} not found in server.`);
		return;
	}

	for (const member of members.values()) {
		const userId = member.user.id;
		const user = await new User(userId).GetInfo();
		if (!user) {
			continue;
		}

		const hasVIPRole = member.roles.cache.has(VIPRoleId);
		const isVIP = user.IsVip();

		if (isVIP && !hasVIPRole) {
			try {
				await member.roles.add(VIPRole);
				Log.Success(`VIP role added to user ${member.user.displayName} (${userId})`);
			}
			catch (err) {
				Log.Warning(`Failed to add VIP role to user ${member.user.displayName} (${userId}). Error: ${err}`);
			}
		}
		else if (!isVIP && hasVIPRole) {
			try {
				await member.roles.remove(VIPRole);
				Log.Success(`VIP role removed from user ${member.user.displayName} (${userId})`);
			}
			catch (err) {
				Log.Warning(`Failed to remove VIP role from user ${member.user.displayName} (${userId}). Error: ${err}`);
			}
		}
	}
}

/**
 * Starts the procedure to periodically synchronize VIP roles in the official server.
 */
export async function startVIPProcedure() {
	await setAllVIPRolesInOfficialServer();
	setInterval(setAllVIPRolesInOfficialServer, 6 * 60 * 1_000);
}