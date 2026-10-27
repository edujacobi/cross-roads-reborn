"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAvatarDecorationRepository = void 0;
const UserAvatarDecorations_1 = require("#core/database/UserAvatarDecorations");
class UserAvatarDecorationRepository {
    static async FindOne(userId, avatarDecorationId) {
        return await UserAvatarDecorations_1.UserAvatarDecorations.findOne({
            where: { userId, avatarDecorationId },
        });
    }
    static async FindAllByUserId(userId) {
        return await UserAvatarDecorations_1.UserAvatarDecorations.findAll({
            where: { userId },
            order: [["avatarDecorationId", "ASC"]],
        });
    }
    static async Create(values) {
        return await UserAvatarDecorations_1.UserAvatarDecorations.create(values);
    }
    static async Destroy(userId, avatarDecorationId) {
        return await UserAvatarDecorations_1.UserAvatarDecorations.destroy({
            where: { userId, avatarDecorationId },
        });
    }
    static async DestroyAll() {
        return await UserAvatarDecorations_1.UserAvatarDecorations.destroy({
            where: {},
        });
    }
}
exports.UserAvatarDecorationRepository = UserAvatarDecorationRepository;
//# sourceMappingURL=UserAvatarDecorationRepository.js.map