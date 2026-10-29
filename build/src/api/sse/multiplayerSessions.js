"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMultiplayerSessionsRoute = registerMultiplayerSessionsRoute;
const MultiplayerSession_1 = require("#core/models/MultiplayerSession");
const log_1 = require("#shared/log");
const shared_1 = require("#api/sse/shared");
function registerMultiplayerSessionsRoute(app) {
    app.get("/sse/multiplayer-sessions", handleMultiplayerSessions);
}
async function handleMultiplayerSessions(req, reply) {
    const user = await (0, shared_1.getSseUser)(req, reply);
    if (!user)
        return;
    const sendEvent = (0, shared_1.openSseResponse)(req, reply);
    let closed = false;
    let unsubscribe = null;
    const close = () => {
        if (closed)
            return;
        closed = true;
        unsubscribe?.();
    };
    const visibleSessionIds = new Set();
    unsubscribe = MultiplayerSession_1.MultiplayerSession.Subscribe(user.Id, user.GangId, session => {
        try {
            if ((0, shared_1.isSseResponseOpen)(reply))
                sendEvent({ type: "session-updated", session });
        }
        catch (error) {
            log_1.logger.warn(`Failed to stream multiplayer session ${session.id} to user ${user.Id}: ${error}`);
            close();
        }
    }, sessionId => {
        try {
            if ((0, shared_1.isSseResponseOpen)(reply))
                sendEvent({ type: "session-removed", sessionId });
        }
        catch (error) {
            log_1.logger.warn(`Failed to stream multiplayer session removal ${sessionId} to user ${user.Id}: ${error}`);
            close();
        }
    }, visibleSessionIds);
    const heartbeat = setInterval(() => {
        if (!(0, shared_1.isSseResponseOpen)(reply)) {
            close();
            return;
        }
        try {
            reply.raw.write(": keep-alive\n\n");
        }
        catch (error) {
            log_1.logger.warn(`Failed to keep multiplayer SSE open for user ${user.Id}: ${error}`);
            close();
        }
    }, 15_000);
    heartbeat.unref();
    try {
        for (const session of MultiplayerSession_1.MultiplayerSession.GetVisibleSessions(user.Id, user.GangId)) {
            visibleSessionIds.add(session.id);
            sendEvent({ type: "session-updated", session });
        }
        await new Promise(resolve => {
            reply.raw.once("close", resolve);
            reply.raw.once("error", resolve);
        });
    }
    catch (error) {
        log_1.logger.error(`Failed to stream multiplayer sessions for user ${user.Id}: ${error}`);
        if ((0, shared_1.isSseResponseOpen)(reply))
            sendEvent({ type: "closed" });
    }
    finally {
        clearInterval(heartbeat);
        close();
        if ((0, shared_1.isSseResponseOpen)(reply))
            reply.raw.end();
    }
}
//# sourceMappingURL=multiplayerSessions.js.map