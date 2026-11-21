import { AdminAuditLogs } from "#core/database/AdminAuditLogs";
import type { AdminAuditActionId, AdminAuditSettingId } from "#core/types/AdminAuditLog";
export declare class AdminAuditLogRepository {
    static Create(values: {
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
        createdAt: Date;
    }): Promise<void>;
    static FindPage(limit: number, offset: number, actionId?: AdminAuditActionId): Promise<{
        rows: AdminAuditLogs[];
        count: number;
    }>;
}
