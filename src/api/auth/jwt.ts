import jwt from "jsonwebtoken";
import type { AuthUser } from "#api/types";
import { logger } from "#shared/log";

const JWT_SECRET = process.env.JWT_SECRET || "cr-reborn-admin-secret-key-2026";
const TOKEN_EXPIRY = "7d";

export function signAuthToken(payload: AuthUser): string {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyAuthToken(token: string): AuthUser | null {
	try {
		return jwt.verify(token, JWT_SECRET) as AuthUser;
	}
	catch (err) {
		logger.debug("Failed to verify JWT auth token", err);
		return null;
	}
}
