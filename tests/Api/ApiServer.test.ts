import { describe, expect, it } from "vitest";
import { createApiServer } from "#api/server";

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
