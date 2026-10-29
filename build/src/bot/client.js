"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClient = getClient;
exports.setClient = setClient;
const discord_js_1 = require("discord.js");
let client;
function getClient() {
    return client;
}
function setClient() {
    client = new discord_js_1.Client({
        intents: [discord_js_1.GatewayIntentBits.Guilds],
        rest: {
            timeout: 30_000,
            retries: 5,
        },
        makeCache: discord_js_1.Options.cacheWithLimits({
            MessageManager: 0,
            ThreadManager: 0,
            UserManager: 100,
            GuildMemberManager: 100,
            PresenceManager: 0,
            ReactionManager: 0,
            GuildBanManager: 0,
            GuildInviteManager: 0,
            GuildScheduledEventManager: 0,
            GuildStickerManager: 0,
            VoiceStateManager: 0,
        }),
    });
    return client;
}
//# sourceMappingURL=client.js.map