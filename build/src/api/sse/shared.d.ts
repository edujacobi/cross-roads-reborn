import type { FastifyReply, FastifyRequest } from "fastify";
import { User } from "#core/models/User";
export declare const SSE_POLL_INTERVAL_MS = 500;
export declare function isSseResponseOpen(reply: FastifyReply): boolean;
export declare function waitForActionResult(reply: FastifyReply, userId: string, kind: "scavenge" | "robbery", sendEvent: (event: object) => void): Promise<{
    id: string;
    referenceId: number;
    dueAt: Date;
    result: string | null;
} | null>;
export declare function getSseUser(req: FastifyRequest, reply: FastifyReply): Promise<User | null>;
export declare function openSseResponse(req: FastifyRequest, reply: FastifyReply): (event: object) => void;
