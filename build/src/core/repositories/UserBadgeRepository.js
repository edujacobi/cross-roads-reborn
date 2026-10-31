"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserBadgeRepository = void 0;
const UserBadges_1 = require("#core/database/UserBadges");
class UserBadgeRepository {
    static async FindOne(userId, badgeId) {
        return await UserBadges_1.UserBadges.findOne({
            where: { userId, badgeId },
        });
    }
    static async FindAllByUserId(userId) {
        return await UserBadges_1.UserBadges.findAll({
            where: { userId },
            order: [["badgeId", "ASC"]],
        });
    }
    static async Create(values) {
        return await UserBadges_1.UserBadges.create(values);
    }
    static async Destroy(userId, badgeId) {
        return await UserBadges_1.UserBadges.destroy({
            where: { userId, badgeId },
        });
    }
    static async DestroyAll() {
        return await UserBadges_1.UserBadges.destroy({
            where: {},
        });
    }
}
exports.UserBadgeRepository = UserBadgeRepository;
//# sourceMappingURL=UserBadgeRepository.js.map