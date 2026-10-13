import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Language } from "#core/models/Language";
import { Scavenge } from "#core/models/Scavenge";
import { User } from "#core/models/User";
import { ScavengeList } from "#core/types/Scavenge";
import { logger } from "#shared/log";
import { getSseUser, openSseResponse } from "#api/sse/shared";

const SCAVENGE_SSE_TIMEOUT_MS = 120_000;
// ponytail: in-memory deduplication assumes one API process; use shared job storage if horizontally scaled.
const activeScavengeFlows = new Map<string, Promise<Awaited<ReturnType<Scavenge["EndScavenge"]>> | null>>();

export function registerScavengeStatusRoute(app: FastifyInstance): void {
	app.get("/sse/scavenge-status", handleScavengeStatus);
}

async function handleScavengeStatus(req: FastifyRequest, reply: FastifyReply): Promise<void> {
	const userModel = await getSseUser(req, reply);
	if (!userModel) return;

	const sendEvent = openSseResponse(req, reply);
	if (!userModel.IsScavenging()) {
		sendEvent({ type: "not-scavenging" });
		reply.raw.end();
		return;
	}

	const scavengingId = userModel.Scavenge.IsScavengingId!;
	const placeName = ScavengeList[scavengingId]?.Description[Language.Portuguese] || "Local desconhecido";
	sendEvent({
		type: "scavenging",
		scavengingId,
		placeName,
	});

	const waitMs = 10_000 + (2_000 * scavengingId);
	const flow = getScavengeFlow(userModel.Id, scavengingId, waitMs);

	const timeout = setTimeout(() => {
		if (!reply.raw.destroyed && !reply.raw.writableEnded) {
			sendEvent({ type: "closed" });
			reply.raw.end();
		}
	}, SCAVENGE_SSE_TIMEOUT_MS);
	timeout.unref();

	reply.raw.on("close", () => {
		clearTimeout(timeout);
	});

	try {
		const result = await flow;
		clearTimeout(timeout);

		if (reply.raw.destroyed || reply.raw.writableEnded) return;
		if (!result?.completed) {
			sendEvent({ type: "closed" });
			reply.raw.end();
			return;
		}

		sendScavengeResult(sendEvent, result, scavengingId);
		reply.raw.end();
	}
	catch (error) {
		clearTimeout(timeout);
		logger.error("Failed to complete scavenge SSE flow:", error);
		if (!reply.raw.destroyed && !reply.raw.writableEnded) {
			sendEvent({ type: "closed" });
			reply.raw.end();
		}
	}
}

function getScavengeFlow(
	userId: string,
	scavengingId: number,
	waitMs: number,
): Promise<Awaited<ReturnType<Scavenge["EndScavenge"]>> | null> {
	let flow = activeScavengeFlows.get(userId);
	if (!flow) {
		flow = (async () => {
			const activeUser = new User(userId);
			if (!(await activeUser.GetInfo()) || activeUser.Scavenge.IsScavengingId !== scavengingId) {
				return null;
			}

			const scavenge = new Scavenge(activeUser, scavengingId);
			await scavenge.StartScavenge();
			await new Promise(resolve => setTimeout(resolve, waitMs));
			return await scavenge.EndScavenge();
		})();
		activeScavengeFlows.set(userId, flow);

		const clearFlow = () => {
			if (activeScavengeFlows.get(userId) === flow) {
				activeScavengeFlows.delete(userId);
			}
		};
		void flow.then(clearFlow, clearFlow);
	}

	return flow;
}

function sendScavengeResult(
	sendEvent: (event: object) => void,
	result: Awaited<ReturnType<Scavenge["EndScavenge"]>>,
	scavengingId: number,
): void {
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

	sendEvent({
		type: "scavenge-ended",
		success: result.success,
		rewardDescription: result.rewardDescription || "",
		itemId: result.item?.Id ?? null,
		quantity: result.quantity ?? null,
		duration: result.duration ?? null,
		cooldownEndsAt: result.cooldownEndsAt?.toISOString() ?? null,
		hospitalized: result.hospitalized || false,
		hospitalTime: result.hospitalTime ? result.hospitalTime.toISOString() : null,
		inprisoned: result.inprisoned || false,
		prisonTime: result.prisonTime ? result.prisonTime.toISOString() : null,
		failureReason,
	});
}
