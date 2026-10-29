import { type CreationOptional, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
import type { EventType } from "#core/models/Event";
export declare class Events extends Model<InferAttributes<Events>, InferCreationAttributes<Events>> {
    id: CreationOptional<number>;
    type: EventType;
    value: number;
    periodStart: Date;
    periodEnd: Date;
}
