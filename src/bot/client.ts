import { Client, GatewayIntentBits, Options } from "discord.js";

let client: Client;

export function getClient() {
	return client;
}

export function setClient() {
	client = new Client({
		intents: [GatewayIntentBits.Guilds],
		makeCache: Options.cacheWithLimits({
			MessageManager: 0,
			ThreadManager: 0,
			UserManager: 100,
			GuildMemberManager: 100,
			PresenceManager: 0,
			ReactionManager: 0,
			GuildBanManager: 0,
			GuildEmojiManager: 0,
			GuildInviteManager: 0,
			GuildScheduledEventManager: 0,
			GuildStickerManager: 0,
			VoiceStateManager: 0,
		}),
	});
	return client;
}