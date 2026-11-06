"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushSubscriptionRepository = void 0;
const PushSubscriptions_1 = require("#core/database/PushSubscriptions");
class PushSubscriptionRepository {
    static async Upsert(endpoint, userId, p256dh, auth) {
        await PushSubscriptions_1.PushSubscriptions.upsert({ endpoint, userId, p256dh, auth });
    }
    static async FindByUserId(userId) {
        return await PushSubscriptions_1.PushSubscriptions.findAll({ where: { userId } });
    }
    static async DeleteByEndpoint(endpoint, userId) {
        return await PushSubscriptions_1.PushSubscriptions.destroy({ where: userId ? { endpoint, userId } : { endpoint } });
    }
}
exports.PushSubscriptionRepository = PushSubscriptionRepository;
//# sourceMappingURL=PushSubscriptionRepository.js.map