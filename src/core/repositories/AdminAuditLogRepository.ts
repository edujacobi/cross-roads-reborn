import { AdminAuditLogs } from "#core/database/AdminAuditLogs";

export class AdminAuditLogRepository {
	static async Create(values: {
		adminId: string;
		adminName: string;
		action: string;
		target: string;
		previousValue: string;
		newValue: string;
		createdAt: Date;
	}): Promise<void> {
		await AdminAuditLogs.create(values);
	}

	static async FindPage(limit: number, offset: number) {
		return await AdminAuditLogs.findAndCountAll({
			order: [["createdAt", "DESC"], ["id", "DESC"]],
			limit,
			offset,
		});
	}
}
