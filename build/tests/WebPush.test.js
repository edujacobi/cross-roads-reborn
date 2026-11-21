"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const { mockSetVapidDetails, mockSendNotification, mockFindByUserId } = vitest_1.vi.hoisted(() => ({
    mockSetVapidDetails: vitest_1.vi.fn(),
    mockSendNotification: vitest_1.vi.fn(),
    mockFindByUserId: vitest_1.vi.fn(),
}));
vitest_1.vi.mock("web-push", () => ({
    default: {
        setVapidDetails: mockSetVapidDetails,
        sendNotification: mockSendNotification,
    },
}));
vitest_1.vi.mock("#core/repositories/PushSubscriptionRepository", () => ({
    PushSubscriptionRepository: { FindByUserId: mockFindByUserId },
}));
const WebPush_1 = require("#core/models/WebPush");
(0, vitest_1.beforeEach)(() => {
    vitest_1.vi.stubEnv("VAPID_PUBLIC_KEY", "public-key");
    vitest_1.vi.stubEnv("VAPID_PRIVATE_KEY", "private-key");
    mockSendNotification.mockReset().mockResolvedValue(undefined);
    mockFindByUserId.mockReset().mockResolvedValue([{
            endpoint: "https://push.example/subscription",
            p256dh: "p256dh",
            auth: "auth",
        }]);
});
(0, vitest_1.afterEach)(() => {
    vitest_1.vi.unstubAllEnvs();
    vitest_1.vi.restoreAllMocks();
});
(0, vitest_1.describe)("WebPush.ToPlainText", () => {
    (0, vitest_1.it)("strips Discord emotes and markdown", () => {
        (0, vitest_1.expect)(WebPush_1.WebPush.ToPlainText("You finished your **Cook** job! <:jobs:123456>\n-# <a:hench:987> 		Fee __paid__ by cool_guy"))
            .toBe("You finished your Cook job!\nFee paid by cool_guy");
    });
});
(0, vitest_1.describe)("WebPush.Send", () => {
    (0, vitest_1.it)("passes notification actions and high urgency to the push service", async () => {
        await WebPush_1.WebPush.Send("user-1", "Defenda seu investimento.", {
            actions: [{ action: "defend", title: "Defender investimento" }],
            data: { sessionId: "session-1" },
            requireInteraction: true,
            tag: "session-1",
            title: "Investimento sob ataque",
            ttlSeconds: 60,
            urgency: "high",
        });
        (0, vitest_1.expect)(mockSetVapidDetails).toHaveBeenCalled();
        (0, vitest_1.expect)(mockFindByUserId).toHaveBeenCalledWith("user-1");
        (0, vitest_1.expect)(mockSendNotification).toHaveBeenCalledWith({
            endpoint: "https://push.example/subscription",
            keys: { p256dh: "p256dh", auth: "auth" },
        }, JSON.stringify({
            title: "Investimento sob ataque",
            body: "Defenda seu investimento.",
            actions: [{ action: "defend", title: "Defender investimento" }],
            data: { sessionId: "session-1" },
            requireInteraction: true,
            tag: "session-1",
        }), { urgency: "high", TTL: 60 });
    });
});
//# sourceMappingURL=WebPush.test.js.map