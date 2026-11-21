"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAvatarDecoration = void 0;
const log_1 = require("#shared/log");
const Language_1 = require("./Language");
const Ids_1 = require("#core/types/Ids");
const UserAvatarDecorationRepository_1 = require("#core/repositories/UserAvatarDecorationRepository");
const AvatarDecorations_1 = require("#core/types/AvatarDecorations");
const UserBadge_1 = require("./UserBadge");
class UserAvatarDecoration {
    UserId = "";
    AvatarDecorationId = Ids_1.AvatarDecorationId.Default;
    Description = "";
    // Create a new bundle for a user
    static async Create(userId, avatarDecorationId) {
        if (!userId || !avatarDecorationId) {
            log_1.Log.Warning(`Cannot create bundle without userId and avatarDecorationId.`);
            return false;
        }
        try {
            // Check if bundle already exists for this user
            const existingDecoration = await UserAvatarDecorationRepository_1.UserAvatarDecorationRepository.FindOne(userId, avatarDecorationId);
            if (existingDecoration) {
                log_1.Log.Warning(`Avatar decoration ${avatarDecorationId} already exists for user ${userId}.`);
                return false;
            }
            await UserAvatarDecorationRepository_1.UserAvatarDecorationRepository.Create({
                userId,
                avatarDecorationId,
            });
            log_1.Log.Success(`Avatar decoration ${avatarDecorationId} created for ${userId}.`);
            return true;
        }
        catch (err) {
            log_1.Log.Warning(`Something went wrong adding avatar decoration ${avatarDecorationId} for ${userId}. Error ${err}`);
            return false;
        }
    }
    static async HasAvatarDecoration(userId, avatarDecorationId) {
        if (!userId || avatarDecorationId === null) {
            log_1.Log.Warning(`Cannot check if user has avatar decoration without userId and avatarDecorationId.`);
            return false;
        }
        try {
            const existingDecoration = await UserAvatarDecorationRepository_1.UserAvatarDecorationRepository.FindOne(userId, avatarDecorationId);
            return !!existingDecoration;
        }
        catch (err) {
            log_1.Log.Warning(`Something went wrong checking if user has avatar decoration ${avatarDecorationId} for ${userId}. Error ${err}`);
        }
    }
    // Delete a user's bundle
    static async Delete(userId, avatarDecorationId) {
        try {
            const deleted = await UserAvatarDecorationRepository_1.UserAvatarDecorationRepository.Destroy(userId, avatarDecorationId);
            if (deleted) {
                log_1.Log.Success(`Avatar decoration ${avatarDecorationId} removed for ${userId}.`);
                return true;
            }
            else {
                log_1.Log.Warning(`Avatar decoration ${avatarDecorationId} not found for user ${userId}.`);
                return false;
            }
        }
        catch (err) {
            log_1.Log.Warning(`Something went wrong removing avatar decoration ${avatarDecorationId} for ${userId}. Error ${err}\``);
            return false;
        }
    }
    // Get list of bundles for a user
    static async GetList(user, language = Language_1.Language.English) {
        const userAvatarDecorations = await UserAvatarDecorationRepository_1.UserAvatarDecorationRepository.FindAllByUserId(user.Id);
        const [isDeveloper, isModerator, isHelper] = await Promise.all([
            UserBadge_1.UserBadge.IsDeveloper(user.Id),
            UserBadge_1.UserBadge.IsModerator(user.Id),
            UserBadge_1.UserBadge.IsHelper(user.Id),
        ]);
        const decorationIds = [Ids_1.AvatarDecorationId.Default];
        if (user.IsVip()) {
            decorationIds.push(Ids_1.AvatarDecorationId.VIP);
        }
        if (isDeveloper) {
            decorationIds.push(Ids_1.AvatarDecorationId.Developer);
        }
        if (isModerator) {
            decorationIds.push(Ids_1.AvatarDecorationId.Moderator);
        }
        if (isHelper) {
            decorationIds.push(Ids_1.AvatarDecorationId.Helper);
        }
        for (const decoration of userAvatarDecorations) {
            // Only add if it's a valid decoration and not already in the list (e.g., default, developer, etc.)
            if (AvatarDecorations_1.AvatarDecorationList[decoration.avatarDecorationId] && !decorationIds.includes(decoration.avatarDecorationId)) {
                decorationIds.push(decoration.avatarDecorationId);
            }
        }
        return decorationIds.map(decorationId => {
            const decorationData = AvatarDecorations_1.AvatarDecorationList[decorationId];
            const decoration = new UserAvatarDecoration();
            decoration.UserId = user.Id;
            decoration.AvatarDecorationId = decorationId;
            decoration.Description = decorationData.Description[language];
            return decoration;
        });
    }
}
exports.UserAvatarDecoration = UserAvatarDecoration;
//# sourceMappingURL=UserAvatarDecoration.js.map