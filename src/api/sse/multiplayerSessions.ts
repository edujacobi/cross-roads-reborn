import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { MultiplayerSession } from "#core/models/MultiplayerSession";
import { logger } from "#shared/log";
import { getSseUser, isSseResponseOpen, openSseResponse } from "#api/sse/shared";

export function registerMultiplayerSessionsRoute(app: FastifyInstance): void {
	app.get("/sse/multiplayer-sessions", handleMultiplayerSessions);
}

async function handleMultiplayerSessions(req: FastifyRequest, reply: FastifyReply): Promise<void> {
	const user = await getSseUser(req, reply);
	if (!user) return;

	const sendEvent = openSseResponse(req, reply);
	let closed = false;
	let unsubscribe: (() => void) | null = null;
	const close = () => {
		if (closed) return;
		closed = true;
		unsubscribe?.();
	};
	const visibleSessionIds = new Set<string>();
	unsubscribe = MultiplayerSession.Subscribe(user.Id, user.GangId, session => {
		try {
			if (isSseResponseOpen(reply)) sendEvent({ type: "session-updated", session });
		}
		catch (error) {
			logger.warn(`Failed to stream multiplayer session ${session.id} to user ${user.Id}: ${error}`);
			close();
		}
	}, sessionId => {
		try {
			if (isSseResponseOpen(reply)) sendEvent({ type: "session-removed", sessionId });
		}
		catch (error) {
			logger.warn(`Failed to stream multiplayer session removal ${sessionId} to user ${user.Id}: ${error}`);
			close();
		}
	}, visibleSessionIds);
	const heartbeat = setInterval(() => {
		if (!isSseResponseOpen(reply)) {
			close();
			return;
		}
		try {
			reply.raw.write(": keep-alive\n\n");
		}
		catch (error) {
			logger.warn(`Failed to keep multiplayer SSE open for user ${user.Id}: ${error}`);
			close();
		}
	}, 15_000);
	heartbeat.unref();

	try {
		for (const session of MultiplayerSession.GetVisibleSessions(user.Id, user.GangId)) {
			visibleSessionIds.add(session.id);
			sendEvent({ type: "session-updated", session });
		}
		await new Promise<void>(resolve => {
			reply.raw.once("close", resolve);
			reply.raw.once("error", resolve);
		});
	}
	catch (error) {
		logger.error(`Failed to stream multiplayer sessions for user ${user.Id}: ${error}`);
		if (isSseResponseOpen(reply)) sendEvent({ type: "closed" });
	}
	finally {
		clearInterval(heartbeat);
		close();
		if (isSseResponseOpen(reply)) reply.raw.end();
	}
}
