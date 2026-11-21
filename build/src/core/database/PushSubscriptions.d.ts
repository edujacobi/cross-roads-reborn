import { type ForeignKey, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
import type { Users } from "./Users";
export declare class PushSubscriptions extends Model<InferAttributes<PushSubscriptions>, InferCreationAttributes<PushSubscriptions>> {
    endpoint: string;
    userId: ForeignKey<Users["id"]>;
    p256dh: string;
    auth: string;
}
