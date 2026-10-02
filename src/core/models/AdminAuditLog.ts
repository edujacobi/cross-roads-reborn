import { AdminAuditLogRepository } from "#core/repositories/AdminAuditLogRepository";

export interface AdminAuditEntry {
	id: number;
	adminId: string;
	adminName: string;
	action: string;
	target: string;
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
		admin: { userId: string; username: string },
		action: string,
		target: string,
		previousValue: unknown,
		newValue: unknown,
	): Promise<void> {
		await AdminAuditLogRepository.Create({
			adminId: admin.userId,
			adminName: admin.username,
			action,
			target,
			previousValue: this.serialize(previousValue),
			newValue: this.serialize(newValue),
			createdAt: new Date(),
		});
	}

	static async GetPage(limit: number, offset: number): Promise<{ entries: AdminAuditEntry[]; total: number }> {
		const page = await AdminAuditLogRepository.FindPage(limit, offset);
		return {
			entries: page.rows.map(log => ({
				id: log.id,
				adminId: log.adminId,
				adminName: log.adminName,
				action: log.action,
				target: log.target,
				previousValue: log.previousValue,
				newValue: log.newValue,
				createdAt: log.createdAt,
			})),
			total: page.count,
		};
	}
}
