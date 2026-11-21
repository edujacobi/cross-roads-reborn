"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerEscapeStatusRoute = registerEscapeStatusRoute;
const User_1 = require("#core/models/User");
const Language_1 = require("#core/models/Language");
const Prison_1 = require("#core/models/Prison");
const shared_1 = require("#api/sse/shared");
const log_1 = require("#shared/log");
const promises_1 = require("node:timers/promises");
const ESCAPE_SSE_TIMEOUT_MS = 90_000;
function registerEscapeStatusRoute(app) {
    app.get("/sse/escape-status", handleEscapeStatus);
}
async function handleEscapeStatus(req, reply) {
    const userModel = await (0, shared_1.getSseUser)(req, reply);
    if (!userModel)
        return;
    const sendEvent = (0, shared_1.openSseResponse)(req, reply);
    if (!userModel.IsEscaping()) {
        sendEvent(userModel.Escape.HasTried
            ? createEscapeEndedEvent(userModel)
            : {
                type: "not-escaping",
                isInPrison: userModel.IsInPrison(),
                isWanted: !userModel.IsInPrison(),
                escapeHasTried: false,
            });
        reply.raw.end();
        return;
    }
    sendEvent({
        type: "escaping",
        escapeTime: userModel.Escape.Time.toISOString(),
    });
    const timeout = setTimeout(() => {
        if (!(0, shared_1.isSseResponseOpen)(reply))
            return;
        sendEvent({ type: "closed" });
        reply.raw.end();
    }, ESCAPE_SSE_TIMEOUT_MS);
    timeout.unref();
    try {
        while ((0, shared_1.isSseResponseOpen)(reply)) {
            await (0, promises_1.setTimeout)(shared_1.SSE_POLL_INTERVAL_MS);
            if (!(0, shared_1.isSseResponseOpen)(reply))
                return;
            const freshUser = new User_1.User(userModel.Id);
            const freshFound = await freshUser.GetInfo();
            if (!(0, shared_1.isSseResponseOpen)(reply))
                return;
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
        log_1.Log.Error(`Failed to poll escape for user ${userModel.Id}: ${err}`);
        if ((0, shared_1.isSseResponseOpen)(reply))
            sendEvent({ type: "closed" });
    }
    finally {
        clearTimeout(timeout);
        if (!reply.raw.writableEnded)
            reply.raw.end();
    }
}
function createEscapeEndedEvent(user, previousPrisonTime) {
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
        message: new Prison_1.Prison(user).generateEscapeMessage(success, extraPrisonMinutes, Language_1.Language.Portuguese),
        prisonTime: isInPrison ? user.Prison.Time.toISOString() : null,
        wantedTime: success && user.IsWanted() ? user.Wanted.Time.toISOString() : null,
    };
}
//# sourceMappingURL=escapeStatus.js.map