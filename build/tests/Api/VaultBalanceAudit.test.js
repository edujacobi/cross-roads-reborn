"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const resolvers_1 = require("#api/graphql/resolvers");
const AdminAuditLog_1 = require("#core/models/AdminAuditLog");
const Vault_1 = require("#core/models/Vault");
const VaultRepository_1 = require("#core/repositories/VaultRepository");
const Vault_2 = require("#core/database/Vault");
const AdminAuditLog_2 = require("#core/types/AdminAuditLog");
const Ids_1 = require("#core/types/Ids");
const requestInfo = { ipAddress: "203.0.113.10", userAgent: "Test browser" };
const context = {
    user: {
        userId: "123",
        username: "Admin",
        avatar: null,
        role: "MODERATOR",
        situationId: Ids_1.SituationId.Idling,
    },
    auditRequestInfo: requestInfo,
};
(0, vitest_1.describe)("vault balance administration", () => {
    (0, vitest_1.afterEach)(() => vitest_1.vi.restoreAllMocks());
    vitest_1.it.each([
        ["BANK", "bank", AdminAuditLog_2.AdminAuditSettingId.BankVault, 100],
        ["CASINO", "casino", AdminAuditLog_2.AdminAuditSettingId.CasinoVault, 200],
    ])("updates and audits the %s balance", async (vault, key, settingId, previousValue) => {
        vitest_1.vi.spyOn(Vault_1.Vault, "GetBalances").mockResolvedValue({ bank: 100, casino: 200 });
        const update = vitest_1.vi.spyOn(VaultRepository_1.VaultRepository, "SetBalance").mockResolvedValue();
        const record = vitest_1.vi.spyOn(AdminAuditLog_1.AdminAuditLog, "Record").mockResolvedValue();
        const result = await resolvers_1.resolvers.Mutation.setVaultBalance(null, { vault, amount: 3_085_113_585 }, context);
        (0, vitest_1.expect)(result.success).toBe(true);
        (0, vitest_1.expect)(update).toHaveBeenCalledWith(key, 3_085_113_585);
        (0, vitest_1.expect)(record).toHaveBeenCalledWith({ ...context.user, auditRequestInfo: requestInfo }, AdminAuditLog_2.AdminAuditActionId.SetVaultBalance, { settingId }, previousValue, 3_085_113_585, requestInfo);
    });
    vitest_1.it.each([-1, 1.5, Number.MAX_SAFE_INTEGER + 1])("rejects invalid amount %s", async (amount) => {
        const update = vitest_1.vi.spyOn(Vault_1.Vault, "SetBalance");
        const record = vitest_1.vi.spyOn(AdminAuditLog_1.AdminAuditLog, "Record");
        const result = await resolvers_1.resolvers.Mutation.setVaultBalance(null, { vault: "BANK", amount }, context);
        (0, vitest_1.expect)(result.success).toBe(false);
        (0, vitest_1.expect)(update).not.toHaveBeenCalled();
        (0, vitest_1.expect)(record).not.toHaveBeenCalled();
    });
    vitest_1.it.each([
        ["bank", { bankBalance: 0 }],
        ["casino", { casinoBalance: 0 }],
    ])("updates only the %s balance", async (vault, values) => {
        const update = vitest_1.vi.spyOn(Vault_2.Vault, "update").mockResolvedValue([1]);
        await VaultRepository_1.VaultRepository.SetBalance(vault, 0);
        (0, vitest_1.expect)(update).toHaveBeenCalledWith(values, { where: { id: 1 } });
    });
    (0, vitest_1.it)("rejects read-only users before changing the vault", async () => {
        const update = vitest_1.vi.spyOn(Vault_1.Vault, "SetBalance");
        await (0, vitest_1.expect)(resolvers_1.resolvers.Mutation.setVaultBalance(null, { vault: "BANK", amount: 0 }, {
            ...context,
            user: { ...context.user, role: "PLAYER" },
        })).rejects.toThrow();
        (0, vitest_1.expect)(update).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=VaultBalanceAudit.test.js.map