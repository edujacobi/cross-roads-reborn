import { type CreationOptional, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
export declare class HorseRaces extends Model<InferAttributes<HorseRaces>, InferCreationAttributes<HorseRaces>> {
    id: CreationOptional<number>;
    raceTime: Date;
    winningHorse: CreationOptional<number | null>;
    totalBets: CreationOptional<number>;
    totalAmount: CreationOptional<number>;
    isFinished: CreationOptional<boolean>;
    createdAt: CreationOptional<Date>;
    updatedAt: CreationOptional<Date>;
}
