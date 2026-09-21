import { UserBadge } from "#core/models/UserBadge";
import type { AuthUser, UserRole } from "#api/types";
import { signAuthToken } from "#api/auth/jwt";
import { logger } from "#shared/log";

export interface DiscordOAuthUser {
	id: string;
	username: string;
	discriminator: string;
	avatar: string | null;
	global_name: string | null;
}

export function getDiscordClientId(): string {
	return (
		process.env.DISCORD_CLIENT_ID ||
		(process.env.NODE_ENV === "DEV" ? process.env.CLIENT_ID_DEV : process.env.CLIENT_ID) ||
		""
	);
}

export function getDiscordClientSecret(): string {
	return process.env.DISCORD_CLIENT_SECRET || process.env.CLIENT_SECRET || "";
}

export function getDiscordRedirectUri(): string {
	return process.env.DISCORD_REDIRECT_URI || "http://localhost:3001/auth/discord/callback";
}

export function getFrontendUrl(): string {
	return process.env.FRONTEND_URL || "http://localhost:3000";
}

export function buildDiscordAuthUrl(): string {
	const clientId = getDiscordClientId();
	const redirectUri = encodeURIComponent(getDiscordRedirectUri());
	return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify`;
}

export async function handleDiscordCallback(code: string): Promise<{ token: string; user: AuthUser } | { error: string; status: number }> {
	const clientId = getDiscordClientId();
	const clientSecret = getDiscordClientSecret();
	const redirectUri = getDiscordRedirectUri();

	if (!clientId || !clientSecret) {
		logger.error("Missing Discord OAuth2 credentials (DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET).");
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
			logger.warn(`Discord token exchange failed: ${errorData}`);
			return { error: "Failed to exchange Discord authorization code.", status: 400 };
		}

		const tokenData = (await tokenResponse.json()) as { access_token: string; token_type: string };

		// 2. Fetch user profile from Discord
		const userResponse = await fetch("https://discord.com/api/users/@me", {
			headers: { Authorization: `${tokenData.token_type} ${tokenData.access_token}` },
		});

		if (!userResponse.ok) {
			return { error: "Failed to fetch Discord user profile.", status: 400 };
		}

		const discordUser = (await userResponse.json()) as DiscordOAuthUser;

		// 3. Permission verification: IsDeveloper or IsModerator
		const [isDeveloper, isModerator] = await Promise.all([
			UserBadge.IsDeveloper(discordUser.id),
			UserBadge.IsModerator(discordUser.id),
		]);

		// Fallback check for owner if configured
		const isOwner = process.env.JACOBI_ID && discordUser.id === process.env.JACOBI_ID;

		if (!isDeveloper && !isModerator && !isOwner) {
			logger.warn(`User ${discordUser.username} (${discordUser.id}) attempted to login to admin panel without Developer or Moderator badge.`);
			return {
				error: "Access denied. You must have the Developer or Moderator badge to access this admin panel.",
				status: 403,
			};
		}

		const role: UserRole = (isDeveloper || isOwner) ? "DEVELOPER" : "MODERATOR";

		const avatarUrl = discordUser.avatar
			? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
			: `https://cdn.discordapp.com/embed/avatars/0.png`;

		const authUser: AuthUser = {
			userId: discordUser.id,
			username: discordUser.global_name || discordUser.username,
			avatar: avatarUrl,
			role,
		};

		const token = signAuthToken(authUser);
		logger.info(`Admin logged in: ${authUser.username} (${authUser.userId}) as ${authUser.role}`);

		return { token, user: authUser };
	}
	catch (err) {
		logger.error("Error during Discord OAuth callback:", err);
		return { error: "Internal server error during authentication.", status: 500 };
	}
}
