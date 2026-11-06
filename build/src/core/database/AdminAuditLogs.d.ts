import { type CreationOptional, type InferAttributes, type InferCreationAttributes, Model } from "sequelize";
import type { AdminAuditActionId, AdminAuditSettingId } from "#core/types/AdminAuditLog";
export declare class AdminAuditLogs extends Model<InferAttributes<AdminAuditLogs>, InferCreationAttributes<AdminAuditLogs>> {
    id: CreationOptional<number>;
    adminId: string;
    adminIpAddress: string | null;
    adminDeviceType: string | null;
    adminOperatingSystem: string | null;
    adminBrowser: string | null;
    actionId: AdminAuditActionId;
    targetUserId: string | null;
    targetSettingId: AdminAuditSettingId | null;
    targetGangId: number | null;
    previousValue: string;
    newValue: string;
    createdAt: CreationOptional<Date>;
}
