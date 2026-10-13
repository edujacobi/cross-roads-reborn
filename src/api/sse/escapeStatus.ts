import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { User } from "#core/models/User";
import { getSseUser, openSseResponse } from "#api/sse/shared";

const ESCAPE_SSE_TIMEOUT_MS = 90_000;

export function registerEscapeStatusRoute(app: FastifyInstance): void {
	app.get("/sse/escape-status", handleEscapeStatus);
}

async function handleEscapeStatus(req: FastifyRequest, reply: FastifyReply): Promise<void> {
	const userModel = await getSseUser(req, reply);
	if (!userModel) return;

	const sendEvent = openSseResponse(req, reply);
	if (!userModel.IsEscaping()) {
		sendEvent({
			type: "not-escaping",
			isInPrison: userModel.IsInPrison(),
			escapeHasTried: userModel.Escape.HasTried,
		});
		reply.raw.end();
		return;
	}

	sendEvent({
		type: "escaping",
		escapeTime: userModel.Escape.Time.toISOString(),
	});

	const pollInterval = setInterval(async () => {
		const freshUser = new User(userModel.Id);
		const freshFound = await freshUser.GetInfo();
		if (!freshFound) {
			clearInterval(pollInterval);
			sendEvent({ type: "closed" });
			reply.raw.end();
			return;
		}

		if (!freshUser.IsEscaping()) {
			clearInterval(pollInterval);
			const success = !freshUser.IsInPrison();
			sendEvent({
				type: "escape-ended",
				isInPrison: freshUser.IsInPrison(),
				isWanted: success,
			});
			reply.raw.end();
		}
	}, 500);

	const timeout = setTimeout(() => {
		clearInterval(pollInterval);
		sendEvent({ type: "closed" });
		reply.raw.end();
	}, ESCAPE_SSE_TIMEOUT_MS);
	timeout.unref();

	req.raw.on("close", () => {
		clearInterval(pollInterval);
		clearTimeout(timeout);
	});
}
