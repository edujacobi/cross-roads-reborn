import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminAuditLog } from "#core/models/AdminAuditLog";
import { AdminAuditLogRepository } from "#core/repositories/AdminAuditLogRepository";

describe("Admin audit log", () => {
	afterEach(() => vi.restoreAllMocks());

	it("persists actor identity and JSON before/after values", async () => {
		const create = vi.spyOn(AdminAuditLogRepository, "Create").mockResolvedValue();
		const admin = { userId: "123", username: "Developer" };

		await AdminAuditLog.Record(admin, "setMoney", "Player (456)", { money: 10 }, { money: 25 });

		expect(create).toHaveBeenCalledWith({
			adminId: admin.userId,
			adminName: admin.username,
			action: "setMoney",
			target: "Player (456)",
			previousValue: "{\"money\":10}",
			newValue: "{\"money\":25}",
			createdAt: expect.any(Date),
		});
	});
});
