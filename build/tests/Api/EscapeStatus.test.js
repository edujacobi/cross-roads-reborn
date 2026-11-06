"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const fastify_1 = __importDefault(require("fastify"));
const User_1 = require("#core/models/User");
const shared_1 = require("#api/sse/shared");
const escapeStatus_1 = require("#api/sse/escapeStatus");
vitest_1.vi.mock("#api/sse/shared", async (importOriginal) => {
    const original = await importOriginal();
    return {
        ...original,
        getSseUser: vitest_1.vi.fn(),
        openSseResponse: vitest_1.vi.fn(original.openSseResponse),
    };
});
(0, vitest_1.afterEach)(() => {
    vitest_1.vi.restoreAllMocks();
    vitest_1.vi.clearAllMocks();
    vitest_1.vi.useRealTimers();
});
(0, vitest_1.describe)("Escape status completion", () => {
    (0, vitest_1.it)("waits for a persisted result after the countdown expires", async () => {
        vitest_1.vi.useFakeTimers();
        const user = new User_1.User("123");
        user.Escape.HasTried = true;
        user.Escape.Time = new Date(Date.now() - 1_000);
        const escapeTime = user.Escape.Time.toISOString();
        user.Prison.Time = new Date(Date.now() + 3_600_000);
        const previousPrisonTime = user.Prison.Time;
        const resultPrisonTime = new Date(previousPrisonTime.getTime() + 20 * 60_000);
        vitest_1.vi.mocked(shared_1.getSseUser).mockResolvedValue(user);
        vitest_1.vi.spyOn(User_1.User.prototype, "GetInfo").mockImplementation(async function () {
            this.Escape = { ...user.Escape };
            this.Prison = { ...user.Prison, Time: resultPrisonTime };
            return this;
        });
        const app = (0, fastify_1.default)();
        (0, escapeStatus_1.registerEscapeStatusRoute)(app);
        await app.ready();
        try {
            const response = app.inject({ method: "GET", url: "/sse/escape-status" });
            let completed = false;
            void response.then(() => {
                completed = true;
            });
            await vitest_1.vi.waitFor(() => (0, vitest_1.expect)(shared_1.openSseResponse).toHaveBeenCalledOnce());
            await vitest_1.vi.advanceTimersByTimeAsync(1_000);
            (0, vitest_1.expect)(user.IsEscaping()).toBe(true);
            (0, vitest_1.expect)(completed).toBe(false);
            user.Escape.Time = new Date(0);
            await vitest_1.vi.advanceTimersByTimeAsync(500);
            const result = await response;
            const events = result.body.trim().split("\n\n").map(line => JSON.parse(line.slice(6)));
            (0, vitest_1.expect)(events[0]).toEqual({ type: "escaping", escapeTime });
            (0, vitest_1.expect)(events[1]).toMatchObject({
                type: "escape-ended",
                isInPrison: true,
                isWanted: false,
                escapeHasTried: true,
                message: vitest_1.expect.stringContaining("Você ficará preso por mais 20 minutos."),
                prisonTime: resultPrisonTime.toISOString(),
                wantedTime: null,
            });
        }
        finally {
            await app.close();
        }
    });
    vitest_1.it.each([true, false])("reports an already persisted result to a late subscriber (success: %s)", async (success) => {
        const user = new User_1.User("123");
        user.Escape.HasTried = true;
        user.Escape.Time = new Date(0);
        user.Prison.Time = new Date(Date.now() + (success ? -1_000 : 3_600_000));
        if (success)
            user.Wanted.Time = new Date(Date.now() + 40 * 60_000);
        vitest_1.vi.mocked(shared_1.getSseUser).mockResolvedValue(user);
        const app = (0, fastify_1.default)();
        (0, escapeStatus_1.registerEscapeStatusRoute)(app);
        try {
            const result = await app.inject({ method: "GET", url: "/sse/escape-status" });
            const event = JSON.parse(result.body.slice(6));
            (0, vitest_1.expect)(event).toMatchObject({
                type: "escape-ended",
                isInPrison: !success,
                isWanted: success,
                escapeHasTried: true,
                prisonTime: success ? null : user.Prison.Time.toISOString(),
                wantedTime: success ? user.Wanted.Time.toISOString() : null,
            });
            (0, vitest_1.expect)(event.message).toContain(success ? "polícia" : "Você ficará preso por mais 60 minutos.");
        }
        finally {
            await app.close();
        }
    });
    (0, vitest_1.it)("closes on timeout without reporting an unfinished escape as failed", async () => {
        vitest_1.vi.useFakeTimers();
        const user = new User_1.User("123");
        user.Escape.HasTried = true;
        user.Escape.Time = new Date(Date.now() - 1_000);
        vitest_1.vi.mocked(shared_1.getSseUser).mockResolvedValue(user);
        vitest_1.vi.spyOn(User_1.User.prototype, "GetInfo").mockImplementation(async function () {
            this.Escape = { ...user.Escape };
            return this;
        });
        const app = (0, fastify_1.default)();
        (0, escapeStatus_1.registerEscapeStatusRoute)(app);
        await app.ready();
        try {
            const response = app.inject({ method: "GET", url: "/sse/escape-status" });
            void response.then(() => undefined);
            await vitest_1.vi.waitFor(() => (0, vitest_1.expect)(shared_1.openSseResponse).toHaveBeenCalledOnce());
            await vitest_1.vi.advanceTimersByTimeAsync(90_000);
            const result = await response;
            (0, vitest_1.expect)(result.body).toContain("data: {\"type\":\"closed\"}");
            (0, vitest_1.expect)(result.body).not.toContain("escape-ended");
        }
        finally {
            await app.close();
        }
    });
});
//# sourceMappingURL=EscapeStatus.test.js.map