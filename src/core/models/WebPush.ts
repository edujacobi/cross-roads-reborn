import webPush from "web-push";
import { PushSubscriptionRepository } from "#core/repositories/PushSubscriptionRepository";
import { logger } from "#shared/log";

let isConfigured = false;

// Env is loaded after module imports (process.loadEnvFile in index.ts), so VAPID is configured lazily.
function configureVapid() {
	const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
	if (!isConfigured && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
		webPush.setVapidDetails(VAPID_SUBJECT ?? "mailto:contato@ejacobi.com.br", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
		isConfigured = true;
	}
	return isConfigured;
}

export interface WebPushSubscriptionInput {
	endpoint: string;
	keys: { p256dh: string; auth: string };
}

export class WebPush {
	static get PublicKey() {
		return configureVapid() ? process.env.VAPID_PUBLIC_KEY! : "";
	}

	static IsValidSubscription(subscription: unknown): subscription is WebPushSubscriptionInput {
		const candidate = subscription as WebPushSubscriptionInput | null;
		return typeof candidate?.endpoint === "string"
			&& candidate.endpoint.startsWith("https://")
			&& candidate.endpoint.length <= 1_024
			&& typeof candidate.keys?.p256dh === "string"
			&& typeof candidate.keys?.auth === "string";
	}

	static async Subscribe(userId: string, subscription: WebPushSubscriptionInput) {
		await PushSubscriptionRepository.Upsert(subscription.endpoint, userId, subscription.keys.p256dh, subscription.keys.auth);
	}

	static async Unsubscribe(userId: string, endpoint: string) {
		await PushSubscriptionRepository.DeleteByEndpoint(endpoint, userId);
	}

	/** Discord markdown/emotes do not render in native notifications, so they are stripped. */
	static ToPlainText(discordText: string) {
		return discordText
			.replace(/<a?:\w+:\d+>/g, "")
			.replace(/^-# /gm, "")
			.replace(/\*\*|__|~~|`/g, "")
			.split("\n")
			.map(line => line.replace(/[ \t]+/g, " ").trim())
			.join("\n")
			.trim();
	}

	static async Send(userId: string, body: string) {
		if (!configureVapid()) return;

		const subscriptions = await PushSubscriptionRepository.FindByUserId(userId);
		const payload = JSON.stringify({ title: "Cross Roads", body: WebPush.ToPlainText(body) });

		await Promise.all(subscriptions.map(async subscription => {
			try {
				await webPush.sendNotification(
					{ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
					payload,
				);
			}
			catch (error) {
				const statusCode = (error as { statusCode?: number }).statusCode;
				if (statusCode === 404 || statusCode === 410) {
					await PushSubscriptionRepository.DeleteByEndpoint(subscription.endpoint);
					return;
				}
				logger.warn(`Web push to user ${userId} failed: ${error}`);
			}
		}));
	}
}
