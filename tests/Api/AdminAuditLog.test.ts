import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminAuditLog } from "#core/models/AdminAuditLog";
import { AdminAuditLogRepository } from "#core/repositories/AdminAuditLogRepository";
import { AdminAuditActionId } from "#core/types/AdminAuditLog";

describe("Admin audit log", () => {
	afterEach(() => vi.restoreAllMocks());

	it("persists actor ID, typed action/target IDs and JSON before/after values", async () => {
		const create = vi.spyOn(AdminAuditLogRepository, "Create").mockResolvedValue();
		const admin = { userId: "123" };

		await AdminAuditLog.Record(
			admin,
			AdminAuditActionId.SetMoney,
			{ userId: "456" },
			{ money: 10 },
			{ money: 25 },
			{
				ipAddress: "203.0.113.10",
				userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36",
			},
		);

		expect(create).toHaveBeenCalledWith({
			adminId: admin.userId,
			adminIpAddress: "203.0.113.10",
			adminDeviceType: "Mobile",
			adminOperatingSystem: "Android",
			adminBrowser: "Chrome",
			actionId: AdminAuditActionId.SetMoney,
			targetUserId: "456",
			targetSettingId: null,
			previousValue: "{\"money\":10}",
			newValue: "{\"money\":25}",
			createdAt: expect.any(Date),
		});
	});

	it("prefers Edge over Chrome in Chromium-based user agents", async () => {
		const create = vi.spyOn(AdminAuditLogRepository, "Create").mockResolvedValue();

		await AdminAuditLog.Record(
			{ userId: "123" },
			AdminAuditActionId.SetMoney,
			{ userId: "456" },
			null,
			null,
			{
				ipAddress: null,
				userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
			},
		);

		expect(create).toHaveBeenCalledWith(expect.objectContaining({ adminBrowser: "Edge" }));
	});
});
