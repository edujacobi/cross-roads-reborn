import type { User } from "./User";
import { BadgeId } from "#core/types/Badges";
import { Language } from "./Language";
export declare class UserBadge {
    UserId: string;
    BadgeId: BadgeId;
    Name: string;
    Description: string;
    Emoji: string;
    static Create(userId: string, badgeId: BadgeId): Promise<boolean>;
    static Delete(userId: string, badgeId: BadgeId): Promise<boolean>;
    static GetList(userId: string, language?: Language): Promise<UserBadge[]>;
    static AddVIPBadgeInList(badgeList: UserBadge[], user: User, language?: Language): UserBadge[];
    /**
     * Checks if a user has the Moderator badge
     * @param userId User Id to check
     * @returns Promise<boolean> True if the user has the moderator badge
     */
    static IsModerator(userId: string): Promise<boolean>;
    /**
     * Checks if a user has the Developer badge
     * @param userId User Id to check
     * @returns Promise<boolean> True if the user has the developer badge
     */
    static IsDeveloper(userId: string): Promise<boolean>;
    /**
     * Checks if a user has the Helper badge
     * @param userId User Id to check
     * @returns Promise<boolean> True if the user has the helper badge
     */
    static IsHelper(userId: string): Promise<boolean>;
}
