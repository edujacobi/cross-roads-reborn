import { describe, expect, it } from "vitest";
import { Collection } from "discord.js";
import { signAuthToken } from "#api/auth/jwt";
import { createApiServer } from "#api/server";
import { setClient } from "#bot/client";

describe("API server proxy handling", () => {
	it("uses the forwarded client IP when the request comes from a loopback proxy", async () => {
		const app = await createApiServer();
		app.get("/test-client-ip", request => ({ ip: request.ip }));

		try {
			const response = await app.inject({
				method: "GET",
				url: "/test-client-ip",
				headers: { "x-forwarded-for": "203.0.113.10" },
			});

			expect(response.json()).toEqual({ ip: "203.0.113.10" });
		}
		finally {
			await app.close();
		}
	});
});

describe("SSE status routes", () => {
	it("requires bearer authentication", async () => {
		const app = await createApiServer();

		try {
			for (const url of ["/sse/escape-status", "/sse/scavenge-status"]) {
				const response = await app.inject({ method: "GET", url });

				expect(response.statusCode).toBe(401);
				expect(response.json()).toEqual({ error: "Missing or invalid authorization header." });
			}
		}
		finally {
			await app.close();
		}
	});
});

describe("Web presence heartbeat", () => {
	it("records activity for the authenticated user", async () => {
		const client = setClient();
		client.userLastCommand = new Collection();
		const app = await createApiServer();

		try {
			const token = signAuthToken({
				userId: "123456",
				username: "Player",
				avatar: null,
				role: "PLAYER",
				situationId: 0,
			});
			const response = await app.inject({
				method: "POST",
				url: "/presence/heartbeat",
				headers: { authorization: `Bearer ${token}` },
			});

			expect(response.statusCode).toBe(204);
			expect(client.userLastCommand.get("123456")).toBeTypeOf("number");
		}
		finally {
			await app.close();
			client.destroy();
		}
	});

	it("rejects requests without a valid token and does not record activity", async () => {
		const client = setClient();
		client.userLastCommand = new Collection();
		const app = await createApiServer();

		try {
			for (const authorization of [undefined, "Bearer invalid.token"]) {
				const response = await app.inject({
					method: "POST",
					url: "/presence/heartbeat",
					headers: authorization ? { authorization } : {},
				});

				expect(response.statusCode).toBe(401);
			}

			expect(client.userLastCommand.size).toBe(0);
		}
		finally {
			await app.close();
			client.destroy();
		}
	});
});
