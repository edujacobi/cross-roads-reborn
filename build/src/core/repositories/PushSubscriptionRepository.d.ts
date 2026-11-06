import { PushSubscriptions } from "#core/database/PushSubscriptions";
export declare class PushSubscriptionRepository {
    static Upsert(endpoint: string, userId: string, p256dh: string, auth: string): Promise<void>;
    static FindByUserId(userId: string): Promise<PushSubscriptions[]>;
    static DeleteByEndpoint(endpoint: string, userId?: string): Promise<number>;
}
