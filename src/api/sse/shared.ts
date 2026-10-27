import type { FastifyReply, FastifyRequest } from "fastify";
import { verifyAuthToken } from "#api/auth/jwt";
import { User } from "#core/models/User";
import { TimedAction } from "#core/models/TimedAction";
import { setTimeout as wait } from "node:timers/promises";

export const SSE_POLL_INTERVAL_MS = 500;
const ACTION_RESULT_TIMEOUT_MS = 120_000;

export function isSseResponseOpen(reply: FastifyReply): boolean {
	return !reply.raw.destroyed && !reply.raw.writableEnded;
}

// SSE only observes saved results. Closing a connection must not stop the action.
export async function waitForActionResult(
	reply: FastifyReply,
	userId: string,
	kind: "scavenge" | "robbery",
	sendEvent: (event: object) => void,
) {
	const initialAttempt = await TimedAction.GetStatus(userId, kind);
	if (!initialAttempt) {
		sendEvent({ type: kind === "scavenge" ? "not-scavenging" : "not-robbing" });
		return null;
	}
	const deadline = Date.now() + ACTION_RESULT_TIMEOUT_MS;
	let currentAttempt: typeof initialAttempt | null = initialAttempt;

	while (isSseResponseOpen(reply)) {
		// Do not report a newer action's result to a subscriber waiting for this one.
		if (!currentAttempt || currentAttempt.id !== initialAttempt.id) {
			sendEvent({ type: "closed" });
			return null;
		}
		if (currentAttempt.result !== null) return currentAttempt;
		if (Date.now() >= deadline) {
			sendEvent({ type: "closed" });
			return null;
		}
		await wait(SSE_POLL_INTERVAL_MS);
		currentAttempt = await TimedAction.GetStatus(userId, kind);
	}
	return null;
}

export async function getSseUser(req: FastifyRequest, reply: FastifyReply): Promise<User | null> {
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		reply.status(401).send({ error: "Missing or invalid authorization header." });
		return null;
	}

	const user = verifyAuthToken(authHeader.substring(7));
	if (!user) {
		reply.status(401).send({ error: "Invalid or expired token." });
		return null;
	}

	const userModel = new User(user.userId);
	if (!(await userModel.GetInfo())) {
		reply.status(404).send({ error: "User not found." });
		return null;
	}

	return userModel;
}

export function openSseResponse(
	req: FastifyRequest,
	reply: FastifyReply,
): (event: object) => void {
	const origin = req.headers.origin || "http://localhost:3000";
	reply.hijack();
	reply.raw.writeHead(200, {
		"Content-Type": "text/event-stream",
		"Cache-Control": "no-store",
		Connection: "keep-alive",
		"X-Accel-Buffering": "no",
		"Access-Control-Allow-Origin": origin,
		"Access-Control-Allow-Headers": "Content-Type, Authorization",
	});
	reply.raw.flushHeaders();

	return event => {
		// Each event is one JSON data line, terminated by a blank line.
		reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
	};
}
