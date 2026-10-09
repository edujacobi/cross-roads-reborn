export type UserRole = "DEVELOPER" | "MODERATOR" | "HELPER" | "PLAYER";

export interface AuthUser {
	userId: string;
	username: string;
	avatar: string | null;
	avatarDecoration?: string;
	role: UserRole;
	situationId: number;
	gangId?: number;
}

export interface GraphQLContext {
	user: AuthUser | null;
	auditRequestInfo?: {
		ipAddress: string | null;
		userAgent: string | null;
	};
}
