import { describe, it, expect, vi, beforeEach } from "vitest";
import { User } from "#core/models/User";
import { Language } from "#core/models/Language";
import { JobId } from "#core/types/Jobs";
import { ClassId } from "#core/types/Classes";
import { Casino } from "#core/models/Casino";
import { ScavengeId } from "#core/types/Scavenge";
import { LocationId } from "#core/types/Locations";

// --- Global Mocks ---

vi.mock("#core/database/Users", () => ({
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

		it("Should fail if user is defending investment", async () => {
			user.Robbery.InvestmentIsDefending = true;
			const result = await Casino.CanUserPlayGame(user, BET_VALUE);
			expect(result.canPlay).toBe(false);
			expect(result.message).toContain("investment");
		});

		it("Should fail if user is participating in gang action", async () => {
			user.Robbery.ParticipatingInGangAction = true;
			const result = await Casino.CanUserPlayGame(user, BET_VALUE);
			expect(result.canPlay).toBe(false);
			expect(result.message).toContain("gang action");
		});

		it("Should succeed", async () => {
			const result = await Casino.CanUserPlayGame(user, BET_VALUE);
			expect(result.canPlay).toBe(true);
		});
	});

	describe("When finishing user game with loss", () => {
		it("Should deduct money and update stats when using FinishUserGameWithLoss", async () => {
			user.Money = 5_000;
			user.Casino.IsInGame = true;
			user.Casino.LoseCount = 10;
			user.Casino.LoseSum = 50_000;

			await Casino.FinishUserGameWithLoss(user, 1_000);

			expect(user.Money).toBe(4_000);
			expect(user.Casino.IsInGame).toBe(false);
			expect(user.Casino.LoseCount).toBe(11);
			expect(user.Casino.LoseSum).toBe(51_000);
		});

		it("Should NOT deduct money but still update stats when using FinishUserGameWithLossNoSubtraction", async () => {
			user.Money = 5_000;
			user.Casino.IsInGame = true;
			user.Casino.LoseCount = 10;
			user.Casino.LoseSum = 50_000;

			await Casino.FinishUserGameWithLossNoSubtraction(user, 1_000);

			expect(user.Money).toBe(5_000);
			expect(user.Casino.IsInGame).toBe(false);
			expect(user.Casino.LoseCount).toBe(11);
			expect(user.Casino.LoseSum).toBe(51_000);
		});
	});
});

