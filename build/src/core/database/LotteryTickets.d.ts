import { type CreationOptional, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
export declare class LotteryTickets extends Model<InferAttributes<LotteryTickets>, InferCreationAttributes<LotteryTickets>> {
    id: CreationOptional<number>;
    userId: string;
    drawId: number;
    amount: number;
    hasWon: CreationOptional<boolean | null>;
    winnings: CreationOptional<number>;
    createdAt: CreationOptional<Date>;
    updatedAt: CreationOptional<Date>;
}
