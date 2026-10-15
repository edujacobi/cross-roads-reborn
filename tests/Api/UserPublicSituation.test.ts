import { afterEach, describe, expect, it, vi } from "vitest";
import { resolvers } from "#api/graphql/resolvers";
import type { AuthUser } from "#api/types";
import { User, SituationId } from "#core/models/User";

vi.mock("#api/graphql/resolvers/helpers", async importOriginal => {
	const actual = await importOriginal<typeof import("#api/graphql/resolvers/helpers")>();
	return {
		...actual,
		mapUserDetail: vi.fn().mockResolvedValue({
			id: "target",
			isInHospital: true,
			hospitalTime: "2026-10-15T15:00:00.000Z",
			isWorking: true,
			jobEndsIn: "2026-10-15T16:00:00.000Z",
			isDead: false,
			specialCoin: 500,
			automaticGrenade: true,
			language: "en",
			voteCount: 10,
			createdAt: "2020-01-01T00:00:00.000Z",
			updatedAt: "2026-01-01T00:00:00.000Z",
		}),
	};
});

const player: AuthUser = {
	userId: "viewer",
	username: "Player",
	avatar: null,
	role: "PLAYER",
	situationId: SituationId.Idling,
};

afterEach(() => vi.restoreAllMocks());

describe("public user situation", () => {
	it("exposes another player's current situation while keeping private fields hidden", async () => {
		vi.spyOn(User.prototype, "GetInfo").mockImplementation(async function(this: User) {
			return this;
		});

		const result = await resolvers.Query.user(null, { id: "target" }, { user: player });

		expect(result).toMatchObject({
			isInHospital: true,
			hospitalTime: "2026-10-15T15:00:00.000Z",
			isWorking: true,
			jobEndsIn: "2026-10-15T16:00:00.000Z",
			specialCoin: null,
			automaticGrenade: null,
			language: "",
			voteCount: 0,
			createdAt: "",
			updatedAt: "",
		});
	});
});
