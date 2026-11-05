import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { User } from "#core/models/User";
import { Language } from "#core/models/Language";
import { Prison } from "#core/models/Prison";
import { getSseUser, isSseResponseOpen, openSseResponse, SSE_POLL_INTERVAL_MS } from "#api/sse/shared";
import { Log } from "#shared/log";
import { setTimeout as wait } from "node:timers/promises";

const ESCAPE_SSE_TIMEOUT_MS = 90_000;

export function registerEscapeStatusRoute(app: FastifyInstance): void {
	app.get("/sse/escape-status", handleEscapeStatus);
}

async function handleEscapeStatus(req: FastifyRequest, reply: FastifyReply): Promise<void> {
	const userModel = await getSseUser(req, reply);
	if (!userModel) return;

	const sendEvent = openSseResponse(req, reply);
	if (!userModel.IsEscaping()) {
		sendEvent(userModel.Escape.HasTried
			? createEscapeEndedEvent(userModel)
			: {
				type: "not-escaping",
				isInPrison: userModel.IsInPrison(),
				isWanted: !userModel.IsInPrison(),
				escapeHasTried: false,
			},
		);
		reply.raw.end();
		return;
	}

	sendEvent({
		type: "escaping",
		escapeTime: userModel.Escape.Time.toISOString(),
	});

	const timeout = setTimeout(() => {
		if (!isSseResponseOpen(reply)) return;
		sendEvent({ type: "closed" });
		reply.raw.end();
	}, ESCAPE_SSE_TIMEOUT_MS);
	timeout.unref();

	try {
		while (isSseResponseOpen(reply)) {
			await wait(SSE_POLL_INTERVAL_MS);
			if (!isSseResponseOpen(reply)) return;

			const freshUser = new User(userModel.Id);
			const freshFound = await freshUser.GetInfo();
			if (!isSseResponseOpen(reply)) return;
			if (!freshFound) {
				sendEvent({ type: "closed" });
				return;
			}

			if (!freshUser.IsEscaping()) {
				sendEvent(createEscapeEndedEvent(freshUser, userModel.Prison.Time));
				return;
			}
		}
	}
	catch (err) {
		Log.Error(`Failed to poll escape for user ${userModel.Id}: ${err}`);
		if (isSseResponseOpen(reply)) sendEvent({ type: "closed" });
	}
	finally {
		clearTimeout(timeout);
		if (!reply.raw.writableEnded) reply.raw.end();
	}
}

function createEscapeEndedEvent(user: User, previousPrisonTime?: Date) {
	const isInPrison = user.IsInPrison();
	const success = !isInPrison;
	const previousReleaseTime = previousPrisonTime?.getTime() ?? Date.now();
	const extraPrisonMinutes = isInPrison
		? Math.max(0, Math.ceil((user.Prison.Time.getTime() - Math.max(Date.now(), previousReleaseTime)) / 60_000))
		: 0;

	return {
		type: "escape-ended",
		isInPrison,
		isWanted: success,
		escapeHasTried: user.Escape.HasTried,
		message: new Prison(user).generateEscapeMessage(success, extraPrisonMinutes, Language.Portuguese),
		prisonTime: isInPrison ? user.Prison.Time.toISOString() : null,
		wantedTime: success && user.IsWanted() ? user.Wanted.Time.toISOString() : null,
	};
}
