import { type CreationOptional, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
import type { GangJoinRequestStatus } from "#core/types/GangRecruitment";
export declare class GangJoinRequests extends Model<InferAttributes<GangJoinRequests>, InferCreationAttributes<GangJoinRequests>> {
    id: CreationOptional<number>;
    gangId: number;
    userId: string;
    message: string | null;
    status: GangJoinRequestStatus;
    createdAt: CreationOptional<Date>;
    updatedAt: CreationOptional<Date>;
}
export default GangJoinRequests;
