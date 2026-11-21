"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRobStatusRoute = registerRobStatusRoute;
const Language_1 = require("#core/models/Language");
const TimedAction_1 = require("#core/models/TimedAction");
const Locations_1 = require("#core/types/Locations");
const log_1 = require("#shared/log");
const shared_1 = require("#api/sse/shared");
function registerRobStatusRoute(app) {
    app.get("/sse/rob-status", handleRobStatus);
}
async function handleRobStatus(req, reply) {
    const user = await (0, shared_1.getSseUser)(req, reply);
    if (!user)
        return;
    const sendEvent = (0, shared_1.openSseResponse)(req, reply);
    try {
        const status = await (0, shared_1.waitForActionResult)(reply, user.Id, "robbery", sendEvent);
        if (!status?.result)
            return;
        const result = TimedAction_1.TimedAction.DecodeRobberyResult(status.result);
        const location = Locations_1.LocationList[status.referenceId];
        let prisonText = "";
        if (!result.success) {
            const prisonTexts = location.Prison.Text;
            const randomIndex = Math.floor(Math.random() * prisonTexts.length);
            prisonText = prisonTexts[randomIndex][Language_1.Language.Portuguese];
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
        log_1.logger.error("Failed to read location robbery result:", error);
        if ((0, shared_1.isSseResponseOpen)(reply))
            sendEvent({ type: "closed" });
    }
    finally {
        if (!reply.raw.writableEnded)
            reply.raw.end();
    }
}
//# sourceMappingURL=robStatus.js.map