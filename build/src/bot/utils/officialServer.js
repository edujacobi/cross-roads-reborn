"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPlayerRoleInOfficialServer = setPlayerRoleInOfficialServer;
exports.setVIPRoleInOfficialServer = setVIPRoleInOfficialServer;
exports.setPlayerNicknameInOfficialServer = setPlayerNicknameInOfficialServer;
exports.syncUserInOfficialServer = syncUserInOfficialServer;
exports.isUserBoosterInOfficialServer = isUserBoosterInOfficialServer;
exports.isUserBoosterInOfficialServerByUserId = isUserBoosterInOfficialServerByUserId;
exports.startVIPProcedure = startVIPProcedure;
const User_1 = require("#core/models/User");
const log_1 = require("#shared/log");
const client_1 = require("#bot/client");
const Users_1 = require("#core/database/Users");
const sequelize_1 = require("sequelize");
/**
 * Assigns the 'Player' role to the user in the official server if they don't have it.
 * Only works in the production environment and official server.
 *
 * @param interaction - The interaction triggering the check.
 */
async function setPlayerRoleInOfficialServer(interaction) {
    if (process.env.NODE_ENV !== "PROD") {
        return;
    }
    const playerRoleId = process.env.PLAYER_ROLE_ID;
    const isInOfficialServer = interaction.guild?.id === process.env.SERVER_ID;
    if (!isInOfficialServer || !playerRoleId) {
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
    const isPlayer = user.roles.cache.has(playerRoleId);
    if (isPlayer) {
        return;
    }
    try {
        await user.roles.add(playerRole);
        log_1.Log.Success(`Role Player added to user ${interaction.user.displayName} (Id: ${interaction.user.id})`);
    }
    catch (err) {
        log_1.Log.Warning(`Something went wrong with adding role Player to user ${interaction.user.displayName} (Id: ${interaction.user.id}).`);
    }
}
/**
 * Synchronizes the 'VIP' role for the user in the official server based on their VIP status.
 * Only works in the production environment and official server.
 *
 * @param interaction - The interaction triggering the check.
 */
async function setVIPRoleInOfficialServer(interaction) {
    if (process.env.NODE_ENV !== "PROD") {
        return;
    }
    const VIPRoleId = process.env.VIP_ROLE_ID;
    const isInOfficialServer = interaction.guild?.id === process.env.SERVER_ID;
    if (!isInOfficialServer || !VIPRoleId) {
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
    const player = await new User_1.User(interaction.user.id).GetInfo();
    if (!player) {
        return;
    }
    const hasVIPRole = user.roles.cache.has(VIPRoleId);
    const isVIP = player.IsVip();
    if (hasVIPRole && isVIP) {
        return;
    }
    if (hasVIPRole && !isVIP) {
        try {
            await user.roles.remove(VIPRole);
            log_1.Log.Success(`Role VIP removed from user ${interaction.user.displayName} (Id: ${interaction.user.id})`);
        }
        catch (err) {
            log_1.Log.Warning(`Something went wrong with removing role VIP from user ${interaction.user.displayName} (Id: ${interaction.user.id}).`);
        }
    }
    if (!hasVIPRole && isVIP) {
        try {
            await user.roles.add(VIPRole);
            log_1.Log.Success(`Role VIP added to user ${interaction.user.displayName} (Id: ${interaction.user.id})`);
        }
        catch (err) {
            log_1.Log.Warning(`Something went wrong with adding role VIP to user ${interaction.user.displayName} (Id: ${interaction.user.id}).`);
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
async function setPlayerNicknameInOfficialServer(interaction, user) {
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
        log_1.Log.Success(`Nickname in server added to user ${interaction.user.displayName} (Id: ${interaction.user.id})`);
    }
    catch (err) {
        log_1.Log.Warning(`Something went wrong with adding Nickname in server to user ${interaction.user.displayName} (Id: ${interaction.user.id}).`);
    }
}
/**
 * Synchronizes a single user's roles and nickname in the official server.
 * This is a combined function to be called from the interaction handler.
 *
 * @param interaction - The interaction triggering the sync.
 * @param user - The user object from the database.
 */
async function syncUserInOfficialServer(interaction, user) {
    if (process.env.NODE_ENV !== "PROD") {
        return;
    }
    await Promise.allSettled([
        setPlayerRoleInOfficialServer(interaction),
        setVIPRoleInOfficialServer(interaction),
        setPlayerNicknameInOfficialServer(interaction, user),
    ]);
}
/**
 * Checks if the user is a server booster in the official server.
 * Only works in the production environment and official server.
 *
 * @param interaction - The interaction triggering the check.
 * @returns True if the user is a booster, false otherwise.
 */
async function isUserBoosterInOfficialServer(interaction) {
    if (process.env.NODE_ENV !== "PROD") {
        return false;
    }
    const boosterRoleId = process.env.BOOSTER_ROLE_ID;
    const isInOfficialServer = interaction.guild?.id === process.env.SERVER_ID;
    if (!isInOfficialServer || !boosterRoleId) {
        return false;
    }
    const member = interaction.guild.members.cache.get(interaction.user.id);
    if (!member) {
        return false;
    }
    return member.roles.cache.has(boosterRoleId);
}
function isUserBoosterInOfficialServerByUserId(userId) {
    if (process.env.NODE_ENV !== "PROD") {
        return false;
    }
    const serverId = process.env.SERVER_ID;
    const boosterRoleId = process.env.BOOSTER_ROLE_ID;
    if (!serverId || !boosterRoleId) {
        return false;
    }
    const guild = (0, client_1.getClient)().guilds.cache.get(serverId);
    const member = guild?.members.cache.get(userId);
    return member?.roles.cache.has(boosterRoleId) ?? false;
}
/**
 * Checks all members of the official server and synchronizes their VIP role.
 * VIP users without the role will receive it; non-VIP users with the role will lose it.
 */
async function setAllVIPRolesInOfficialServer() {
    if (process.env.NODE_ENV !== "PROD") {
        return;
    }
    const client = (0, client_1.getClient)();
    const serverId = process.env.SERVER_ID;
    const VIPRoleId = process.env.VIP_ROLE_ID;
    if (!serverId || !VIPRoleId) {
        log_1.Log.Warning("SERVER_ID or VIP_ROLE_ID is not set in environment variables.");
        return;
    }
    const guild = client.guilds.cache.get(serverId);
    if (!guild) {
        log_1.Log.Warning(`Official server with Id ${serverId} not found.`);
        return;
    }
    let members;
    try {
        members = await guild.members.fetch();
    }
    catch (err) {
        log_1.Log.Warning(`Failed to fetch members for server Id ${serverId}. Error: ${err}`);
        return;
    }
    const VIPRole = guild.roles.cache.get(VIPRoleId);
    if (!VIPRole) {
        log_1.Log.Warning(`VIP role with Id ${VIPRoleId} not found in server.`);
        return;
    }
    // Optimization: Fetch all VIP users from database first
    const dbVipUsers = await Users_1.Users.findAll({
        where: {
            [sequelize_1.Op.or]: [
                { vipEternal: true },
                { vipTime: { [sequelize_1.Op.gt]: new Date() } },
            ],
        },
        attributes: ["id"],
    });
    const vipUserIds = new Set(dbVipUsers.map(u => u.id));
    for (const member of members.values()) {
        const userId = member.user.id;
        const hasVIPRole = member.roles.cache.has(VIPRoleId);
        const isVIP = vipUserIds.has(userId);
        if (isVIP && !hasVIPRole) {
            try {
                await member.roles.add(VIPRole);
                log_1.Log.Success(`VIP role added to user ${member.user.displayName} (${userId})`);
            }
            catch (err) {
                log_1.Log.Warning(`Failed to add VIP role to user ${member.user.displayName} (${userId}). Error: ${err}`);
            }
        }
        else if (!isVIP && hasVIPRole) {
            try {
                await member.roles.remove(VIPRole);
                log_1.Log.Success(`VIP role removed from user ${member.user.displayName} (${userId})`);
            }
            catch (err) {
                log_1.Log.Warning(`Failed to remove VIP role from user ${member.user.displayName} (${userId}). Error: ${err}`);
            }
        }
    }
}
/**
 * Starts the procedure to periodically synchronize VIP roles in the official server.
 */
async function startVIPProcedure() {
    await setAllVIPRolesInOfficialServer();
    setInterval(setAllVIPRolesInOfficialServer, 6 * 60 * 1_000);
}
//# sourceMappingURL=officialServer.js.map