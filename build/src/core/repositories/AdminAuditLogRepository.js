"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAuditLogRepository = void 0;
const AdminAuditLogs_1 = require("#core/database/AdminAuditLogs");
class AdminAuditLogRepository {
    static async Create(values) {
        await AdminAuditLogs_1.AdminAuditLogs.create(values);
    }
    static async FindPage(limit, offset, actionId) {
        return await AdminAuditLogs_1.AdminAuditLogs.findAndCountAll({
            where: actionId === undefined ? undefined : { actionId },
            order: [["createdAt", "DESC"], ["id", "DESC"]],
            limit,
            offset,
        });
    }
}
exports.AdminAuditLogRepository = AdminAuditLogRepository;
//# sourceMappingURL=AdminAuditLogRepository.js.map