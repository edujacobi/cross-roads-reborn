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
        const isAndroid = /Android/i.test(userAgent);
        const isTablet = /iPad|Tablet/i.test(userAgent) || (isAndroid && !/Mobile/i.test(userAgent));
        let deviceType;
        if (isTablet) {
            deviceType = "Tablet";
        }
        else if (/Mobile|iPhone|iPod/i.test(userAgent)) {
            deviceType = "Mobile";
        }
        else {
            deviceType = "Desktop";
        }
        let operatingSystem = "Unknown";
        if (isAndroid) {
            operatingSystem = "Android";
        }
        else if (/iPhone|iPad|iPod/i.test(userAgent)) {
            operatingSystem = "iOS";
        }
        else if (/Windows NT/i.test(userAgent)) {
            operatingSystem = "Windows";
        }
        else if (/Mac OS X/i.test(userAgent)) {
            operatingSystem = "macOS";
        }
        else if (/CrOS/i.test(userAgent)) {
            operatingSystem = "ChromeOS";
        }
        else if (/Linux/i.test(userAgent)) {
            operatingSystem = "Linux";
        }
        let browser;
        if (/SamsungBrowser/i.test(userAgent)) {
            browser = "Samsung Internet";
        }
        else if (/Edg(e|A|iOS)?\/|Edge\//i.test(userAgent)) {
            browser = "Edge";
        }
        else if (/OPR\/|Opera/i.test(userAgent)) {
            browser = "Opera";
        }
        else if (/Firefox|FxiOS/i.test(userAgent)) {
            browser = "Firefox";
        }
        else if (/Chromium/i.test(userAgent)) {
            browser = "Chromium";
        }
        else if (/CriOS|Chrome/i.test(userAgent)) {
            browser = "Chrome";
        }
        else if (/Safari/i.test(userAgent)) {
            browser = "Safari";
        }
        else {
            browser = "Unknown";
        }
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