import { type CreationOptional, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
export declare class HorseRaceBets extends Model<InferAttributes<HorseRaceBets>, InferCreationAttributes<HorseRaceBets>> {
    id: CreationOptional<number>;
    userId: string;
    raceId: number;
    horseNumber: number;
    amount: number;
    hasWon: CreationOptional<boolean | null>;
    winnings: CreationOptional<number>;
    createdAt: CreationOptional<Date>;
    updatedAt: CreationOptional<Date>;
}
