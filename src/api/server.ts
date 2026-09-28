import fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import { createSchema, createYoga } from "graphql-yoga";
import { typeDefs } from "#api/graphql/schema";
import { resolvers } from "#api/graphql/resolvers";
import { verifyAuthToken } from "#api/auth/jwt";
import { buildDiscordAuthUrl, handleDiscordCallback, getFrontendUrl } from "#api/auth/discord";
import type { GraphQLContext } from "#api/types";
import { logger } from "#shared/log";

let server: FastifyInstance | null = null;

export async function createApiServer(): Promise<FastifyInstance> {
	const app = fastify({
		logger: false,
	});

	// CORS configuration
	await app.register(cors, {
		origin: (origin, cb) => {
			// Allow requests from localhost, frontend URL, or no origin (e.g. mobile/curl)
			const allowedOrigins = [
				getFrontendUrl(),
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

	type ServerContext = {
		req: FastifyRequest;
		reply: FastifyReply;
	};

	// GraphQL Yoga setup
	const yoga = createYoga<ServerContext, GraphQLContext>({
		schema: createSchema<ServerContext & GraphQLContext>({
			typeDefs,
			resolvers,
		}),
		context: async ({ req }): Promise<GraphQLContext> => {
			const authHeader = req.headers.authorization;
			if (authHeader && authHeader.startsWith("Bearer ")) {
				const token = authHeader.substring(7);
				const user = verifyAuthToken(token);
				return { user };
			}
			return { user: null };
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
		const authUrl = buildDiscordAuthUrl();
		return reply.redirect(authUrl);
	});

	// Auth: Discord Callback
	app.get(
		"/auth/discord/callback",
		async (req: FastifyRequest<{ Querystring: { code?: string; error?: string } }>, reply) => {
			const frontendUrl = getFrontendUrl();
			const { code, error } = req.query;

			if (error || !code) {
				logger.warn(`Discord OAuth error: ${error || "No code provided"}`);
				return reply.redirect(`${frontendUrl}/login?error=${encodeURIComponent(error || "No code provided")}`);
			}

			const result = await handleDiscordCallback(code);

			if ("error" in result) {
				return reply.redirect(`${frontendUrl}/login?error=${encodeURIComponent(result.error)}`);
			}

			return reply.redirect(`${frontendUrl}/auth/callback?token=${result.token}`);
		},
	);

	// Auth: Check Me
	app.get("/auth/me", async (req, reply) => {
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return reply.status(401).send({ error: "Missing or invalid authorization header." });
		}

		const token = authHeader.substring(7);
		const user = verifyAuthToken(token);

		if (!user) {
			return reply.status(401).send({ error: "Invalid or expired token." });
		}

		return reply.send({ user });
	});

	// Health Check
	app.get("/health", async () => {
		return { status: "ok", timestamp: new Date().toISOString() };
	});

	return app;
}

export async function startApiServer(port?: number): Promise<FastifyInstance> {
	const chosenPort = port || Number(process.env.API_PORT) || 3_001;
	const app = await createApiServer();

	try {
		await app.listen({ port: chosenPort, host: "0.0.0.0" });
		logger.info(`Admin GraphQL API Server running at http://localhost:${chosenPort}/graphql`);
		server = app;
		return app;
	}
	catch (err) {
		logger.error("Failed to start Admin API Server:", err);
		throw err;
	}
}

export async function stopApiServer(): Promise<void> {
	if (server) {
		await server.close();
		server = null;
		logger.info("Admin API Server stopped.");
	}
}
