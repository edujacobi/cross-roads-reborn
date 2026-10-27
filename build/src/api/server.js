"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiServer = createApiServer;
exports.startApiServer = startApiServer;
exports.stopApiServer = stopApiServer;
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const graphql_yoga_1 = require("graphql-yoga");
const schema_1 = require("#api/graphql/schema");
const index_1 = require("#api/graphql/resolvers/index");
const jwt_1 = require("#api/auth/jwt");
const discord_1 = require("#api/auth/discord");
const log_1 = require("#shared/log");
const User_1 = require("#core/models/User");
const Language_1 = require("#core/models/Language");
const WebPush_1 = require("#core/models/WebPush");
const escapeStatus_1 = require("#api/sse/escapeStatus");
const scavengeStatus_1 = require("#api/sse/scavengeStatus");
const robStatus_1 = require("#api/sse/robStatus");
const multiplayerSessions_1 = require("#api/sse/multiplayerSessions");
const client_1 = require("#bot/client");
let server = null;
async function createApiServer() {
    const app = (0, fastify_1.default)({
        logger: false,
        trustProxy: "loopback",
        forceCloseConnections: true,
    });
    // CORS configuration
    await app.register(cors_1.default, {
        origin: (origin, cb) => {
            // Allow requests from localhost, frontend URL, or no origin (e.g. mobile/curl)
            const allowedOrigins = [
                (0, discord_1.getFrontendUrl)(),
                "http://localhost:3000",
                "http://127.0.0.1:3000",
            ];
            if (!origin || allowedOrigins.includes(origin)) {
                cb(null, true);
                return;
            }
            cb(null, true); // Permissive in dev, can restrict in prod
        },
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    });
    // Allow multipart for GraphQL Yoga uploads
    app.addContentTypeParser("multipart/form-data", {}, (_req, _payload, done) => done(null));
    // GraphQL Yoga setup
    const yoga = (0, graphql_yoga_1.createYoga)({
        schema: (0, graphql_yoga_1.createSchema)({
            typeDefs: schema_1.typeDefs,
            resolvers: index_1.resolvers,
        }),
        context: async ({ req }) => {
            const authHeader = req.headers.authorization;
            const userAgentHeader = req.headers["user-agent"];
            const auditRequestInfo = {
                ipAddress: req.ip || null,
                userAgent: typeof userAgentHeader === "string" ? userAgentHeader : null,
            };
            if (authHeader && authHeader.startsWith("Bearer ")) {
                const token = authHeader.substring(7);
                const user = (0, jwt_1.verifyAuthToken)(token);
                return { user, auditRequestInfo };
            }
            return { user: null, auditRequestInfo };
        },
        graphqlEndpoint: "/graphql",
    });
    // Yoga Route
    app.route({
        url: yoga.graphqlEndpoint,
        method: ["GET", "POST", "OPTIONS"],
        handler: (req, reply) => yoga.handleNodeRequestAndResponse(req, reply, { req, reply }),
    });
    // Auth: Redirect to Discord OAuth
    app.get("/auth/discord/login", async (_req, reply) => {
        const authUrl = (0, discord_1.buildDiscordAuthUrl)();
        return reply.redirect(authUrl);
    });
    // Auth: Discord Callback
    app.get("/auth/discord/callback", async (req, reply) => {
        const frontendUrl = (0, discord_1.getFrontendUrl)();
        const { code, error } = req.query;
        if (error || !code) {
            log_1.logger.warn(`Discord OAuth error: ${error || "No code provided"}`);
            return reply.redirect(`${frontendUrl}/login?error=${encodeURIComponent(error || "No code provided")}`);
        }
        const result = await (0, discord_1.handleDiscordCallback)(code);
        if ("error" in result) {
            return reply.redirect(`${frontendUrl}/login?error=${encodeURIComponent(result.error)}`);
        }
        return reply.redirect(`${frontendUrl}/auth/callback?token=${result.token}`);
    });
    // Auth: Check Me
    app.get("/auth/me", async (req, reply) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return reply.status(401).send({ error: "Missing or invalid authorization header." });
        }
        const token = authHeader.substring(7);
        const user = (0, jwt_1.verifyAuthToken)(token);
        if (!user) {
            return reply.status(401).send({ error: "Invalid or expired token." });
        }
        const userModel = await new User_1.User(user.userId).GetSimpleInfo();
        if (userModel) {
            await userModel.GetSituation();
        }
        const avatarDecoration = userModel?.AvatarDecoration.Description[Language_1.Language.English]
            .toLowerCase()
            .replaceAll(" ", "_") ?? "default";
        return reply.send({
            user: {
                ...user,
                avatarDecoration,
                situationId: userModel?.Situation.Id ?? 0,
                gangId: userModel?.GangId,
                class: userModel?.Class ?? 0,
                isVip: userModel?.IsVip() ?? false,
            },
        });
    });
    app.post("/presence/heartbeat", async (req, reply) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return reply.status(401).send({ error: "Missing or invalid authorization header." });
        }
        const user = (0, jwt_1.verifyAuthToken)(authHeader.substring(7));
        if (!user) {
            return reply.status(401).send({ error: "Invalid or expired token." });
        }
        (0, client_1.getClient)().userLastCommand.set(user.userId, Date.now());
        return reply.status(204).send();
    });
    app.get("/push/public-key", async () => ({ publicKey: WebPush_1.WebPush.PublicKey }));
    app.post("/push/subscribe", async (req, reply) => {
        const user = (0, jwt_1.verifyAuthToken)(req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.substring(7) : "");
        if (!user) {
            return reply.status(401).send({ error: "Invalid or expired token." });
        }
        if (!WebPush_1.WebPush.IsValidSubscription(req.body)) {
            return reply.status(400).send({ error: "Invalid push subscription." });
        }
        await WebPush_1.WebPush.Subscribe(user.userId, req.body);
        return reply.status(204).send();
    });
    app.post("/push/unsubscribe", async (req, reply) => {
        const user = (0, jwt_1.verifyAuthToken)(req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.substring(7) : "");
        if (!user) {
            return reply.status(401).send({ error: "Invalid or expired token." });
        }
        if (typeof req.body?.endpoint !== "string") {
            return reply.status(400).send({ error: "Missing endpoint." });
        }
        await WebPush_1.WebPush.Unsubscribe(user.userId, req.body.endpoint);
        return reply.status(204).send();
    });
    (0, escapeStatus_1.registerEscapeStatusRoute)(app);
    (0, scavengeStatus_1.registerScavengeStatusRoute)(app);
    (0, robStatus_1.registerRobStatusRoute)(app);
    (0, multiplayerSessions_1.registerMultiplayerSessionsRoute)(app);
    // Health Check
    app.get("/health", async () => {
        return { status: "ok", timestamp: new Date().toISOString() };
    });
    return app;
}
async function startApiServer(port) {
    const chosenPort = port || Number(process.env.API_PORT) || 3_001;
    const app = await createApiServer();
    try {
        await app.listen({ port: chosenPort, host: "0.0.0.0" });
        log_1.logger.info(`Admin GraphQL API Server running at http://localhost:${chosenPort}/graphql`);
        server = app;
        return app;
    }
    catch (err) {
        log_1.logger.error("Failed to start Admin API Server:", err);
        throw err;
    }
}
async function stopApiServer() {
    if (server) {
        await server.close();
        server = null;
        log_1.logger.info("Admin API Server stopped.");
    }
}
//# sourceMappingURL=server.js.map