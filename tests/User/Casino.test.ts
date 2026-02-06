import { describe, it, expect, vi, beforeEach } from "vitest";
import { User } from "@core/models/User";
import { Language } from "@core/models/Language";
import { JobId } from "@core/types/Jobs";
import { ClassId } from "@core/types/Classes";
import { Casino } from "@core/models/Casino";
import { ScavengeId } from "@core/types/Scavenge";
import { LocationId } from "@core/types/Locations";

// --- Global Mocks ---

vi.mock("@core/database/Users", () => ({
	Users: {
		update: vi.fn(),
		findOne: vi.fn(),
		findByPk: vi.fn(() => Promise.resolve({ class: ClassId.Entrepreneur, nickname: "OtherUser" })),
		findAll: vi.fn(() => Promise.resolve([])),
	},
}));

describe("Casino", () => {
	let user: User;

	beforeEach(() => {
		vi.clearAllMocks();
		user = new User("123", Language.English);
		user.Nickname = "TestUser";
		user.Class = ClassId.Entrepreneur;
		user.Money = 5_000;
	});

	describe("When testing if user can play game", () => {
		const BET_VALUE = 100;

		it("Should fail if user has no money", async () => {
			user.Money = 0;
			const result = await Casino.CanUserPlayGame(user, BET_VALUE);
			expect(result.canPlay).toBe(false);
			expect(result.message).toContain("money");
		});

		it("Should fail if user is scavenging", async () => {
			user.Scavenge.IsScavengingId = ScavengeId.AlienShip;
			const result = await Casino.CanUserPlayGame(user, BET_VALUE);
			expect(result.canPlay).toBe(false);
			expect(result.message).toContain("scavenging");
		});

		it("Should fail if user is working", async () => {
			user.Job.Id = JobId.BlackMarket;
			const result = await Casino.CanUserPlayGame(user, BET_VALUE);
			expect(result.canPlay).toBe(false);
			expect(result.message).toContain("working");
		});

		it("Should fail if user is in prison", async () => {
			user.Prison.Time = new Date(Date.now() + 3_600_000);
			const result = await Casino.CanUserPlayGame(user, BET_VALUE);
			expect(result.canPlay).toBe(false);
			expect(result.message).toContain("prison");
		});

		it("Should fail if user is in hospital", async () => {
			user.Hospital.Time = new Date(Date.now() + 3_600_000);
			const result = await Casino.CanUserPlayGame(user, BET_VALUE);
			expect(result.canPlay).toBe(false);
			expect(result.message).toContain("hospital");
		});

		it("Should fail if user in another casino game", async () => {
			user.Casino.IsInGame = true;
			const result = await Casino.CanUserPlayGame(user, BET_VALUE);
			expect(result.canPlay).toBe(false);
			expect(result.message).toContain("game");
		});
		// in order: isBeatingId, isBeingBeatUpById, isRobbingId, isBeingRobbedById, isRobbingLocationId
		it("Should fail if user is beating up someone", async () => {
			user.BeatUp.IsBeatingId = "123";
			const result = await Casino.CanUserPlayGame(user, BET_VALUE);
			expect(result.canPlay).toBe(false);
			expect(result.message).toContain("beating");
		});

		it("Should fail if user is being beat up", async () => {
			user.BeatUp.IsBeingBeatUpById = "123";
			const result = await Casino.CanUserPlayGame(user, BET_VALUE);
			expect(result.canPlay).toBe(false);
			expect(result.message).toContain("beated");
		});

		it("Should fail if user is robbing someone", async () => {
			user.Robbery.IsRobbingId = "123";
			const result = await Casino.CanUserPlayGame(user, BET_VALUE);
			expect(result.canPlay).toBe(false);
			expect(result.message).toContain("robbing");
		});

		it("Should fail if user is being robbed", async () => {
			user.Robbery.IsBeingRobbedById = "123";
			const result = await Casino.CanUserPlayGame(user, BET_VALUE);
			expect(result.canPlay).toBe(false);
			expect(result.message).toContain("robbed");
		});

		it("Should fail if user is robbing location", async () => {
			user.Robbery.IsRobbingLocationId = LocationId.ArmyDepot;
			const result = await Casino.CanUserPlayGame(user, BET_VALUE);
			expect(result.canPlay).toBe(false);
			expect(result.message).toContain("robbing");
		});

		it("Should succeed", async () => {
			const result = await Casino.CanUserPlayGame(user, BET_VALUE);
			expect(result.canPlay).toBe(true);
		});
	});
});
