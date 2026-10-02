import { AdminAuditLogs } from "#core/database/AdminAuditLogs";
import type { AdminAuditActionId, AdminAuditSettingId } from "#core/types/AdminAuditLog";

export class AdminAuditLogRepository {
	static async Create(values: {
		adminId: string;
		adminIpAddress: string | null;
		adminDeviceType: string | null;
		adminOperatingSystem: string | null;
		actionId: AdminAuditActionId;
		targetUserId: string | null;
		targetSettingId: AdminAuditSettingId | null;
		previousValue: string;
		newValue: string;
		createdAt: Date;
	}): Promise<void> {
		await AdminAuditLogs.create(values);
	}

	static async FindPage(limit: number, offset: number, actionId?: AdminAuditActionId) {
		return await AdminAuditLogs.findAndCountAll({
			where: actionId === undefined ? undefined : { actionId },
			order: [["createdAt", "DESC"], ["id", "DESC"]],
			limit,
			offset,
		});
	}
}
