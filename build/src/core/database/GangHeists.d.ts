import { type CreationOptional, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
export declare class GangHeists extends Model<InferAttributes<GangHeists>, InferCreationAttributes<GangHeists>> {
    id: CreationOptional<number>;
    gangId: number;
    heistCooldownUntil: Date | null;
    mission1Completed: boolean;
    mission1CooldownUntil: Date | null;
    mission2Completed: boolean;
    mission2CooldownUntil: Date | null;
    mission3Completed: boolean;
    mission3CooldownUntil: Date | null;
    heistWins: number;
    heistLosses: number;
    totalStolen: number;
}
export default GangHeists;
