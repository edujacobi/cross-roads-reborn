import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Language } from "#core/models/Language";
import { TimedAction } from "#core/models/TimedAction";
import { LocationList } from "#core/types/Locations";
import { logger } from "#shared/log";
import { getSseUser, isSseResponseOpen, openSseResponse, waitForActionResult } from "#api/sse/shared";

export function registerRobStatusRoute(app: FastifyInstance): void {
	app.get("/sse/rob-status", handleRobStatus);
}

async function handleRobStatus(req: FastifyRequest, reply: FastifyReply): Promise<void> {
	const user = await getSseUser(req, reply);
	if (!user) return;

	const sendEvent = openSseResponse(req, reply);
	try {
		const status = await waitForActionResult(reply, user.Id, "robbery", sendEvent);
		if (!status?.result) return;

		const result = TimedAction.DecodeRobberyResult(status.result);
		const location = LocationList[status.referenceId];
		let prisonText = "";
		if (!result.success) {
			const prisonTexts = location.Prison.Text;
			const randomIndex = Math.floor(Math.random() * prisonTexts.length);
			prisonText = prisonTexts[randomIndex][Language.Portuguese];
		}

		sendEvent({
			type: "rob-ended",
			success: result.success,
			moneyRobbed: result.moneyRobbed,
			wantedTime: result.attackerWantedTime?.toISOString() ?? null,
			prisonTime: result.attackerPrisonTime?.toISOString() ?? null,
			prisonText,
		});
	}
	catch (error) {
		logger.error("Failed to read location robbery result:", error);
		if (isSseResponseOpen(reply)) sendEvent({ type: "closed" });
	}
	finally {
		if (!reply.raw.writableEnded) reply.raw.end();
	}
}
