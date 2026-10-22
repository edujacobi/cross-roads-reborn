import { afterEach, describe, expect, it, vi } from "vitest";
import Fastify from "fastify";
import { User } from "#core/models/User";
import { getSseUser, openSseResponse } from "#api/sse/shared";
import { registerEscapeStatusRoute } from "#api/sse/escapeStatus";

vi.mock("#api/sse/shared", async importOriginal => {
	const original = await importOriginal<typeof import("#api/sse/shared")>();
	return {
		...original,
		getSseUser: vi.fn(),
		openSseResponse: vi.fn(original.openSseResponse),
	};
});

afterEach(() => {
	vi.restoreAllMocks();
	vi.clearAllMocks();
	vi.useRealTimers();
});

describe("Escape status completion", () => {
	it("waits for a persisted result after the countdown expires", async () => {
		vi.useFakeTimers();
		const user = new User("123");
		user.Escape.HasTried = true;
		user.Escape.Time = new Date(Date.now() - 1_000);
		const escapeTime = user.Escape.Time.toISOString();
		user.Prison.Time = new Date(Date.now() + 3_600_000);
		vi.mocked(getSseUser).mockResolvedValue(user);
		vi.spyOn(User.prototype, "GetInfo").mockImplementation(async function(this: User) {
			this.Escape = { ...user.Escape };
			this.Prison = { ...user.Prison };
			return this;
		});
		const app = Fastify();
		registerEscapeStatusRoute(app);
		await app.ready();

		try {
			const response = app.inject({ method: "GET", url: "/sse/escape-status" });
			let completed = false;
			void response.then(() => {
				completed = true;
			});
			await vi.waitFor(() => expect(openSseResponse).toHaveBeenCalledOnce());
			await vi.advanceTimersByTimeAsync(1_000);
			expect(user.IsEscaping()).toBe(true);
			expect(completed).toBe(false);

			user.Escape.Time = new Date(0);
			await vi.advanceTimersByTimeAsync(500);
			const result = await response;
			const events = result.body.trim().split("\n\n").map(line => JSON.parse(line.slice(6)));

			expect(events).toEqual([
				{ type: "escaping", escapeTime },
				{ type: "escape-ended", isInPrison: true, isWanted: false },
			]);
		}
		finally {
			await app.close();
		}
	});

	it.each([true, false])("reports an already persisted result to a late subscriber (success: %s)", async success => {
		const user = new User("123");
		user.Escape.HasTried = true;
		user.Escape.Time = new Date(0);
		user.Prison.Time = new Date(Date.now() + (success ? -1_000 : 3_600_000));
		vi.mocked(getSseUser).mockResolvedValue(user);
		const app = Fastify();
		registerEscapeStatusRoute(app);

		try {
			const result = await app.inject({ method: "GET", url: "/sse/escape-status" });
			expect(JSON.parse(result.body.slice(6))).toEqual({
				type: "escape-ended",
				isInPrison: !success,
				isWanted: success,
				escapeHasTried: true,
			});
		}
		finally {
			await app.close();
		}
	});

	it("closes on timeout without reporting an unfinished escape as failed", async () => {
		vi.useFakeTimers();
		const user = new User("123");
		user.Escape.HasTried = true;
		user.Escape.Time = new Date(Date.now() - 1_000);
		vi.mocked(getSseUser).mockResolvedValue(user);
		vi.spyOn(User.prototype, "GetInfo").mockImplementation(async function(this: User) {
			this.Escape = { ...user.Escape };
			return this;
		});
		const app = Fastify();
		registerEscapeStatusRoute(app);
		await app.ready();

		try {
			const response = app.inject({ method: "GET", url: "/sse/escape-status" });
			void response.then(() => undefined);
			await vi.waitFor(() => expect(openSseResponse).toHaveBeenCalledOnce());
			await vi.advanceTimersByTimeAsync(90_000);

			const result = await response;
			expect(result.body).toContain("data: {\"type\":\"closed\"}");
			expect(result.body).not.toContain("escape-ended");
		}
		finally {
			await app.close();
		}
	});
});
