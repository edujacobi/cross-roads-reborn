"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserBundle = void 0;
const log_1 = require("#shared/log");
const Language_1 = require("./Language");
const Ids_1 = require("#core/types/Ids");
const UserBundleRepository_1 = require("#core/repositories/UserBundleRepository");
const Skins_1 = require("#core/types/Skins");
const Items_1 = require("#core/types/Items");
class UserBundle {
    UserId = "";
    BundleId = Ids_1.BundleId.Default;
    Description = "";
    Items = [];
    // Create a new bundle for a user
    static async Create(userId, bundleId) {
        if (!userId || !bundleId) {
            log_1.Log.Warning(`Cannot create bundle without userId and bundleId.`);
            return false;
        }
        try {
            // Check if bundle already exists for this user
            const existingBundle = await UserBundleRepository_1.UserBundleRepository.FindOne(userId, bundleId);
            if (existingBundle) {
                log_1.Log.Warning(`Bundle ${bundleId} already exists for user ${userId}.`);
                return false;
            }
            await UserBundleRepository_1.UserBundleRepository.Create({
                userId,
                bundleId,
            });
            log_1.Log.Success(`Bundle ${bundleId} created for ${userId}.`);
            return true;
        }
        catch (err) {
            log_1.Log.Warning(`Something went wrong adding bundle ${bundleId} for ${userId}. Error ${err}`);
            return false;
        }
    }
    static async HasBundle(userId, bundleId) {
        if (!userId || bundleId === null) {
            log_1.Log.Warning(`Cannot check if user has bundle without userId and bundleId.`);
            return false;
        }
        try {
            const existingBundle = await UserBundleRepository_1.UserBundleRepository.FindOne(userId, bundleId);
            return !!existingBundle;
        }
        catch (err) {
            log_1.Log.Warning(`Something went wrong checking if user has bundle ${bundleId} for ${userId}. Error ${err}`);
        }
    }
    // Delete a user's bundle
    static async Delete(userId, bundleId) {
        try {
            const deleted = await UserBundleRepository_1.UserBundleRepository.Destroy(userId, bundleId);
            if (deleted) {
                log_1.Log.Success(`Bundle ${bundleId} removed for ${userId}.`);
                return true;
            }
            else {
                log_1.Log.Warning(`Bundle ${bundleId} not found for user ${userId}.`);
                return false;
            }
        }
        catch (err) {
            log_1.Log.Warning(`Something went wrong removing bundle ${bundleId} for ${userId}. Error ${err}\``);
            return false;
        }
    }
    // Get list of bundles for a user
    static async GetList(userId, language = Language_1.Language.English) {
        const userBundles = await UserBundleRepository_1.UserBundleRepository.FindAllByUserId(userId);
        const defaultBundle = Skins_1.BundleList[Ids_1.BundleId.Default];
        const defaultUserBundle = new UserBundle();
        defaultUserBundle.BundleId = defaultBundle.Id;
        defaultUserBundle.Description = defaultBundle.Description[language];
        defaultUserBundle.Items = defaultBundle.Items.map(item => Items_1.ItemList[item]);
        defaultUserBundle.UserId = userId;
        const bundleList = [defaultUserBundle];
        for (const userBundle of userBundles) {
            const bundleData = Skins_1.BundleList[userBundle.bundleId];
            if (bundleData) {
                const bundle = new UserBundle();
                bundle.UserId = userBundle.userId;
                bundle.BundleId = userBundle.bundleId;
                bundle.Description = bundleData.Description[language];
                bundle.Items = bundleData.Items.map(item => Items_1.ItemList[item]);
                bundleList.push(bundle);
            }
        }
        return bundleList;
    }
}
exports.UserBundle = UserBundle;
//# sourceMappingURL=UserBundle.js.map