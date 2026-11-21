import { Model, type InferAttributes, type InferCreationAttributes } from "sequelize";
export declare class TimedActions extends Model<InferAttributes<TimedActions>, InferCreationAttributes<TimedActions>> {
    id: string;
    userId: string;
    kind: "scavenge" | "robbery";
    referenceId: number;
    dueAt: Date;
    result: string | null;
}
