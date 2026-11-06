"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDiscordClientId = getDiscordClientId;
exports.getDiscordClientSecret = getDiscordClientSecret;
exports.getDiscordRedirectUri = getDiscordRedirectUri;
exports.getFrontendUrl = getFrontendUrl;
exports.buildDiscordAuthUrl = buildDiscordAuthUrl;
exports.handleDiscordCallback = handleDiscordCallback;
const UserBadge_1 = require("#core/models/UserBadge");
const jwt_1 = require("#api/auth/jwt");
const log_1 = require("#shared/log");
const Ids_1 = require("#core/types/Ids");
function getDiscordClientId() {
    return (process.env.DISCORD_CLIENT_ID ||
        (process.env.NODE_ENV === "DEV" ? process.env.CLIENT_ID_DEV : process.env.CLIENT_ID) ||
        "");
}
function getDiscordClientSecret() {
    return process.env.DISCORD_CLIENT_SECRET || process.env.CLIENT_SECRET || "";
}
function getDiscordRedirectUri() {
    return process.env.DISCORD_REDIRECT_URI || "http://localhost:3001/auth/discord/callback";
}
function getFrontendUrl() {
    return process.env.FRONTEND_URL || "http://localhost:3000";
}
function buildDiscordAuthUrl() {
    const clientId = getDiscordClientId();
    const redirectUri = encodeURIComponent(getDiscordRedirectUri());
    return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify`;
}
async function handleDiscordCallback(code) {
    const clientId = getDiscordClientId();
    const clientSecret = getDiscordClientSecret();
    const redirectUri = getDiscordRedirectUri();
    if (!clientId || !clientSecret) {
        log_1.logger.error("Missing Discord OAuth2 credentials (DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET).");
        return { error: "Discord OAuth2 credentials not configured on server.", status: 500 };
    }
    try {
        // 1. Exchange code for access token
        const tokenParams = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri,
        });
        const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: tokenParams.toString(),
        });
        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.text();
            log_1.logger.warn(`Discord token exchange failed: ${errorData}`);
            return { error: "Failed to exchange Discord authorization code.", status: 400 };
        }
        const tokenData = (await tokenResponse.json());
        // 2. Fetch user profile from Discord
        const userResponse = await fetch("https://discord.com/api/users/@me", {
            headers: { Authorization: `${tokenData.token_type} ${tokenData.access_token}` },
        });
        if (!userResponse.ok) {
            return { error: "Failed to fetch Discord user profile.", status: 400 };
        }
        const discordUser = (await userResponse.json());
        // 3. Assign the highest Discord badge role, or regular player access.
        const [isDeveloper, isModerator, isHelper] = await Promise.all([
            UserBadge_1.UserBadge.IsDeveloper(discordUser.id),
            UserBadge_1.UserBadge.IsModerator(discordUser.id),
            UserBadge_1.UserBadge.IsHelper(discordUser.id),
        ]);
        // Fallback check for owner if configured
        const isOwner = process.env.JACOBI_ID && discordUser.id === process.env.JACOBI_ID;
        let role;
        if (isDeveloper || isOwner) {
            role = "DEVELOPER";
        }
        else if (isModerator) {
            role = "MODERATOR";
        }
        else if (isHelper) {
            role = "HELPER";
        }
        else {
            role = "PLAYER";
        }
        const avatarUrl = discordUser.avatar
            ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
            : `https://cdn.discordapp.com/embed/avatars/0.png`;
        const authUser = {
            userId: discordUser.id,
            username: discordUser.global_name || discordUser.username,
            avatar: avatarUrl,
            role,
            situationId: Ids_1.SituationId.Idling,
        };
        const token = (0, jwt_1.signAuthToken)(authUser);
        log_1.logger.info(`User logged in: ${authUser.username} (${authUser.userId}) as ${authUser.role}`);
        return { token, user: authUser };
    }
    catch (err) {
        log_1.logger.error("Error during Discord OAuth callback:", err);
        return { error: "Internal server error during authentication.", status: 500 };
    }
}
//# sourceMappingURL=discord.js.map