import { PushSubscriptions } from "#core/database/PushSubscriptions";

export class PushSubscriptionRepository {
	static async Upsert(endpoint: string, userId: string, p256dh: string, auth: string): Promise<void> {
		await PushSubscriptions.upsert({ endpoint, userId, p256dh, auth });
	}

	static async FindByUserId(userId: string): Promise<PushSubscriptions[]> {
		return await PushSubscriptions.findAll({ where: { userId } });
	}

	static async DeleteByEndpoint(endpoint: string, userId?: string): Promise<number> {
		return await PushSubscriptions.destroy({ where: userId ? { endpoint, userId } : { endpoint } });
	}
}
