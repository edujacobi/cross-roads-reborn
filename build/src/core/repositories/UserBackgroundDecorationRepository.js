"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserBackgroundDecorationRepository = void 0;
const UserBackgroundDecorations_1 = require("#core/database/UserBackgroundDecorations");
class UserBackgroundDecorationRepository {
    static async FindOne(userId, backgroundDecorationId) {
        return await UserBackgroundDecorations_1.UserBackgroundDecorations.findOne({
            where: { userId, backgroundDecorationId },
        });
    }
    static async FindAllByUserId(userId) {
        return await UserBackgroundDecorations_1.UserBackgroundDecorations.findAll({
            where: { userId },
            order: [["backgroundDecorationId", "ASC"]],
        });
    }
    static async Create(values) {
        return await UserBackgroundDecorations_1.UserBackgroundDecorations.create(values);
    }
    static async Destroy(userId, backgroundDecorationId) {
        return await UserBackgroundDecorations_1.UserBackgroundDecorations.destroy({
            where: { userId, backgroundDecorationId },
        });
    }
    static async DestroyAll() {
        return await UserBackgroundDecorations_1.UserBackgroundDecorations.destroy({
            where: {},
        });
    }
}
exports.UserBackgroundDecorationRepository = UserBackgroundDecorationRepository;
//# sourceMappingURL=UserBackgroundDecorationRepository.js.map