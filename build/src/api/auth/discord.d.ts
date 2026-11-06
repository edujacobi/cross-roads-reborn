import type { AuthUser } from "#api/types";
export interface DiscordOAuthUser {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    global_name: string | null;
}
export declare function getDiscordClientId(): string;
export declare function getDiscordClientSecret(): string;
export declare function getDiscordRedirectUri(): string;
export declare function getFrontendUrl(): string;
export declare function buildDiscordAuthUrl(): string;
export declare function handleDiscordCallback(code: string): Promise<{
    token: string;
    user: AuthUser;
} | {
    error: string;
    status: number;
}>;
