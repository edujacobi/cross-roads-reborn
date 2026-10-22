import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Language } from "#core/models/Language";
import { TimedAction } from "#core/models/TimedAction";
import { ScavengeList } from "#core/types/Scavenge";
import { logger } from "#shared/log";
import { getSseUser, isSseResponseOpen, openSseResponse, waitForActionResult } from "#api/sse/shared";

export function registerScavengeStatusRoute(app: FastifyInstance): void {
	app.get("/sse/scavenge-status", handleScavengeStatus);
}

async function handleScavengeStatus(req: FastifyRequest, reply: FastifyReply): Promise<void> {
	const user = await getSseUser(req, reply);
	if (!user) return;

	const sendEvent = openSseResponse(req, reply);
	try {
		const status = await waitForActionResult(reply, user.Id, "scavenge", sendEvent);
		if (!status?.result) return;

		const result = TimedAction.DecodeScavengeResult(status.result);
		const place = ScavengeList[status.referenceId];
		let failureReason = "";
		if (!result.success) {
			if (result.hospitalized) failureReason = place.Hospital.Text[Language.Portuguese];
			else if (result.inprisoned) failureReason = place.Prison.Text[Language.Portuguese];
		}

		sendEvent({
			type: "scavenge-ended",
			success: result.success,
			rewardDescription: result.rewardDescription ?? "",
			itemId: result.item?.Id ?? null,
			quantity: result.quantity ?? null,
			duration: result.duration ?? null,
			cooldownEndsAt: result.cooldownEndsAt?.toISOString() ?? null,
			hospitalized: result.hospitalized ?? false,
			hospitalTime: result.hospitalTime?.toISOString() ?? null,
			inprisoned: result.inprisoned ?? false,
			prisonTime: result.prisonTime?.toISOString() ?? null,
			failureReason,
		});
	}
	catch (error) {
		logger.error("Failed to read scavenge result:", error);
		if (isSseResponseOpen(reply)) sendEvent({ type: "closed" });
	}
	finally {
		if (!reply.raw.writableEnded) reply.raw.end();
	}
}
