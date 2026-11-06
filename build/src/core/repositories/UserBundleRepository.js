"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserBundleRepository = void 0;
const UserBundles_1 = require("#core/database/UserBundles");
class UserBundleRepository {
    static async FindOne(userId, bundleId) {
        return await UserBundles_1.UserBundles.findOne({
            where: { userId, bundleId },
        });
    }
    static async FindAllByUserId(userId) {
        return await UserBundles_1.UserBundles.findAll({
            where: { userId },
            order: [["bundleId", "ASC"]],
        });
    }
    static async Create(values) {
        return await UserBundles_1.UserBundles.create(values);
    }
    static async Destroy(userId, bundleId) {
        return await UserBundles_1.UserBundles.destroy({
            where: { userId, bundleId },
        });
    }
    static async DestroyAll() {
        return await UserBundles_1.UserBundles.destroy({
            where: {},
        });
    }
}
exports.UserBundleRepository = UserBundleRepository;
//# sourceMappingURL=UserBundleRepository.js.map