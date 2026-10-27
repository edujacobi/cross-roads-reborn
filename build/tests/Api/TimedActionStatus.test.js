"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const fastify_1 = __importDefault(require("fastify"));
const shared_1 = require("#api/sse/shared");
const scavengeStatus_1 = require("#api/sse/scavengeStatus");
const robStatus_1 = require("#api/sse/robStatus");
const TimedAction_1 = require("#core/models/TimedAction");
const User_1 = require("#core/models/User");
vitest_1.vi.mock("#api/sse/shared", async (importOriginal) => {
    const original = await importOriginal();
    return { ...original, getSseUser: vitest_1.vi.fn(), openSseResponse: vitest_1.vi.fn(original.openSseResponse) };
});
(0, vitest_1.afterEach)(() => {
    vitest_1.vi.restoreAllMocks();
    vitest_1.vi.clearAllMocks();
    vitest_1.vi.useRealTimers();
});
vitest_1.describe.each(["scavenge", "robbery"])("%s SSE results", kind => {
    const url = kind === "scavenge" ? "/sse/scavenge-status" : "/sse/rob-status";
    const resultType = kind === "scavenge" ? "scavenge-ended" : "rob-ended";
    (0, vitest_1.it)("waits for a committed result and replays it even after the active marker is cleared", async () => {
        vitest_1.vi.useFakeTimers();
        vitest_1.vi.mocked(shared_1.getSseUser).mockResolvedValue(new User_1.User("player"));
        const status = { id: "attempt", referenceId: 0, dueAt: new Date(Date.now() - 1_000), result: null };
        vitest_1.vi.spyOn(TimedAction_1.TimedAction, "GetStatus").mockImplementation(async () => ({ ...status }));
        const app = (0, fastify_1.default)();
        (0, scavengeStatus_1.registerScavengeStatusRoute)(app);
        (0, robStatus_1.registerRobStatusRoute)(app);
        await app.ready();
        let completed = false;
        const response = app.inject({ method: "GET", url });
        void response.then(() => {
            completed = true;
        });
        try {
            await vitest_1.vi.waitFor(() => (0, vitest_1.expect)(shared_1.openSseResponse).toHaveBeenCalled());
            await vitest_1.vi.advanceTimersByTimeAsync(1_000);
            (0, vitest_1.expect)(completed).toBe(false);
            status.result = JSON.stringify({
                completed: true, success: true, moneyRobbed: 100,
                rewardDescription: "Cr$ 100", cooldownEndsAt: new Date(),
            });
            await vitest_1.vi.advanceTimersByTimeAsync(500);
            const result = await response;
            (0, vitest_1.expect)(JSON.parse(result.body.slice(6)).type).toBe(resultType);
            const replay = await app.inject({ method: "GET", url });
            (0, vitest_1.expect)(replay.body).toBe(result.body);
        }
        finally {
            await app.close();
        }
    });
    (0, vitest_1.it)("closes with an explicit event if persisted status cannot be read", async () => {
        vitest_1.vi.mocked(shared_1.getSseUser).mockResolvedValue(new User_1.User("player"));
        vitest_1.vi.spyOn(TimedAction_1.TimedAction, "GetStatus").mockRejectedValue(new Error("database unavailable"));
        const app = (0, fastify_1.default)();
        (0, scavengeStatus_1.registerScavengeStatusRoute)(app);
        (0, robStatus_1.registerRobStatusRoute)(app);
        try {
            const result = await app.inject({ method: "GET", url });
            (0, vitest_1.expect)(JSON.parse(result.body.slice(6))).toEqual({ type: "closed" });
        }
        finally {
            await app.close();
        }
    });
    (0, vitest_1.it)("does not send a newer attempt's result to the current subscriber", async () => {
        vitest_1.vi.useFakeTimers();
        vitest_1.vi.mocked(shared_1.getSseUser).mockResolvedValue(new User_1.User("player"));
        vitest_1.vi.spyOn(TimedAction_1.TimedAction, "GetStatus")
            .mockResolvedValueOnce({ id: "original", referenceId: 0, dueAt: new Date(), result: null })
            .mockResolvedValue({ id: "newer", referenceId: 0, dueAt: new Date(), result: "{\"success\":true}" });
        const app = (0, fastify_1.default)();
        (0, scavengeStatus_1.registerScavengeStatusRoute)(app);
        (0, robStatus_1.registerRobStatusRoute)(app);
        await app.ready();
        try {
            const response = app.inject({ method: "GET", url });
            void response.then(() => undefined);
            await vitest_1.vi.waitFor(() => (0, vitest_1.expect)(shared_1.openSseResponse).toHaveBeenCalled());
            await vitest_1.vi.advanceTimersByTimeAsync(500);
            const result = await response;
            (0, vitest_1.expect)(JSON.parse(result.body.slice(6))).toEqual({ type: "closed" });
        }
        finally {
            await app.close();
        }
    });
});
//# sourceMappingURL=TimedActionStatus.test.js.map