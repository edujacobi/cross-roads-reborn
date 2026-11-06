"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebPush = void 0;
const web_push_1 = __importDefault(require("web-push"));
const PushSubscriptionRepository_1 = require("#core/repositories/PushSubscriptionRepository");
const log_1 = require("#shared/log");
let isConfigured = false;
// Env is loaded after module imports (process.loadEnvFile in index.ts), so VAPID is configured lazily.
function configureVapid() {
    const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
    if (!isConfigured && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
        web_push_1.default.setVapidDetails(VAPID_SUBJECT ?? "mailto:contato@ejacobi.com.br", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
        isConfigured = true;
    }
    return isConfigured;
}
class WebPush {
    static get PublicKey() {
        return configureVapid() ? process.env.VAPID_PUBLIC_KEY : "";
    }
    static IsValidSubscription(subscription) {
        const candidate = subscription;
        return typeof candidate?.endpoint === "string"
            && candidate.endpoint.startsWith("https://")
            && candidate.endpoint.length <= 1_024
            && typeof candidate.keys?.p256dh === "string"
            && typeof candidate.keys?.auth === "string";
    }
    static async Subscribe(userId, subscription) {
        await PushSubscriptionRepository_1.PushSubscriptionRepository.Upsert(subscription.endpoint, userId, subscription.keys.p256dh, subscription.keys.auth);
    }
    static async Unsubscribe(userId, endpoint) {
        await PushSubscriptionRepository_1.PushSubscriptionRepository.DeleteByEndpoint(endpoint, userId);
    }
    /** Discord markdown/emotes do not render in native notifications, so they are stripped. */
    static ToPlainText(discordText) {
        return discordText
            .replace(/<a?:\w+:\d+>/g, "")
            .replace(/^-# /gm, "")
            .replace(/\*\*|__|~~|`/g, "")
            .split("\n")
            .map(line => line.replace(/[ \t]+/g, " ").trim())
            .join("\n")
            .trim();
    }
    static async Send(userId, body) {
        if (!configureVapid())
            return;
        const subscriptions = await PushSubscriptionRepository_1.PushSubscriptionRepository.FindByUserId(userId);
        const payload = JSON.stringify({ title: "Cross Roads", body: WebPush.ToPlainText(body) });
        await Promise.all(subscriptions.map(async (subscription) => {
            try {
                await web_push_1.default.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, payload);
            }
            catch (error) {
                const statusCode = error.statusCode;
                if (statusCode === 404 || statusCode === 410) {
                    await PushSubscriptionRepository_1.PushSubscriptionRepository.DeleteByEndpoint(subscription.endpoint);
                    return;
                }
                log_1.logger.warn(`Web push to user ${userId} failed: ${error}`);
            }
        }));
    }
}
exports.WebPush = WebPush;
//# sourceMappingURL=WebPush.js.map