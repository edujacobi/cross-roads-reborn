"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const AdminAuditLog_1 = require("#core/models/AdminAuditLog");
const AdminAuditLogRepository_1 = require("#core/repositories/AdminAuditLogRepository");
const AdminAuditLog_2 = require("#core/types/AdminAuditLog");
(0, vitest_1.describe)("Admin audit log", () => {
    (0, vitest_1.afterEach)(() => vitest_1.vi.restoreAllMocks());
    (0, vitest_1.it)("persists actor ID, typed action/target IDs and JSON before/after values", async () => {
        const create = vitest_1.vi.spyOn(AdminAuditLogRepository_1.AdminAuditLogRepository, "Create").mockResolvedValue();
        const admin = { userId: "123" };
        await AdminAuditLog_1.AdminAuditLog.Record(admin, AdminAuditLog_2.AdminAuditActionId.SetMoney, { userId: "456" }, { money: 10 }, { money: 25 }, {
            ipAddress: "203.0.113.10",
            userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36",
        });
        (0, vitest_1.expect)(create).toHaveBeenCalledWith({
            adminId: admin.userId,
            adminIpAddress: "203.0.113.10",
            adminDeviceType: "Mobile",
            adminOperatingSystem: "Android",
            adminBrowser: "Chrome",
            actionId: AdminAuditLog_2.AdminAuditActionId.SetMoney,
            targetUserId: "456",
            targetSettingId: null,
            targetGangId: null,
            previousValue: "{\"money\":10}",
            newValue: "{\"money\":25}",
            createdAt: vitest_1.expect.any(Date),
        });
    });
    (0, vitest_1.it)("stores gang targets in the audit log", async () => {
        const create = vitest_1.vi.spyOn(AdminAuditLogRepository_1.AdminAuditLogRepository, "Create").mockResolvedValue();
        await AdminAuditLog_1.AdminAuditLog.Record({ userId: "123" }, AdminAuditLog_2.AdminAuditActionId.SetGangMoney, { gangId: 42 }, 100, 250, { ipAddress: null, userAgent: null });
        (0, vitest_1.expect)(create).toHaveBeenCalledWith(vitest_1.expect.objectContaining({
            actionId: AdminAuditLog_2.AdminAuditActionId.SetGangMoney,
            targetUserId: null,
            targetSettingId: null,
            targetGangId: 42,
            previousValue: "100",
            newValue: "250",
        }));
    });
    (0, vitest_1.it)("prefers Edge over Chrome in Chromium-based user agents", async () => {
        const create = vitest_1.vi.spyOn(AdminAuditLogRepository_1.AdminAuditLogRepository, "Create").mockResolvedValue();
        await AdminAuditLog_1.AdminAuditLog.Record({ userId: "123" }, AdminAuditLog_2.AdminAuditActionId.SetMoney, { userId: "456" }, null, null, {
            ipAddress: null,
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
        });
        (0, vitest_1.expect)(create).toHaveBeenCalledWith(vitest_1.expect.objectContaining({ adminBrowser: "Edge" }));
    });
});
//# sourceMappingURL=AdminAuditLog.test.js.map