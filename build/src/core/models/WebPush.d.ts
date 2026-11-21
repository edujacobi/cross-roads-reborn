export interface WebPushSubscriptionInput {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}
export interface WebPushAction {
    action: string;
    title: string;
}
export interface WebPushOptions {
    actions?: WebPushAction[];
    data?: {
        sessionId: string;
    };
    requireInteraction?: boolean;
    tag?: string;
    title?: string;
    urgency?: "very-low" | "low" | "normal" | "high";
    ttlSeconds?: number;
}
export declare class WebPush {
    static get PublicKey(): string;
    static IsValidSubscription(subscription: unknown): subscription is WebPushSubscriptionInput;
    static Subscribe(userId: string, subscription: WebPushSubscriptionInput): Promise<void>;
    static Unsubscribe(userId: string, endpoint: string): Promise<void>;
    /** Discord markdown/emotes do not render in native notifications, so they are stripped. */
    static ToPlainText(discordText: string): string;
    static Send(userId: string, body: string, options?: WebPushOptions): Promise<void>;
}
