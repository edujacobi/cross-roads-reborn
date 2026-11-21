"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationRepository = void 0;
const Notifications_1 = require("#core/database/Notifications");
const sequelize_1 = require("sequelize");
const TimedActionRepository_1 = require("./TimedActionRepository");
class NotificationRepository {
    static async Create(values) {
        return await Notifications_1.Notifications.create(values, { transaction: TimedActionRepository_1.actionTransaction.getStore() });
    }
    static async CountUnsentBefore(time) {
        return await Notifications_1.Notifications.count({
            where: {
                date: {
                    [sequelize_1.Op.lt]: time,
                },
                notified: false,
            },
        });
    }
    static async FindUnsentBefore(time) {
        return await Notifications_1.Notifications.findAll({
            where: {
                date: {
                    [sequelize_1.Op.lt]: time,
                },
                notified: false,
            },
        });
    }
    static async MarkAsNotified(id) {
        return await Notifications_1.Notifications.update({ notified: true }, {
            where: { id },
        });
    }
    static async DeleteUnsentByUserIdAndType(userId, type) {
        return await Notifications_1.Notifications.destroy({
            transaction: TimedActionRepository_1.actionTransaction.getStore(),
            where: {
                userId,
                type,
                notified: false,
            },
        });
    }
    static async DeleteById(id) {
        return await Notifications_1.Notifications.destroy({
            where: { id },
        });
    }
}
exports.NotificationRepository = NotificationRepository;
//# sourceMappingURL=NotificationRepository.js.map