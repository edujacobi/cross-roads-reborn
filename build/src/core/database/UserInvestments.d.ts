import { type CreationOptional, type ForeignKey, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
import type { Users } from "./Users";
export declare class UserInvestments extends Model<InferAttributes<UserInvestments>, InferCreationAttributes<UserInvestments>> {
    id: CreationOptional<number>;
    userId: ForeignKey<Users["id"]>;
    investmentId: number;
    accumulatedYield: CreationOptional<number>;
    accumulatedFee: CreationOptional<number>;
    henchmanEndsAt: CreationOptional<Date | null>;
    henchmanHospitalized: CreationOptional<boolean>;
    expiresAt: Date;
    lastYieldAt: CreationOptional<Date | null>;
    createdAt: CreationOptional<Date>;
}
