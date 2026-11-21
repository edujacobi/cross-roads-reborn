import { type CreationOptional, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
export declare class LotteryDraws extends Model<InferAttributes<LotteryDraws>, InferCreationAttributes<LotteryDraws>> {
    id: CreationOptional<number>;
    drawTime: Date;
    winningTicketId: CreationOptional<number | null>;
    totalTickets: CreationOptional<number>;
    totalAmount: CreationOptional<number>;
    isFinished: CreationOptional<boolean>;
    createdAt: CreationOptional<Date>;
    updatedAt: CreationOptional<Date>;
}
