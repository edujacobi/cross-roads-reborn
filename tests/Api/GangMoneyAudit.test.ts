import { afterEach, describe, expect, it, vi } from "vitest";
import { resolvers } from "#api/graphql/resolvers";
import { Gang } from "#core/models/Gang";
import { AdminAuditLog } from "#core/models/AdminAuditLog";
import { AdminAuditActionId } from "#core/types/AdminAuditLog";
import { SituationId } from "#core/types/Ids";

describe("gang money audit", () => {
	afterEach(() => vi.restoreAllMocks());

	it("records the acting admin and before/after money for a successful web update", async () => {
		const gang = {
			Money: 100,
			Update: vi.fn().mockResolvedValue(true),
		};
		vi.spyOn(Gang, "GetById").mockResolvedValue(gang as never);
		const record = vi.spyOn(AdminAuditLog, "Record").mockResolvedValue();
		const requestInfo = { ipAddress: "203.0.113.10", userAgent: "Test browser" };

		const result = await resolvers.Mutation.setGangMoney(null, {
			gangId: "42",
			amount: 250,
			mode: "SET",
		}, {
			user: {
				userId: "123",
				username: "Admin",
				avatar: null,
				role: "DEVELOPER",
				situationId: SituationId.Idling,
			},
			auditRequestInfo: requestInfo,
		});

		expect(result.success).toBe(true);
		expect(record).toHaveBeenCalledWith(
			{
				userId: "123",
				username: "Admin",
				avatar: null,
				role: "DEVELOPER",
				situationId: SituationId.Idling,
				auditRequestInfo: requestInfo,
			},
			AdminAuditActionId.SetGangMoney,
			{ gangId: 42 },
			100,
			250,
			requestInfo,
		);
	});
});
