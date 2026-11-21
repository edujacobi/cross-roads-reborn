import { type CreationOptional, type ForeignKey, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
import type { NotificationType } from "#core/models/Notification";
import type { Users } from "./Users";
export declare class Notifications extends Model<InferAttributes<Notifications>, InferCreationAttributes<Notifications>> {
    id: CreationOptional<number>;
    userId: ForeignKey<Users["id"]>;
    type: NotificationType;
    date: Date;
    notified: CreationOptional<boolean>;
}
