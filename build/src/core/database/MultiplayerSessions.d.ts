import { type CreationOptional, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
export declare class MultiplayerSessions extends Model<InferAttributes<MultiplayerSessions>, InferCreationAttributes<MultiplayerSessions>> {
    id: string;
    kind: string;
    ownerId: string;
    targetId: string | null;
    gangId: number | null;
    participantIds: string;
    phase: string;
    status: "active" | "completed" | "aborted";
    expiresAt: Date | null;
    result: string | null;
    createdAt: CreationOptional<Date>;
}
export default MultiplayerSessions;
