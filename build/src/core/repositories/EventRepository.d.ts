import { Events } from "#core/database/Events";
import { type InferAttributes, type InferCreationAttributes, type Optional } from "sequelize";
import type { NullishPropertiesOf } from "sequelize/lib/utils";
export declare class EventRepository {
    static Create(values: Optional<InferCreationAttributes<Events>, NullishPropertiesOf<InferCreationAttributes<Events>>>): Promise<Events>;
    static Destroy(id: number): Promise<number>;
    static Update(id: number, values: Partial<InferAttributes<Events>>): Promise<[number]>;
    static FindActiveEvent(type: number, date: Date): Promise<Events | null>;
    static FindById(id: number): Promise<Events | null>;
    static FindAll(): Promise<Events[]>;
    static FindUpcomingEvents(date: Date): Promise<Events[]>;
}
