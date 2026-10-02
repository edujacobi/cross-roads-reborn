import { AdminAuditLogRepository } from "#core/repositories/AdminAuditLogRepository";
import type { AdminAuditActionId, AdminAuditRequestInfo, AdminAuditSettingId } from "#core/types/AdminAuditLog";

export type AdminAuditTarget =
	| { userId: string; settingId?: never }
	| { userId?: never; settingId: AdminAuditSettingId };

export interface AdminAuditEntry {
	id: number;
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
		requestInfo: AdminAuditRequestInfo,
	): Promise<void> {
		const deviceInfo = this.parseUserAgent(requestInfo.userAgent);
		await AdminAuditLogRepository.Create({
			adminId: admin.userId,
			adminIpAddress: requestInfo.ipAddress,
			adminDeviceType: deviceInfo.deviceType,
			adminOperatingSystem: deviceInfo.operatingSystem,
			actionId,
			targetUserId: target.userId ?? null,
			targetSettingId: target.settingId ?? null,
			previousValue: this.serialize(previousValue),
			newValue: this.serialize(newValue),
			createdAt: new Date(),
		});
	}

	private static parseUserAgent(userAgent: string | null): { deviceType: string; operatingSystem: string } {
		if (!userAgent) {
			return { deviceType: "Unknown", operatingSystem: "Unknown" };
		}

		const deviceType = /iPad|Tablet/i.test(userAgent) || (/Android/i.test(userAgent) && !/Mobile/i.test(userAgent))
			? "Tablet"
			: /Mobile|iPhone|iPod/i.test(userAgent)
				? "Mobile"
				: "Desktop";
		const operatingSystem = /Android/i.test(userAgent)
			? "Android"
			: /iPhone|iPad|iPod/i.test(userAgent)
				? "iOS"
				: /Windows NT/i.test(userAgent)
					? "Windows"
					: /Mac OS X/i.test(userAgent)
						? "macOS"
						: /CrOS/i.test(userAgent)
							? "ChromeOS"
							: /Linux/i.test(userAgent)
								? "Linux"
								: "Unknown";

		return { deviceType, operatingSystem };
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
				adminIpAddress: log.adminIpAddress,
				adminDeviceType: log.adminDeviceType,
				adminOperatingSystem: log.adminOperatingSystem,
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
