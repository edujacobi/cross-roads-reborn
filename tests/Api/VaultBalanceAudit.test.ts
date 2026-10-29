import { afterEach, describe, expect, it, vi } from "vitest";
import { resolvers } from "#api/graphql/resolvers";
import { AdminAuditLog } from "#core/models/AdminAuditLog";
import { Vault } from "#core/models/Vault";
import { VaultRepository } from "#core/repositories/VaultRepository";
import { Vault as VaultRow } from "#core/database/Vault";
import { AdminAuditActionId, AdminAuditSettingId } from "#core/types/AdminAuditLog";
import { SituationId } from "#core/types/Ids";

const requestInfo = { ipAddress: "203.0.113.10", userAgent: "Test browser" };
const context = {
	user: {
		userId: "123",
		username: "Admin",
		avatar: null,
		role: "MODERATOR" as const,
		situationId: SituationId.Idling,
	},
	auditRequestInfo: requestInfo,
};

describe("vault balance administration", () => {
	afterEach(() => vi.restoreAllMocks());

	it.each([
		["BANK", "bank", AdminAuditSettingId.BankVault, 100],
		["CASINO", "casino", AdminAuditSettingId.CasinoVault, 200],
	] as const)("updates and audits the %s balance", async (vault, key, settingId, previousValue) => {
		vi.spyOn(Vault, "GetBalances").mockResolvedValue({ bank: 100, casino: 200 });
		const update = vi.spyOn(VaultRepository, "SetBalance").mockResolvedValue();
		const record = vi.spyOn(AdminAuditLog, "Record").mockResolvedValue();

		const result = await resolvers.Mutation.setVaultBalance(null, { vault, amount: 3_085_113_585 }, context);

		expect(result.success).toBe(true);
		expect(update).toHaveBeenCalledWith(key, 3_085_113_585);
		expect(record).toHaveBeenCalledWith(
			{ ...context.user, auditRequestInfo: requestInfo },
			AdminAuditActionId.SetVaultBalance,
			{ settingId },
			previousValue,
			3_085_113_585,
			requestInfo,
		);
	});

	it.each([-1, 1.5, Number.MAX_SAFE_INTEGER + 1])("rejects invalid amount %s", async amount => {
		const update = vi.spyOn(Vault, "SetBalance");
		const record = vi.spyOn(AdminAuditLog, "Record");
		const result = await resolvers.Mutation.setVaultBalance(null, { vault: "BANK", amount }, context);
		expect(result.success).toBe(false);
		expect(update).not.toHaveBeenCalled();
		expect(record).not.toHaveBeenCalled();
	});

	it.each([
		["bank", { bankBalance: 0 }],
		["casino", { casinoBalance: 0 }],
	] as const)("updates only the %s balance", async (vault, values) => {
		const update = vi.spyOn(VaultRow, "update").mockResolvedValue([1]);
		await VaultRepository.SetBalance(vault, 0);
		expect(update).toHaveBeenCalledWith(values, { where: { id: 1 } });
	});

	it("rejects read-only users before changing the vault", async () => {
		const update = vi.spyOn(Vault, "SetBalance");
		await expect(resolvers.Mutation.setVaultBalance(null, { vault: "BANK", amount: 0 }, {
			...context,
			user: { ...context.user, role: "PLAYER" },
		})).rejects.toThrow();
		expect(update).not.toHaveBeenCalled();
	});
});
