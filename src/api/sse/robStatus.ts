import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { Language } from "#core/models/Language";
import { LocationRobberyStrategy } from "#core/models/strategies/robbery/LocationRobberyStrategy";
import { User } from "#core/models/User";
import { LocationList } from "#core/types/Locations";
import { logger } from "#shared/log";
import { getSseUser, openSseResponse } from "#api/sse/shared";

const ROB_SSE_TIMEOUT_MS = 120_000;
// ponytail: in-memory deduplication assumes one API process; use shared job storage if horizontally scaled.
const activeRobberyFlows = new Map<string, Promise<Awaited<ReturnType<LocationRobberyStrategy["Resolve"]>> | null>>();

export function registerRobStatusRoute(app: FastifyInstance): void {
	app.get("/sse/rob-status", handleRobStatus);
}

async function handleRobStatus(req: FastifyRequest, reply: FastifyReply): Promise<void> {
	const user = await getSseUser(req, reply);
	if (!user) return;

	const sendEvent = openSseResponse(req, reply);
	const locationId = user.Robbery.IsRobbingLocationId;
	if (locationId === null) {
		sendEvent({ type: "not-robbing" });
		reply.raw.end();
		return;
	}

	const flow = getRobberyFlow(user.Id, locationId);
	const timeout = setTimeout(() => {
		if (!reply.raw.destroyed && !reply.raw.writableEnded) {
			sendEvent({ type: "closed" });
			reply.raw.end();
		}
	}, ROB_SSE_TIMEOUT_MS);
	timeout.unref();
	reply.raw.on("close", () => clearTimeout(timeout));

	try {
		const result = await flow;
		clearTimeout(timeout);
		if (reply.raw.destroyed || reply.raw.writableEnded) return;
		if (!result) {
			sendEvent({ type: "closed" });
			reply.raw.end();
			return;
		}

		const location = LocationList[locationId];
		const prisonText = result.success
			? ""
			: location.Prison.Text[Math.floor(Math.random() * location.Prison.Text.length)][Language.Portuguese];
		sendEvent({
			type: "rob-ended",
			success: result.success,
			moneyRobbed: result.moneyRobbed,
			wantedTime: result.attackerWantedTime?.toISOString() ?? null,
			prisonTime: result.attackerPrisonTime?.toISOString() ?? null,
			prisonText,
		});
		reply.raw.end();
	}
	catch (error) {
		clearTimeout(timeout);
		logger.error("Failed to complete location robbery SSE flow:", error);
		if (!reply.raw.destroyed && !reply.raw.writableEnded) {
			sendEvent({ type: "closed" });
			reply.raw.end();
		}
	}
}

function getRobberyFlow(
	userId: string,
	locationId: number,
): Promise<Awaited<ReturnType<LocationRobberyStrategy["Resolve"]>> | null> {
	let flow = activeRobberyFlows.get(userId);
	if (!flow) {
		flow = (async () => {
			const activeUser = new User(userId);
			if (!(await activeUser.GetInfo()) || activeUser.Robbery.IsRobbingLocationId !== locationId) {
				return null;
			}

			const robbery = new LocationRobberyStrategy(activeUser, locationId);
			try {
				await new Promise(resolve => setTimeout(resolve, 10_000 + (5_000 * locationId)));
				return await robbery.Resolve();
			}
			finally {
				await robbery.ReleaseLocks();
			}
		})();
		activeRobberyFlows.set(userId, flow);
		const clearFlow = () => {
			if (activeRobberyFlows.get(userId) === flow) {
				activeRobberyFlows.delete(userId);
			}
		};
		void flow.then(clearFlow, clearFlow);
	}

	return flow;
}
