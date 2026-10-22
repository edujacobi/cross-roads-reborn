import { afterEach, describe, expect, it, vi } from "vitest";
import Fastify from "fastify";
import { getSseUser, openSseResponse } from "#api/sse/shared";
import { registerScavengeStatusRoute } from "#api/sse/scavengeStatus";
import { registerRobStatusRoute } from "#api/sse/robStatus";
import { TimedAction } from "#core/models/TimedAction";
import { User } from "#core/models/User";

vi.mock("#api/sse/shared", async importOriginal => {
	const original = await importOriginal<typeof import("#api/sse/shared")>();
	return { ...original, getSseUser: vi.fn(), openSseResponse: vi.fn(original.openSseResponse) };
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.clearAllMocks();
	vi.useRealTimers();
});

describe.each(["scavenge", "robbery"] as const)("%s SSE results", kind => {
	const url = kind === "scavenge" ? "/sse/scavenge-status" : "/sse/rob-status";
	const resultType = kind === "scavenge" ? "scavenge-ended" : "rob-ended";

	it("waits for a committed result and replays it even after the active marker is cleared", async () => {
		vi.useFakeTimers();
		vi.mocked(getSseUser).mockResolvedValue(new User("player"));
		const status = { id: "attempt", referenceId: 0, dueAt: new Date(Date.now() - 1_000), result: null as string | null };
		vi.spyOn(TimedAction, "GetStatus").mockImplementation(async () => ({ ...status }));
		const app = Fastify();
		registerScavengeStatusRoute(app);
		registerRobStatusRoute(app);
		await app.ready();
		let completed = false;
		const response = app.inject({ method: "GET", url });
		void response.then(() => {
			completed = true;
		});
		try {
			await vi.waitFor(() => expect(openSseResponse).toHaveBeenCalled());
			await vi.advanceTimersByTimeAsync(1_000);
			expect(completed).toBe(false);
			status.result = JSON.stringify({
				completed: true, success: true, moneyRobbed: 100,
				rewardDescription: "Cr$ 100", cooldownEndsAt: new Date(),
			});
			await vi.advanceTimersByTimeAsync(500);
			const result = await response;
			expect(JSON.parse(result.body.slice(6)).type).toBe(resultType);

			const replay = await app.inject({ method: "GET", url });
			expect(replay.body).toBe(result.body);
		}
		finally {
			await app.close();
		}
	});

	it("closes with an explicit event if persisted status cannot be read", async () => {
		vi.mocked(getSseUser).mockResolvedValue(new User("player"));
		vi.spyOn(TimedAction, "GetStatus").mockRejectedValue(new Error("database unavailable"));
		const app = Fastify();
		registerScavengeStatusRoute(app);
		registerRobStatusRoute(app);
		try {
			const result = await app.inject({ method: "GET", url });
			expect(JSON.parse(result.body.slice(6))).toEqual({ type: "closed" });
		}
		finally {
			await app.close();
		}
	});

	it("does not send a newer attempt's result to the current subscriber", async () => {
		vi.useFakeTimers();
		vi.mocked(getSseUser).mockResolvedValue(new User("player"));
		vi.spyOn(TimedAction, "GetStatus")
			.mockResolvedValueOnce({ id: "original", referenceId: 0, dueAt: new Date(), result: null })
			.mockResolvedValue({ id: "newer", referenceId: 0, dueAt: new Date(), result: "{\"success\":true}" });
		const app = Fastify();
		registerScavengeStatusRoute(app);
		registerRobStatusRoute(app);
		await app.ready();

		try {
			const response = app.inject({ method: "GET", url });
			void response.then(() => undefined);
			await vi.waitFor(() => expect(openSseResponse).toHaveBeenCalled());
			await vi.advanceTimersByTimeAsync(500);

			const result = await response;
			expect(JSON.parse(result.body.slice(6))).toEqual({ type: "closed" });
		}
		finally {
			await app.close();
		}
	});
});
