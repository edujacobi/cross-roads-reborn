"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserBadge = void 0;
const UserBadgeRepository_1 = require("#core/repositories/UserBadgeRepository");
const log_1 = require("#shared/log");
const Badges_1 = require("#core/types/Badges");
const Language_1 = require("./Language");
const discord_js_1 = require("discord.js");
class UserBadge {
    UserId = "";
    BadgeId = Badges_1.BadgeId.VIP;
    Name = "";
    Description = "";
    Emoji = "";
    // Create a new badge for a user
    static async Create(userId, badgeId) {
        if (!userId || !badgeId) {
            log_1.Log.Warning(`Cannot create badge without userId and badgeId.`);
            return false;
        }
        try {
            // Check if badge already exists for this user
            const existingBadge = await UserBadgeRepository_1.UserBadgeRepository.FindOne(userId, badgeId);
            if (existingBadge) {
                log_1.Log.Warning(`Badge ${badgeId} already exists for user ${userId}.`);
                return false;
            }
            await UserBadgeRepository_1.UserBadgeRepository.Create({
                userId,
                badgeId,
            });
            log_1.Log.Success(`Badge ${badgeId} created for ${userId}.`);
            return true;
        }
        catch (err) {
            log_1.Log.Warning(`Something went wrong adding badge ${badgeId} for ${userId}. Error ${err}`);
            return false;
        }
    }
    // Delete a user's badge
    static async Delete(userId, badgeId) {
        try {
            const deleted = await UserBadgeRepository_1.UserBadgeRepository.Destroy(userId, badgeId);
            if (deleted) {
                log_1.Log.Success(`Badge ${badgeId} removed for ${userId}.`);
                return true;
            }
            else {
                log_1.Log.Warning(`Badge ${badgeId} not found for user ${userId}.`);
                return false;
            }
        }
        catch (err) {
            log_1.Log.Warning(`Something went wrong removing badge ${badgeId} for ${userId}. Error ${err}\``);
            return false;
        }
    }
    // Get list of badges for a user
    static async GetList(userId, language = Language_1.Language.English) {
        const userBadges = await UserBadgeRepository_1.UserBadgeRepository.FindAllByUserId(userId);
        const badgeList = [];
        for (const userBadge of userBadges) {
            const badgeData = Badges_1.BadgeList[userBadge.badgeId];
            if (badgeData) {
                const badge = new UserBadge();
                badge.UserId = userBadge.userId;
                badge.BadgeId = userBadge.badgeId;
                badge.Name = badgeData.Name[language];
                badge.Description = badgeData.Description[language];
                badge.Emoji = badgeData.Emoji.String;
                badgeList.push(badge);
            }
        }
        return badgeList;
    }
    static AddVIPBadgeInList(badgeList, user, language = Language_1.Language.English) {
        const badgeId = user.VipEternal ? Badges_1.BadgeId.VIPEternal : Badges_1.BadgeId.VIP;
        const badgeData = Badges_1.BadgeList[badgeId];
        const b = new UserBadge();
        b.BadgeId = badgeId;
        b.Name = badgeData.Name[language];
        b.Description = badgeData.Description[language];
        b.Emoji = badgeData.Emoji.String;
        if (!user.VipEternal) {
            b.Description += `. ${(0, discord_js_1.time)(user.VipTime, discord_js_1.TimestampStyles.RelativeTime)}`;
        }
        badgeList.unshift(b);
        return badgeList;
    }
    /**
     * Checks if a user has the Moderator badge
     * @param userId User Id to check
     * @returns Promise<boolean> True if the user has the moderator badge
     */
    static async IsModerator(userId) {
        if (!userId) {
            log_1.Log.Warning("Cannot check moderator status without a userId");
            return false;
        }
        try {
            const badge = await UserBadgeRepository_1.UserBadgeRepository.FindOne(userId, Badges_1.BadgeId.Moderator);
            return !!badge; // Convert to boolean
        }
        catch (err) {
            log_1.Log.Warning(`Error checking moderator status for user ${userId}`);
            return false;
        }
    }
    /**
     * Checks if a user has the Developer badge
     * @param userId User Id to check
     * @returns Promise<boolean> True if the user has the developer badge
     */
    static async IsDeveloper(userId) {
        if (!userId) {
            log_1.Log.Warning("Cannot check developer status without a userId");
            return false;
        }
        try {
            const badge = await UserBadgeRepository_1.UserBadgeRepository.FindOne(userId, Badges_1.BadgeId.Developer);
            return !!badge; // Convert to boolean
        }
        catch (err) {
            log_1.Log.Warning(`Error checking developer status for user ${userId}`);
            return false;
        }
    }
    /**
     * Checks if a user has the Helper badge
     * @param userId User Id to check
     * @returns Promise<boolean> True if the user has the helper badge
     */
    static async IsHelper(userId) {
        if (!userId) {
            log_1.Log.Warning("Cannot check helper status without a userId");
            return false;
        }
        try {
            const badge = await UserBadgeRepository_1.UserBadgeRepository.FindOne(userId, Badges_1.BadgeId.Helper);
            return !!badge; // Convert to boolean
        }
        catch (err) {
            log_1.Log.Warning(`Error checking helper status for user ${userId}`);
            return false;
        }
    }
}
exports.UserBadge = UserBadge;
//# sourceMappingURL=UserBadge.js.map