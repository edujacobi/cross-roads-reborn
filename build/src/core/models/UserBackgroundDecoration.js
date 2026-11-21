"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserBackgroundDecoration = void 0;
const log_1 = require("#shared/log");
const Language_1 = require("./Language");
const Ids_1 = require("#core/types/Ids");
const UserBackgroundDecorationRepository_1 = require("#core/repositories/UserBackgroundDecorationRepository");
const BackgroundDecorations_1 = require("#core/types/BackgroundDecorations");
class UserBackgroundDecoration {
    UserId = "";
    BackgroundDecorationId = Ids_1.BackgroundDecorationId.Default;
    Description = "";
    // Create a new background for a user
    static async Create(userId, backgroundDecorationId) {
        if (!userId || backgroundDecorationId === undefined) {
            log_1.Log.Warning(`Cannot create background without userId and backgroundDecorationId.`);
            return false;
        }
        try {
            // Check if background already exists for this user
            const existingDecoration = await UserBackgroundDecorationRepository_1.UserBackgroundDecorationRepository.FindOne(userId, backgroundDecorationId);
            if (existingDecoration) {
                log_1.Log.Warning(`Background decoration ${backgroundDecorationId} already exists for user ${userId}.`);
                return false;
            }
            await UserBackgroundDecorationRepository_1.UserBackgroundDecorationRepository.Create({
                userId,
                backgroundDecorationId,
            });
            log_1.Log.Success(`Background decoration ${backgroundDecorationId} created for ${userId}.`);
            return true;
        }
        catch (err) {
            log_1.Log.Warning(`Something went wrong adding background decoration ${backgroundDecorationId} for ${userId}. Error ${err}`);
            return false;
        }
    }
    static async HasBackgroundDecoration(userId, backgroundDecorationId) {
        if (!userId || backgroundDecorationId === null) {
            log_1.Log.Warning(`Cannot check if user has background decoration without userId and backgroundDecorationId.`);
            return false;
        }
        try {
            const existingDecoration = await UserBackgroundDecorationRepository_1.UserBackgroundDecorationRepository.FindOne(userId, backgroundDecorationId);
            return !!existingDecoration;
        }
        catch (err) {
            log_1.Log.Warning(`Something went wrong checking if user has background decoration ${backgroundDecorationId} for ${userId}. Error ${err}`);
            return false;
        }
    }
    // Delete a user's background
    static async Delete(userId, backgroundDecorationId) {
        try {
            const deleted = await UserBackgroundDecorationRepository_1.UserBackgroundDecorationRepository.Destroy(userId, backgroundDecorationId);
            if (deleted) {
                log_1.Log.Success(`Background decoration ${backgroundDecorationId} removed for ${userId}.`);
                return true;
            }
            else {
                log_1.Log.Warning(`Background decoration ${backgroundDecorationId} not found for user ${userId}.`);
                return false;
            }
        }
        catch (err) {
            log_1.Log.Warning(`Something went wrong removing background decoration ${backgroundDecorationId} for ${userId}. Error ${err}`);
            return false;
        }
    }
    // Get list of backgrounds for a user
    static async GetList(user, language = Language_1.Language.English) {
        const userBackgroundDecorations = await UserBackgroundDecorationRepository_1.UserBackgroundDecorationRepository.FindAllByUserId(user.Id);
        const decorationIds = [Ids_1.BackgroundDecorationId.Default];
        for (const decoration of userBackgroundDecorations) {
            if (BackgroundDecorations_1.BackgroundDecorationList[decoration.backgroundDecorationId] && !decorationIds.includes(decoration.backgroundDecorationId)) {
                decorationIds.push(decoration.backgroundDecorationId);
            }
        }
        return decorationIds.map(decorationId => {
            const decorationData = BackgroundDecorations_1.BackgroundDecorationList[decorationId];
            const bg = new UserBackgroundDecoration();
            bg.UserId = user.Id;
            bg.BackgroundDecorationId = decorationId;
            bg.Description = decorationData.Description[language];
            return bg;
        });
    }
}
exports.UserBackgroundDecoration = UserBackgroundDecoration;
//# sourceMappingURL=UserBackgroundDecoration.js.map