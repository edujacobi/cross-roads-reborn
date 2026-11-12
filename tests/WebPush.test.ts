import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockSetVapidDetails, mockSendNotification, mockFindByUserId } = vi.hoisted(() => ({
	mockSetVapidDetails: vi.fn(),
	mockSendNotification: vi.fn(),
	mockFindByUserId: vi.fn(),
}));

vi.mock("web-push", () => ({
	default: {
		setVapidDetails: mockSetVapidDetails,
		sendNotification: mockSendNotification,
	},
}));

vi.mock("#core/repositories/PushSubscriptionRepository", () => ({
	PushSubscriptionRepository: { FindByUserId: mockFindByUserId },
}));

import { WebPush } from "#core/models/WebPush";

beforeEach(() => {
	vi.stubEnv("VAPID_PUBLIC_KEY", "public-key");
	vi.stubEnv("VAPID_PRIVATE_KEY", "private-key");
	mockSendNotification.mockReset().mockResolvedValue(undefined);
	mockFindByUserId.mockReset().mockResolvedValue([{
		endpoint: "https://push.example/subscription",
		p256dh: "p256dh",
		auth: "auth",
	}]);
});

afterEach(() => {
	vi.unstubAllEnvs();
	vi.restoreAllMocks();
});

describe("WebPush.ToPlainText", () => {
	it("strips Discord emotes and markdown", () => {
		expect(WebPush.ToPlainText("You finished your **Cook** job! <:jobs:123456>\n-# <a:hench:987> 		Fee __paid__ by cool_guy"))
			.toBe("You finished your Cook job!\nFee paid by cool_guy");
	});
});

describe("WebPush.Send", () => {
	it("passes notification actions and high urgency to the push service", async () => {
		await WebPush.Send("user-1", "Defenda seu investimento.", {
			actions: [{ action: "defend", title: "Defender investimento" }],
			data: { sessionId: "session-1" },
			requireInteraction: true,
			tag: "session-1",
			title: "Investimento sob ataque",
			ttlSeconds: 60,
			urgency: "high",
		});

		expect(mockSetVapidDetails).toHaveBeenCalled();
		expect(mockFindByUserId).toHaveBeenCalledWith("user-1");
		expect(mockSendNotification).toHaveBeenCalledWith(
			{
				endpoint: "https://push.example/subscription",
				keys: { p256dh: "p256dh", auth: "auth" },
			},
			JSON.stringify({
				title: "Investimento sob ataque",
				body: "Defenda seu investimento.",
				actions: [{ action: "defend", title: "Defender investimento" }],
				data: { sessionId: "session-1" },
				requireInteraction: true,
				tag: "session-1",
			}),
			{ urgency: "high", TTL: 60 },
		);
	});
});
