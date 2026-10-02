import { AdminAuditLogRepository } from "#core/repositories/AdminAuditLogRepository";
import type { AdminAuditActionId, AdminAuditSettingId } from "#core/types/AdminAuditLog";

export type AdminAuditTarget =
	| { userId: string; settingId?: never }
	| { userId?: never; settingId: AdminAuditSettingId };

export interface AdminAuditEntry {
	id: number;
	adminId: string;
	actionId: AdminAuditActionId;
	targetUserId: string | null;
	targetSettingId: AdminAuditSettingId | null;
	previousValue: string;
	newValue: string;
	createdAt: Date;
}

export class AdminAuditLog {
	private static serialize(value: unknown): string {
		const serialized = JSON.stringify(value);
		if (serialized === undefined) {
			throw new TypeError("Admin audit values must be JSON-serializable.");
		}
		return serialized;
	}

	static async Record(
		admin: { userId: string },
		actionId: AdminAuditActionId,
		target: AdminAuditTarget,
		previousValue: unknown,
		newValue: unknown,
	): Promise<void> {
		await AdminAuditLogRepository.Create({
			adminId: admin.userId,
			actionId,
			targetUserId: target.userId ?? null,
			targetSettingId: target.settingId ?? null,
			previousValue: this.serialize(previousValue),
			newValue: this.serialize(newValue),
			createdAt: new Date(),
		});
	}

	static async GetPage(
		limit: number,
		offset: number,
		actionId?: AdminAuditActionId,
	): Promise<{ entries: AdminAuditEntry[]; total: number }> {
		const page = await AdminAuditLogRepository.FindPage(limit, offset, actionId);
		return {
			entries: page.rows.map(log => ({
				id: log.id,
				adminId: log.adminId,
				actionId: log.actionId,
				targetUserId: log.targetUserId,
				targetSettingId: log.targetSettingId,
				previousValue: log.previousValue,
				newValue: log.newValue,
				createdAt: log.createdAt,
			})),
			total: page.count,
		};
	}
}
