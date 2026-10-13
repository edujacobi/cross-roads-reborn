import type { FastifyReply, FastifyRequest } from "fastify";
import { verifyAuthToken } from "#api/auth/jwt";
import { User } from "#core/models/User";

export async function getSseUser(req: FastifyRequest, reply: FastifyReply): Promise<User | null> {
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		reply.status(401).send({ error: "Missing or invalid authorization header." });
		return null;
	}

	const user = verifyAuthToken(authHeader.substring(7));
	if (!user) {
		reply.status(401).send({ error: "Invalid or expired token." });
		return null;
	}

	const userModel = new User(user.userId);
	if (!(await userModel.GetInfo())) {
		reply.status(404).send({ error: "User not found." });
		return null;
	}

	return userModel;
}

export function openSseResponse(
	req: FastifyRequest,
	reply: FastifyReply,
): (event: object) => void {
	const origin = req.headers.origin || "http://localhost:3000";
	reply.raw.writeHead(200, {
		"Content-Type": "text/event-stream",
		"Cache-Control": "no-cache",
		Connection: "keep-alive",
		"X-Accel-Buffering": "no",
		"Access-Control-Allow-Origin": origin,
		"Access-Control-Allow-Headers": "Content-Type, Authorization",
	});

	return event => {
		reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
	};
}
