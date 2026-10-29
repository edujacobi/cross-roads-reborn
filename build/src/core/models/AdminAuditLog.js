"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAuditLog = void 0;
const AdminAuditLogRepository_1 = require("#core/repositories/AdminAuditLogRepository");
class AdminAuditLog {
    static serialize(value) {
        const serialized = JSON.stringify(value);
        if (serialized === undefined) {
            throw new TypeError("Admin audit values must be JSON-serializable.");
        }
        return serialized;
    }
    static async Record(admin, actionId, target, previousValue, newValue, requestInfo) {
        const deviceInfo = this.parseUserAgent(requestInfo.userAgent);
        await AdminAuditLogRepository_1.AdminAuditLogRepository.Create({
            adminId: admin.userId,
            adminIpAddress: requestInfo.ipAddress,
            adminDeviceType: deviceInfo.deviceType,
            adminOperatingSystem: deviceInfo.operatingSystem,
            adminBrowser: deviceInfo.browser,
            actionId,
            targetUserId: target.userId ?? null,
            targetSettingId: target.settingId ?? null,
            targetGangId: target.gangId ?? null,
            previousValue: this.serialize(previousValue),
            newValue: this.serialize(newValue),
            createdAt: new Date(),
        });
    }
    static parseUserAgent(userAgent) {
        if (!userAgent) {
            return { deviceType: "Unknown", operatingSystem: "Unknown", browser: "Unknown" };
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
        const browser = /SamsungBrowser/i.test(userAgent)
            ? "Samsung Internet"
            : /Edg(e|A|iOS)?\/|Edge\//i.test(userAgent)
                ? "Edge"
                : /OPR\/|Opera/i.test(userAgent)
                    ? "Opera"
                    : /Firefox|FxiOS/i.test(userAgent)
                        ? "Firefox"
                        : /Chromium/i.test(userAgent)
                            ? "Chromium"
                            : /CriOS|Chrome/i.test(userAgent)
                                ? "Chrome"
                                : /Safari/i.test(userAgent)
                                    ? "Safari"
                                    : "Unknown";
        return { deviceType, operatingSystem, browser };
    }
    static async GetPage(limit, offset, actionId) {
        const page = await AdminAuditLogRepository_1.AdminAuditLogRepository.FindPage(limit, offset, actionId);
        return {
            entries: page.rows.map(log => ({
                id: log.id,
                adminId: log.adminId,
                adminIpAddress: log.adminIpAddress,
                adminDeviceType: log.adminDeviceType,
                adminOperatingSystem: log.adminOperatingSystem,
                adminBrowser: log.adminBrowser,
                actionId: log.actionId,
                targetUserId: log.targetUserId,
                targetSettingId: log.targetSettingId,
                targetGangId: log.targetGangId,
                previousValue: log.previousValue,
                newValue: log.newValue,
                createdAt: log.createdAt,
            })),
            total: page.count,
        };
    }
}
exports.AdminAuditLog = AdminAuditLog;
//# sourceMappingURL=AdminAuditLog.js.map