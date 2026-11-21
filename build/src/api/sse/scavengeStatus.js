"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerScavengeStatusRoute = registerScavengeStatusRoute;
const Language_1 = require("#core/models/Language");
const TimedAction_1 = require("#core/models/TimedAction");
const Scavenge_1 = require("#core/types/Scavenge");
const log_1 = require("#shared/log");
const shared_1 = require("#api/sse/shared");
function registerScavengeStatusRoute(app) {
    app.get("/sse/scavenge-status", handleScavengeStatus);
}
async function handleScavengeStatus(req, reply) {
    const user = await (0, shared_1.getSseUser)(req, reply);
    if (!user)
        return;
    const sendEvent = (0, shared_1.openSseResponse)(req, reply);
    try {
        const status = await (0, shared_1.waitForActionResult)(reply, user.Id, "scavenge", sendEvent);
        if (!status?.result)
            return;
        const result = TimedAction_1.TimedAction.DecodeScavengeResult(status.result);
        const place = Scavenge_1.ScavengeList[status.referenceId];
        let failureReason = "";
        if (!result.success) {
            if (result.hospitalized)
                failureReason = place.Hospital.Text[Language_1.Language.Portuguese];
            else if (result.inprisoned)
                failureReason = place.Prison.Text[Language_1.Language.Portuguese];
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
        log_1.logger.error("Failed to read scavenge result:", error);
        if ((0, shared_1.isSseResponseOpen)(reply))
            sendEvent({ type: "closed" });
    }
    finally {
        if (!reply.raw.writableEnded)
            reply.raw.end();
    }
}
//# sourceMappingURL=scavengeStatus.js.map