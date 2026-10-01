export type UserRole = "DEVELOPER" | "MODERATOR" | "HELPER";

export interface AuthUser {
	userId: string;
	username: string;
	avatar: string | null;
	avatarDecoration?: string;
	role: UserRole;
}

export interface GraphQLContext {
	user: AuthUser | null;
}
