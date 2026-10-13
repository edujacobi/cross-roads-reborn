import fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import { createSchema, createYoga } from "graphql-yoga";
import { typeDefs } from "#api/graphql/schema";
import { resolvers } from "#api/graphql/resolvers/index";
import { verifyAuthToken } from "#api/auth/jwt";
import { buildDiscordAuthUrl, handleDiscordCallback, getFrontendUrl } from "#api/auth/discord";
import type { GraphQLContext } from "#api/types";
import { logger } from "#shared/log";
import { User } from "#core/models/User";
import { Language } from "#core/models/Language";
import { Scavenge } from "#core/models/Scavenge";
import { ScavengeList } from "#core/types/Scavenge";

let server: FastifyInstance | null = null;
// ponytail: in-memory deduplication assumes one API process; use shared job storage if horizontally scaled.
const activeScavengeFlows = new Map<string, Promise<Awaited<ReturnType<Scavenge["EndScavenge"]>> | null>>();

export async function createApiServer(): Promise<FastifyInstance> {
	const app = fastify({
		logger: false,
		trustProxy: "loopback",
		forceCloseConnections: true,
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
			const userAgentHeader = req.headers["user-agent"];
			const auditRequestInfo = {
				ipAddress: req.ip || null,
				userAgent: typeof userAgentHeader === "string" ? userAgentHeader : null,
			};
			if (authHeader && authHeader.startsWith("Bearer ")) {
				const token = authHeader.substring(7);
				const user = verifyAuthToken(token);
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

		const userModel = await new User(user.userId).GetSimpleInfo();
		if (userModel) {
			await userModel.GetSituation();
		}
		const avatarDecoration = userModel?.AvatarDecoration.Description[Language.English]
			.toLowerCase()
			.replaceAll(" ", "_") ?? "default";

		return reply.send({
			user: {
				...user,
				avatarDecoration,
				situationId: userModel?.Situation.Id ?? 0,
				gangId: userModel?.GangId,
				class: userModel?.Class ?? 0,
			},
		});
	});

	// SSE: Prison Escape Status
	app.get("/sse/escape-status", async (req: FastifyRequest, reply: FastifyReply) => {
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return reply.status(401).send({ error: "Missing or invalid authorization header." });
		}

		const token = authHeader.substring(7);
		const user = verifyAuthToken(token);
		if (!user) {
			return reply.status(401).send({ error: "Invalid or expired token." });
		}

		const userModel = new User(user.userId);
		const found = await userModel.GetInfo();
		if (!found) {
			return reply.status(404).send({ error: "User not found." });
		}

		// Set SSE headers with CORS
		const origin = req.headers.origin || "http://localhost:3000";
		reply.raw.writeHead(200, {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
			"X-Accel-Buffering": "no",
			"Access-Control-Allow-Origin": origin,
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		});

		const sendEvent = (data: string) => {
			reply.raw.write(`data: ${data}\n\n`);
		};

		if (userModel.IsEscaping()) {
			sendEvent(JSON.stringify({
				type: "escaping",
				escapeTime: userModel.Escape.Time.toISOString(),
			}));

			// Wait for escape to end by polling
			const pollInterval = setInterval(async () => {
				const freshUser = new User(user.userId);
				const freshFound = await freshUser.GetInfo();
				if (!freshFound) {
					clearInterval(pollInterval);
					sendEvent(JSON.stringify({ type: "closed" }));
					reply.raw.end();
					return;
				}

				if (!freshUser.IsEscaping()) {
					clearInterval(pollInterval);
					const success = !freshUser.IsInPrison();
					sendEvent(JSON.stringify({
						type: "escape-ended",
						isInPrison: freshUser.IsInPrison(),
						isWanted: success,
					}));
					reply.raw.end();
				}
			}, 500);

			// Timeout bound: 2× default escape duration (40s) + 10s safety margin
			const ESCAPE_SSE_TIMEOUT_MS = 90_000;
			const timeout = setTimeout(() => {
				clearInterval(pollInterval);
				sendEvent(JSON.stringify({ type: "closed" }));
				reply.raw.end();
			}, ESCAPE_SSE_TIMEOUT_MS);
			timeout.unref();

			// Cleanup on client disconnect
			req.raw.on("close", () => {
				clearInterval(pollInterval);
				clearTimeout(timeout);
			});
		}
		else {
			// Not escaping, send current status and close
			sendEvent(JSON.stringify({
				type: "not-escaping",
				isInPrison: userModel.IsInPrison(),
				escapeHasTried: userModel.Escape.HasTried,
			}));
			reply.raw.end();
		}
	});

	// SSE: Scavenge Status
	app.get("/sse/scavenge-status", async (req: FastifyRequest, reply: FastifyReply) => {
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return reply.status(401).send({ error: "Missing or invalid authorization header." });
		}

		const token = authHeader.substring(7);
		const user = verifyAuthToken(token);
		if (!user) {
			return reply.status(401).send({ error: "Invalid or expired token." });
		}

		const userModel = new User(user.userId);
		const found = await userModel.GetInfo();
		if (!found) {
			return reply.status(404).send({ error: "User not found." });
		}

		// Set SSE headers with CORS
		const origin = req.headers.origin || "http://localhost:3000";
		reply.raw.writeHead(200, {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
			"X-Accel-Buffering": "no",
			"Access-Control-Allow-Origin": origin,
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
		});

		const sendEvent = (data: string) => {
			reply.raw.write(`data: ${data}\n\n`);
		};

		if (userModel.IsScavenging()) {
			const scavengingId = userModel.Scavenge.IsScavengingId!;
			const placeName = ScavengeList[scavengingId]?.Description[Language.Portuguese] || "Local desconhecido";
			sendEvent(JSON.stringify({
				type: "scavenging",
				scavengingId,
				placeName,
			}));

			// Calculate wait time same as bot command: 10s + 2s per placeId
			const waitMs = 10_000 + (2_000 * scavengingId);

			let flow = activeScavengeFlows.get(user.userId);
			if (!flow) {
				flow = (async () => {
					const activeUser = new User(user.userId);
					if (!(await activeUser.GetInfo()) || activeUser.Scavenge.IsScavengingId !== scavengingId) {
						return null;
					}

					const scavenge = new Scavenge(activeUser, scavengingId);
					await scavenge.StartScavenge();
					await new Promise(resolve => setTimeout(resolve, waitMs));
					return await scavenge.EndScavenge();
				})();
				activeScavengeFlows.set(user.userId, flow);

				const clearFlow = () => {
					if (activeScavengeFlows.get(user.userId) === flow) {
						activeScavengeFlows.delete(user.userId);
					}
				};
				void flow.then(clearFlow, clearFlow);
			}

			// Timeout: 120s (scavenge wait is 10-26s, plus safety margin)
			const SCAVENGE_SSE_TIMEOUT_MS = 120_000;
			const timeout = setTimeout(() => {
				if (!reply.raw.destroyed && !reply.raw.writableEnded) {
					sendEvent(JSON.stringify({ type: "closed" }));
					reply.raw.end();
				}
			}, SCAVENGE_SSE_TIMEOUT_MS);
			timeout.unref();

			// Disconnecting a client must not cancel the backend-owned scavenge.
			reply.raw.on("close", () => {
				clearTimeout(timeout);
			});

			try {
				const result = await flow;
				clearTimeout(timeout);

				if (reply.raw.destroyed || reply.raw.writableEnded) return;
				if (!result?.completed) {
					sendEvent(JSON.stringify({ type: "closed" }));
					reply.raw.end();
					return;
				}

				let failureReason = "";
				if (!result.success) {
					const place = ScavengeList[scavengingId];
					if (result.hospitalized) {
						failureReason = place.Hospital.Text[Language.Portuguese];
					}
					else if (result.inprisoned) {
						failureReason = place.Prison.Text[Language.Portuguese];
					}
				}

				sendEvent(JSON.stringify({
					type: "scavenge-ended",
					success: result.success,
					rewardDescription: result.rewardDescription || "",
					hospitalized: result.hospitalized || false,
					hospitalTime: result.hospitalTime ? result.hospitalTime.toISOString() : null,
					inprisoned: result.inprisoned || false,
					prisonTime: result.prisonTime ? result.prisonTime.toISOString() : null,
					failureReason,
				}));
				reply.raw.end();
			}
			catch (error) {
				clearTimeout(timeout);
				logger.error("Failed to complete scavenge SSE flow:", error);
				if (!reply.raw.destroyed && !reply.raw.writableEnded) {
					sendEvent(JSON.stringify({ type: "closed" }));
					reply.raw.end();
				}
			}
		}
		else {
			// Not scavenging, send current status and close
			sendEvent(JSON.stringify({
				type: "not-scavenging",
			}));
			reply.raw.end();
		}
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
