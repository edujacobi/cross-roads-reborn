import { Notifications } from "#core/database/Notifications";
import type { InferCreationAttributes, Optional } from "sequelize";
import type { NullishPropertiesOf } from "sequelize/lib/utils";
export declare class NotificationRepository {
    static Create(values: Optional<InferCreationAttributes<Notifications>, NullishPropertiesOf<InferCreationAttributes<Notifications>>>): Promise<Notifications>;
    static CountUnsentBefore(time: Date): Promise<number>;
    static FindUnsentBefore(time: Date): Promise<Notifications[]>;
    static MarkAsNotified(id: number | number[]): Promise<[number]>;
    static DeleteUnsentByUserIdAndType(userId: string, type: number): Promise<number>;
    static DeleteById(id: number): Promise<number>;
}
