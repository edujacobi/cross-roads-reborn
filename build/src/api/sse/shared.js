"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSE_POLL_INTERVAL_MS = void 0;
exports.isSseResponseOpen = isSseResponseOpen;
exports.waitForActionResult = waitForActionResult;
exports.getSseUser = getSseUser;
exports.openSseResponse = openSseResponse;
const jwt_1 = require("#api/auth/jwt");
const User_1 = require("#core/models/User");
const TimedAction_1 = require("#core/models/TimedAction");
const promises_1 = require("node:timers/promises");
exports.SSE_POLL_INTERVAL_MS = 500;
const ACTION_RESULT_TIMEOUT_MS = 120_000;
function isSseResponseOpen(reply) {
    return !reply.raw.destroyed && !reply.raw.writableEnded;
}
// SSE only observes saved results. Closing a connection must not stop the action.
async function waitForActionResult(reply, userId, kind, sendEvent) {
    const initialAttempt = await TimedAction_1.TimedAction.GetStatus(userId, kind);
    if (!initialAttempt) {
        sendEvent({ type: kind === "scavenge" ? "not-scavenging" : "not-robbing" });
        return null;
    }
    const deadline = Date.now() + ACTION_RESULT_TIMEOUT_MS;
    let currentAttempt = initialAttempt;
    while (isSseResponseOpen(reply)) {
        // Do not report a newer action's result to a subscriber waiting for this one.
        if (!currentAttempt || currentAttempt.id !== initialAttempt.id) {
            sendEvent({ type: "closed" });
            return null;
        }
        if (currentAttempt.result !== null)
            return currentAttempt;
        if (Date.now() >= deadline) {
            sendEvent({ type: "closed" });
            return null;
        }
        await (0, promises_1.setTimeout)(exports.SSE_POLL_INTERVAL_MS);
        currentAttempt = await TimedAction_1.TimedAction.GetStatus(userId, kind);
    }
    return null;
}
async function getSseUser(req, reply) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        reply.status(401).send({ error: "Missing or invalid authorization header." });
        return null;
    }
    const user = (0, jwt_1.verifyAuthToken)(authHeader.substring(7));
    if (!user) {
        reply.status(401).send({ error: "Invalid or expired token." });
        return null;
    }
    const userModel = new User_1.User(user.userId);
    if (!(await userModel.GetInfo())) {
        reply.status(404).send({ error: "User not found." });
        return null;
    }
    return userModel;
}
function openSseResponse(req, reply) {
    const origin = req.headers.origin || "http://localhost:3000";
    reply.hijack();
    reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-store",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    reply.raw.flushHeaders();
    return event => {
        // Each event is one JSON data line, terminated by a blank line.
        reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
    };
}
//# sourceMappingURL=shared.js.map