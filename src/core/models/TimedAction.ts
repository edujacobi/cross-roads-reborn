import { TimedActionRepository, type TimedActionKind } from "#core/repositories/TimedActionRepository";
import { Log } from "#shared/log";
import { Scavenge } from "./Scavenge";
import { User } from "./User";
import { LocationRobberyStrategy } from "./strategies/robbery/LocationRobberyStrategy";

let timer: NodeJS.Timeout | undefined;
let processing = false;

export class TimedAction {
	static async Initialize() {
		if (timer) return;
		await TimedActionRepository.AdoptLegacyActions();
		timer = setInterval(() => TimedAction.ProcessPending(), 1_000);
		timer.unref();
		await TimedAction.ProcessPending();
	}

	static Stop() {
		clearInterval(timer);
		timer = undefined;
	}

	static async ProcessPending() {
		if (processing) return;
		processing = true;
		try {
			for (const action of await TimedActionRepository.FindDue()) {
				try {
					if (await TimedActionRepository.DiscardCancelled(action.id)) continue;
					const user = await new User(action.userId).GetInfo();
					if (!user) throw new Error(`User ${action.userId} was not found.`);
					if (action.kind === "scavenge") {
						const scavenge = new Scavenge(user, action.referenceId, action.id);
						await scavenge.StartScavenge();
						await scavenge.EndScavenge();
					}
					else {
						await new LocationRobberyStrategy(user, action.referenceId, action.id).Resolve();
					}
				}
				catch (error) {
					Log.Error(`Failed to resolve ${action.kind} for user ${action.userId}; will retry: ${error}`);
				}
			}
		}
		catch (error) {
			Log.Error(`Failed to recover pending actions: ${error}`);
		}
		finally {
			processing = false;
		}
	}

	static async GetStatus(userId: string, kind: TimedActionKind) {
		const action = await TimedActionRepository.Get(userId, kind);
		if (!action) return null;
		return {
			id: action.id,
			referenceId: action.referenceId,
			dueAt: action.dueAt,
			result: action.result,
		};
	}

	static DecodeScavengeResult(json: string) {
		return TimedActionRepository.Decode<Awaited<ReturnType<Scavenge["EndScavenge"]>>>(json);
	}

	static DecodeRobberyResult(json: string) {
		return TimedActionRepository.Decode<Awaited<ReturnType<LocationRobberyStrategy["Resolve"]>>>(json);
	}
}
