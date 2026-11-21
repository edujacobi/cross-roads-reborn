"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimedAction = void 0;
const TimedActionRepository_1 = require("#core/repositories/TimedActionRepository");
const log_1 = require("#shared/log");
const Scavenge_1 = require("./Scavenge");
const User_1 = require("./User");
const LocationRobberyStrategy_1 = require("./strategies/robbery/LocationRobberyStrategy");
let timer;
let processing = false;
class TimedAction {
    static async Initialize() {
        if (timer)
            return;
        await TimedActionRepository_1.TimedActionRepository.AdoptLegacyActions();
        timer = setInterval(() => TimedAction.ProcessPending(), 1_000);
        timer.unref();
        await TimedAction.ProcessPending();
    }
    static Stop() {
        clearInterval(timer);
        timer = undefined;
    }
    static async ProcessPending() {
        if (processing)
            return;
        processing = true;
        try {
            for (const action of await TimedActionRepository_1.TimedActionRepository.FindDue()) {
                try {
                    if (await TimedActionRepository_1.TimedActionRepository.DiscardCancelled(action.id))
                        continue;
                    const user = await new User_1.User(action.userId).GetInfo();
                    if (!user)
                        throw new Error(`User ${action.userId} was not found.`);
                    if (action.kind === "scavenge") {
                        const scavenge = new Scavenge_1.Scavenge(user, action.referenceId, action.id);
                        await scavenge.StartScavenge();
                        await scavenge.EndScavenge();
                    }
                    else {
                        await new LocationRobberyStrategy_1.LocationRobberyStrategy(user, action.referenceId, action.id).Resolve();
                    }
                }
                catch (error) {
                    log_1.Log.Error(`Failed to resolve ${action.kind} for user ${action.userId}; will retry: ${error}`);
                }
            }
        }
        catch (error) {
            log_1.Log.Error(`Failed to recover pending actions: ${error}`);
        }
        finally {
            processing = false;
        }
    }
    static async GetStatus(userId, kind) {
        const action = await TimedActionRepository_1.TimedActionRepository.Get(userId, kind);
        if (!action)
            return null;
        return {
            id: action.id,
            referenceId: action.referenceId,
            dueAt: action.dueAt,
            result: action.result,
        };
    }
    static DecodeScavengeResult(json) {
        return TimedActionRepository_1.TimedActionRepository.Decode(json);
    }
    static DecodeRobberyResult(json) {
        return TimedActionRepository_1.TimedActionRepository.Decode(json);
    }
}
exports.TimedAction = TimedAction;
//# sourceMappingURL=TimedAction.js.map