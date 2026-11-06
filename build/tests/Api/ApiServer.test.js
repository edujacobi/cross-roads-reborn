"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const discord_js_1 = require("discord.js");
const jwt_1 = require("#api/auth/jwt");
const server_1 = require("#api/server");
const client_1 = require("#bot/client");
(0, vitest_1.describe)("API server proxy handling", () => {
    (0, vitest_1.it)("uses the forwarded client IP when the request comes from a loopback proxy", async () => {
        const app = await (0, server_1.createApiServer)();
        app.get("/test-client-ip", request => ({ ip: request.ip }));
        try {
            const response = await app.inject({
                method: "GET",
                url: "/test-client-ip",
                headers: { "x-forwarded-for": "203.0.113.10" },
            });
            (0, vitest_1.expect)(response.json()).toEqual({ ip: "203.0.113.10" });
        }
        finally {
            await app.close();
        }
    });
});
(0, vitest_1.describe)("SSE status routes", () => {
    (0, vitest_1.it)("requires bearer authentication", async () => {
        const app = await (0, server_1.createApiServer)();
        try {
            for (const url of ["/sse/escape-status", "/sse/scavenge-status"]) {
                const response = await app.inject({ method: "GET", url });
                (0, vitest_1.expect)(response.statusCode).toBe(401);
                (0, vitest_1.expect)(response.json()).toEqual({ error: "Missing or invalid authorization header." });
            }
        }
        finally {
            await app.close();
        }
    });
});
(0, vitest_1.describe)("Web presence heartbeat", () => {
    (0, vitest_1.it)("records activity for the authenticated user", async () => {
        const client = (0, client_1.setClient)();
        client.userLastCommand = new discord_js_1.Collection();
        const app = await (0, server_1.createApiServer)();
        try {
            const token = (0, jwt_1.signAuthToken)({
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
            (0, vitest_1.expect)(response.statusCode).toBe(204);
            (0, vitest_1.expect)(client.userLastCommand.get("123456")).toBeTypeOf("number");
        }
        finally {
            await app.close();
            client.destroy();
        }
    });
    (0, vitest_1.it)("rejects requests without a valid token and does not record activity", async () => {
        const client = (0, client_1.setClient)();
        client.userLastCommand = new discord_js_1.Collection();
        const app = await (0, server_1.createApiServer)();
        try {
            for (const authorization of [undefined, "Bearer invalid.token"]) {
                const response = await app.inject({
                    method: "POST",
                    url: "/presence/heartbeat",
                    headers: authorization ? { authorization } : {},
                });
                (0, vitest_1.expect)(response.statusCode).toBe(401);
            }
            (0, vitest_1.expect)(client.userLastCommand.size).toBe(0);
        }
        finally {
            await app.close();
            client.destroy();
        }
    });
});
//# sourceMappingURL=ApiServer.test.js.map