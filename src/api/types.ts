export type UserRole = "DEVELOPER" | "MODERATOR";

export interface AuthUser {
	userId: string;
	username: string;
	avatar: string | null;
	role: UserRole;
}

export interface GraphQLContext {
	user: AuthUser | null;
}
