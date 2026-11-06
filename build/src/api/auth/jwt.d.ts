import type { AuthUser } from "#api/types";
export declare function signAuthToken(payload: AuthUser): string;
export declare function verifyAuthToken(token: string): AuthUser | null;
