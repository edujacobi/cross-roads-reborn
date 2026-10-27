import type { AdminAuditActionId, AdminAuditRequestInfo, AdminAuditSettingId } from "#core/types/AdminAuditLog";
export type AdminAuditTarget = {
    userId: string;
    settingId?: never;
    gangId?: never;
} | {
    userId?: never;
    settingId: AdminAuditSettingId;
    gangId?: never;
} | {
    userId?: never;
    settingId?: never;
    gangId: number;
};
export interface AdminAuditEntry {
    id: number;
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
}
export declare class AdminAuditLog {
    private static serialize;
    static Record(admin: {
        userId: string;
    }, actionId: AdminAuditActionId, target: AdminAuditTarget, previousValue: unknown, newValue: unknown, requestInfo: AdminAuditRequestInfo): Promise<void>;
    private static parseUserAgent;
    static GetPage(limit: number, offset: number, actionId?: AdminAuditActionId): Promise<{
        entries: AdminAuditEntry[];
        total: number;
    }>;
}
