import { type CreationOptional, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
export declare class Seasons extends Model<InferAttributes<Seasons>, InferCreationAttributes<Seasons>> {
    id: CreationOptional<number>;
    number: number;
    startDate: Date;
    endDate: Date;
    topData: CreationOptional<string>;
    howManyPlayers: CreationOptional<number>;
    createdAt: CreationOptional<Date>;
    updatedAt: CreationOptional<Date>;
}
